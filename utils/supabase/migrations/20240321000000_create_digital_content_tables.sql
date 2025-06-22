-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    birth_date DATE,
    nationality VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create digital_content table
CREATE TABLE IF NOT EXISTS digital_content (
    content_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_type VARCHAR(20) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    cover_image_url VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved', 'archived')),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    genre_id INT REFERENCES genres(genre_id) ON DELETE SET NULL,
    publisher VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create book_authors table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS book_authors (
    content_id INT REFERENCES digital_content(content_id) ON DELETE CASCADE,
    author_id INT REFERENCES authors(author_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (content_id, author_id)
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_genres_updated_at
    BEFORE UPDATE ON genres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authors_updated_at
    BEFORE UPDATE ON authors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_content_updated_at
    BEFORE UPDATE ON digital_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_authors ENABLE ROW LEVEL SECURITY;

-- Create policies for genres
CREATE POLICY "Genres are viewable by everyone"
    ON genres FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Genres are editable by admins and librarians"
    ON genres FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Create policies for authors
CREATE POLICY "Authors are viewable by everyone"
    ON authors FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authors are editable by admins and librarians"
    ON authors FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Create policies for digital_content
CREATE POLICY "Digital content is viewable by everyone"
    ON digital_content FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Digital content is editable by admins and librarians"
    ON digital_content FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Create policies for book_authors
CREATE POLICY "Book authors are viewable by everyone"
    ON book_authors FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Book authors are editable by admins and librarians"
    ON book_authors FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Create indexes for better query performance
CREATE INDEX idx_digital_content_genre ON digital_content(genre_id);
CREATE INDEX idx_digital_content_status ON digital_content(status);
CREATE INDEX idx_digital_content_created_by ON digital_content(created_by);
CREATE INDEX idx_book_authors_content ON book_authors(content_id);
CREATE INDEX idx_book_authors_author ON book_authors(author_id);

-- Insert some initial genres
INSERT INTO genres (name, description) VALUES
    ('Fiction', 'Works of fiction including novels and short stories'),
    ('Non-Fiction', 'Factual works including biographies and textbooks'),
    ('Science', 'Scientific works and research papers'),
    ('Technology', 'Technology-related content and documentation'),
    ('History', 'Historical works and accounts')
ON CONFLICT (name) DO NOTHING;

-- Insert some initial authors
INSERT INTO authors (name, bio) VALUES
    ('Jane Doe', 'Contemporary fiction writer'),
    ('John Smith', 'Science and technology author'),
    ('Alice Johnson', 'Historical non-fiction writer')
ON CONFLICT (name) DO NOTHING; 