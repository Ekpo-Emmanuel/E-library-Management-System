-- Enable Row Level Security for authors table
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- Create policies for authors table
-- Anyone can view authors
CREATE POLICY "Authors are viewable by everyone" 
    ON authors FOR SELECT 
    USING (true);

-- Only admins and librarians can insert authors
CREATE POLICY "Only admins and librarians can insert authors" 
    ON authors FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Only admins and librarians can update authors
CREATE POLICY "Only admins and librarians can update authors" 
    ON authors FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Only admins can delete authors
CREATE POLICY "Only admins can delete authors" 
    ON authors FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    ); 