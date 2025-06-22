-- Create backup status enum
CREATE TYPE backup_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Create system backups table
CREATE TABLE system_backups (
  backup_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status backup_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  file_size BIGINT,
  metadata JSONB
);

-- Add RLS policies
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

-- Only admins can view backups
CREATE POLICY "Admins can view backups"
  ON system_backups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can create backups
CREATE POLICY "Admins can create backups"
  ON system_backups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can update backups
CREATE POLICY "Admins can update backups"
  ON system_backups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to update backup status
CREATE OR REPLACE FUNCTION update_backup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_at when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = timezone('utc', now());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_backup_timestamp
  BEFORE UPDATE ON system_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_timestamp(); 