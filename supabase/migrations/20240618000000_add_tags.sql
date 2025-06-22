-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  tag_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create content_tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.content_tags (
  content_id INTEGER NOT NULL REFERENCES public.digital_content(content_id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES public.tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

-- Add some initial tags
INSERT INTO public.tags (name) VALUES 
  ('Fiction'),
  ('Non-fiction'),
  ('Academic'),
  ('Reference'),
  ('Textbook'),
  ('Tutorial'),
  ('Research'),
  ('Popular Science'),
  ('Biography'),
  ('History'),
  ('Technology'),
  ('Programming'),
  ('Design'),
  ('Business'),
  ('Self-help'),
  ('Literature');

-- Add RLS policies for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read tags
CREATE POLICY "Anyone can read tags" ON public.tags
  FOR SELECT USING (true);

-- Only admins and librarians can create, update, or delete tags
CREATE POLICY "Admins and librarians can create tags" ON public.tags
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Admins and librarians can update tags" ON public.tags
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Admins and librarians can delete tags" ON public.tags
  FOR DELETE USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

-- Add RLS policies for content_tags
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read content_tags
CREATE POLICY "Anyone can read content_tags" ON public.content_tags
  FOR SELECT USING (true);

-- Only admins and librarians can create, update, or delete content_tags
CREATE POLICY "Admins and librarians can create content_tags" ON public.content_tags
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Admins and librarians can update content_tags" ON public.content_tags
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Admins and librarians can delete content_tags" ON public.content_tags
  FOR DELETE USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

-- Create functions for managing tags
CREATE OR REPLACE FUNCTION public.add_content_tag(p_content_id INTEGER, p_tag_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_tag_id INTEGER;
BEGIN
  -- Get existing tag or create a new one
  SELECT tag_id INTO v_tag_id FROM public.tags WHERE name = p_tag_name;
  
  IF v_tag_id IS NULL THEN
    INSERT INTO public.tags (name) VALUES (p_tag_name) RETURNING tag_id INTO v_tag_id;
  END IF;
  
  -- Add the tag to the content if not already associated
  INSERT INTO public.content_tags (content_id, tag_id)
  VALUES (p_content_id, v_tag_id)
  ON CONFLICT (content_id, tag_id) DO NOTHING;
  
  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 