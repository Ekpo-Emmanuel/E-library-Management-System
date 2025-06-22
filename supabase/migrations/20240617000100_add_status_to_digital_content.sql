-- Add status column to digital_content table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'digital_content' AND column_name = 'status'
    ) THEN
        ALTER TABLE digital_content
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'borrowed', 'reserved', 'archived'));
    END IF;
END $$; 