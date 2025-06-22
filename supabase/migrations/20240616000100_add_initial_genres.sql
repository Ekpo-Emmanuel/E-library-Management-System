-- Add initial genres to the database

-- Check if the genres table exists, create it if not
CREATE TABLE IF NOT EXISTS genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'genres_name_key'
    ) THEN
        ALTER TABLE genres ADD CONSTRAINT genres_name_key UNIQUE (name);
    END IF;
END$$;

-- Insert initial genres if they don't exist
INSERT INTO genres (name, description) VALUES
('Fiction', 'Literary works created from the imagination, not based on real events')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Non-Fiction', 'Prose writing that is based on facts, real events, and real people')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Science Fiction', 'Fiction based on imagined future scientific or technological advances')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Fantasy', 'Fiction featuring magical elements and supernatural phenomena')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Mystery', 'Fiction dealing with the solution of a crime or the revealing of secrets')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Biography', 'A written account of another person''s life')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('History', 'The study of past events, particularly in human affairs')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Science', 'The intellectual and practical activity encompassing the study of the physical and natural world')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Technology', 'The application of scientific knowledge for practical purposes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Self-Help', 'Books that aim to help readers solve personal problems')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Poetry', 'Literary work in which special intensity is given to the expression of feelings and ideas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name, description) VALUES
('Drama', 'The specific mode of fiction represented in performance')
ON CONFLICT (name) DO NOTHING; 