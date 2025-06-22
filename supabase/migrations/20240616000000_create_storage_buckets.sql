-- Create storage buckets for digital content and cover images

-- Create the digital-content bucket for storing all library content files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-content',
  'digital-content',
  TRUE, -- Make it public so files can be accessed without authentication
  104857600, -- 100MB size limit
  ARRAY[
    'application/pdf',
    'application/epub+zip',
    'application/x-mobipocket-ebook',
    'audio/mpeg',
    'video/mp4',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the digital-content bucket
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'digital-content');

-- Allow content upload for admins and librarians
CREATE POLICY "Admin and Librarian Upload Access"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'digital-content' AND
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  )
);

-- Allow content update for admins and librarians
CREATE POLICY "Admin and Librarian Update Access"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'digital-content' AND
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  )
)
WITH CHECK (
  bucket_id = 'digital-content' AND
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  )
);

-- Allow content deletion for admins and librarians
CREATE POLICY "Admin and Librarian Delete Access"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'digital-content' AND
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  )
); 