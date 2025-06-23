-- Update the insert_digital_content function to include new parameters
CREATE OR REPLACE FUNCTION insert_digital_content(
    p_title VARCHAR(255),
    p_description TEXT,
    p_file_type VARCHAR(20),
    p_file_url VARCHAR(255),
    p_cover_image_url VARCHAR(255),
    p_genre_id INT,
    p_publisher VARCHAR(255),
    p_created_by UUID,
    p_updated_by UUID,
    p_access_level VARCHAR(20),
    p_view_mode VARCHAR(20),
    p_institution_id UUID,
    p_watermark_enabled BOOLEAN,
    p_drm_enabled BOOLEAN
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_content_id INT;
BEGIN
    -- Insert the digital content
    INSERT INTO digital_content (
        title,
        description,
        file_type,
        file_url,
        cover_image_url,
        genre_id,
        publisher,
        created_by,
        updated_by,
        access_level,
        view_mode,
        institution_id,
        watermark_enabled,
        drm_enabled
    ) VALUES (
        p_title,
        p_description,
        p_file_type,
        p_file_url,
        p_cover_image_url,
        p_genre_id,
        p_publisher,
        p_created_by,
        p_updated_by,
        p_access_level,
        p_view_mode,
        p_institution_id,
        p_watermark_enabled,
        p_drm_enabled
    )
    RETURNING content_id INTO new_content_id;
    
    -- Return the new content ID
    RETURN new_content_id;
END;
$$; 