-- Create external_systems table
CREATE TABLE IF NOT EXISTS public.external_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('moodle', 'jstor', 'proquest', 'other')),
    url VARCHAR(255) NOT NULL,
    api_key TEXT,
    client_id TEXT,
    client_secret TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Create external_content_mappings table for linking external resources
CREATE TABLE IF NOT EXISTS public.external_content_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id INTEGER REFERENCES public.digital_content(content_id) ON DELETE CASCADE,
    external_system_id UUID REFERENCES public.external_systems(id) ON DELETE CASCADE,
    external_resource_id VARCHAR(255) NOT NULL,
    external_url VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(content_id, external_system_id, external_resource_id)
);

-- Add RLS policies
ALTER TABLE public.external_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_content_mappings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage external systems
CREATE POLICY "Admins can manage external systems"
    ON public.external_systems
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins and librarians can view external systems
CREATE POLICY "Admins and librarians can view external systems"
    ON public.external_systems
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'librarian')
        )
    );

-- Only admins can manage external content mappings
CREATE POLICY "Admins can manage external content mappings"
    ON public.external_content_mappings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins and librarians can view external content mappings
CREATE POLICY "Admins and librarians can view external content mappings"
    ON public.external_content_mappings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'librarian')
        )
    );

-- Create updated_at trigger for external_systems
CREATE TRIGGER update_external_systems_updated_at
    BEFORE UPDATE ON public.external_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for external_content_mappings
CREATE TRIGGER update_external_content_mappings_updated_at
    BEFORE UPDATE ON public.external_content_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_external_systems_type ON public.external_systems(type);
CREATE INDEX idx_external_content_mappings_content ON public.external_content_mappings(content_id);
CREATE INDEX idx_external_content_mappings_system ON public.external_content_mappings(external_system_id);

-- Function to sync external content
CREATE OR REPLACE FUNCTION sync_external_content(
    p_system_id UUID,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update last sync time
    UPDATE public.external_systems
    SET 
        last_sync_at = now(),
        updated_at = now()
    WHERE id = p_system_id;
    
    RETURN TRUE;
END;
$$; 