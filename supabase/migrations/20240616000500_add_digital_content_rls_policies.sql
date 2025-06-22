-- Enable Row Level Security for digital_content table
ALTER TABLE digital_content ENABLE ROW LEVEL SECURITY;

-- Create policies for digital_content table
-- Anyone can view digital content
CREATE POLICY "Digital content is viewable by everyone" 
    ON digital_content FOR SELECT 
    USING (true);

-- Only admins and librarians can insert digital content
CREATE POLICY "Only admins and librarians can insert digital content" 
    ON digital_content FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Only admins and librarians can update digital content
CREATE POLICY "Only admins and librarians can update digital content" 
    ON digital_content FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Only admins and librarians can delete digital content
CREATE POLICY "Only admins and librarians can delete digital content" 
    ON digital_content FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Enable Row Level Security for book_authors table
ALTER TABLE book_authors ENABLE ROW LEVEL SECURITY;

-- Create policies for book_authors table
-- Anyone can view book_authors
CREATE POLICY "Book authors are viewable by everyone" 
    ON book_authors FOR SELECT 
    USING (true);

-- Only admins and librarians can insert book_authors
CREATE POLICY "Only admins and librarians can insert book_authors" 
    ON book_authors FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Only admins and librarians can delete book_authors
CREATE POLICY "Only admins and librarians can delete book_authors" 
    ON book_authors FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    ); 