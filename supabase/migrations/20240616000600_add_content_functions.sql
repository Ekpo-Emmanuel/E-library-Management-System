-- Create a function to insert digital content that bypasses RLS
CREATE OR REPLACE FUNCTION insert_digital_content(
    p_title VARCHAR(255),
    p_description TEXT,
    p_file_type VARCHAR(20),
    p_file_url VARCHAR(255),
    p_cover_image_url VARCHAR(255),
    p_genre_id INT,
    p_publisher VARCHAR(255),
    p_created_by UUID,
    p_updated_by UUID
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
        updated_by
    ) VALUES (
        p_title,
        p_description,
        p_file_type,
        p_file_url,
        p_cover_image_url,
        p_genre_id,
        p_publisher,
        p_created_by,
        p_updated_by
    )
    RETURNING content_id INTO new_content_id;
    
    -- Return the new content ID
    RETURN new_content_id;
END;
$$;

-- Create a function to insert book authors that bypasses RLS
CREATE OR REPLACE FUNCTION insert_book_author(
    p_content_id INT,
    p_author_id INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert the book author association
    INSERT INTO book_authors (content_id, author_id)
    VALUES (p_content_id, p_author_id);
END;
$$; 