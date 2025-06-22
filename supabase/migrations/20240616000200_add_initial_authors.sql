-- Add initial authors to the database

-- Check if the authors table exists, create it if not
CREATE TABLE IF NOT EXISTS authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    birth_date DATE,
    nationality VARCHAR(100)
);

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'authors_name_key'
    ) THEN
        ALTER TABLE authors ADD CONSTRAINT authors_name_key UNIQUE (name);
    END IF;
END$$;

-- Insert initial authors if they don't exist
INSERT INTO authors (name, bio, nationality) VALUES
('J.K. Rowling', 'British author best known for the Harry Potter series', 'British')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name, bio, nationality) VALUES
('George Orwell', 'English novelist, essayist, and critic, known for works like 1984 and Animal Farm', 'British')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name, bio, nationality) VALUES
('Jane Austen', 'English novelist known for works like Pride and Prejudice and Emma', 'British')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name, bio, nationality) VALUES
('Stephen King', 'American author of horror, supernatural fiction, suspense, and fantasy novels', 'American')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name, bio, nationality) VALUES
('Toni Morrison', 'American novelist, essayist, and professor who won the Nobel Prize for Literature', 'American')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name, bio, nationality) VALUES
('Gabriel García Márquez', 'Colombian novelist, known for works like One Hundred Years of Solitude', 'Colombian')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name, bio, nationality) VALUES
('Chimamanda Ngozi Adichie', 'Nigerian writer of novels, short stories, and nonfiction', 'Nigerian')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name, bio, nationality) VALUES
('Haruki Murakami', 'Japanese writer whose works blend elements of fantasy and realism', 'Japanese')
ON CONFLICT (name) DO NOTHING; 