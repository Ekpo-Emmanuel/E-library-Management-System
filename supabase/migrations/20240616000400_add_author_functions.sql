-- Create a function to insert authors that bypasses RLS
CREATE OR REPLACE FUNCTION insert_author(author_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator (superuser)
AS $$
DECLARE
    new_author_id INTEGER;
BEGIN
    -- Try to insert the author
    INSERT INTO authors (name)
    VALUES (author_name)
    RETURNING author_id INTO new_author_id;
    
    -- Return the new author ID
    RETURN new_author_id;
EXCEPTION
    -- Handle unique constraint violation
    WHEN unique_violation THEN
        -- Get the ID of the existing author
        SELECT author_id INTO new_author_id
        FROM authors
        WHERE name = author_name;
        
        RETURN new_author_id;
END;
$$; 