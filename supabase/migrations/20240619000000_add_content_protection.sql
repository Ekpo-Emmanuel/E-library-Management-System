-- Add new columns to digital_content table
ALTER TABLE digital_content
ADD COLUMN access_level VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (access_level IN ('public', 'restricted', 'institution_only', 'subscription_only')),
ADD COLUMN view_mode VARCHAR(20) NOT NULL DEFAULT 'full_access' CHECK (view_mode IN ('full_access', 'view_only')),
ADD COLUMN institution_id UUID REFERENCES profiles(id),
ADD COLUMN watermark_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN drm_enabled BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster access level queries
CREATE INDEX idx_digital_content_access_level ON digital_content(access_level);

-- Update RLS policies for digital_content table
DROP POLICY IF EXISTS "Digital content is viewable by everyone" ON digital_content;

-- Create new content access policies
CREATE POLICY "Public content is viewable by everyone"
    ON digital_content FOR SELECT
    USING (
        access_level = 'public'
        OR (
            access_level = 'restricted' 
            AND auth.role() = 'authenticated'
        )
        OR (
            access_level = 'institution_only' 
            AND auth.role() = 'authenticated'
            AND EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND id = institution_id
            )
        )
        OR (
            access_level = 'subscription_only'
            AND auth.role() = 'authenticated'
            AND EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'librarian', 'student')
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'librarian')
        )
    );

-- Function to apply watermark to content
CREATE OR REPLACE FUNCTION apply_watermark(
    p_content_id INT,
    p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_content_url TEXT;
    v_user_name TEXT;
BEGIN
    -- Get content URL and user name
    SELECT dc.file_url, p.name
    INTO v_content_url, v_user_name
    FROM digital_content dc
    JOIN profiles p ON p.id = p_user_id
    WHERE dc.content_id = p_content_id;

    -- In a real implementation, this would call an external service
    -- to apply a watermark with user information
    -- For now, we'll just return the original URL with a note
    RETURN v_content_url || '?watermark=' || v_user_name;
END;
$$;

-- Function to get protected content URL
CREATE OR REPLACE FUNCTION get_protected_content_url(
    p_content_id INT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_content digital_content;
    v_user_id UUID;
    v_url TEXT;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Get content details
    SELECT * INTO v_content
    FROM digital_content
    WHERE content_id = p_content_id;
    
    -- Check access permissions
    IF NOT (
        v_content.access_level = 'public'
        OR (
            v_content.access_level = 'restricted' 
            AND auth.role() = 'authenticated'
        )
        OR (
            v_content.access_level = 'institution_only' 
            AND auth.role() = 'authenticated'
            AND v_content.institution_id = v_user_id
        )
        OR (
            v_content.access_level = 'subscription_only'
            AND auth.role() = 'authenticated'
            AND EXISTS (
                SELECT 1 FROM profiles
                WHERE id = v_user_id
                AND role IN ('admin', 'librarian', 'student')
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = v_user_id
            AND role IN ('admin', 'librarian')
        )
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Get base URL
    v_url := v_content.file_url;
    
    -- Apply protections based on content settings
    IF v_content.watermark_enabled THEN
        v_url := apply_watermark(p_content_id, v_user_id);
    END IF;
    
    IF v_content.drm_enabled THEN
        -- In a real implementation, this would apply DRM protection
        -- For now, we'll just add a parameter
        v_url := v_url || '&drm=enabled';
    END IF;
    
    -- If view-only mode, add parameter for viewer application
    IF v_content.view_mode = 'view_only' THEN
        v_url := v_url || '&mode=view_only';
    END IF;
    
    RETURN v_url;
END;
$$; 