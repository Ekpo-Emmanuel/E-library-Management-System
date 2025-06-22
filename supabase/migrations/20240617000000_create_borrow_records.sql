-- Create borrow_records table
CREATE TABLE borrow_records (
    borrow_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id INT REFERENCES digital_content(content_id) ON DELETE CASCADE,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_borrow_records_user_id ON borrow_records(user_id);
CREATE INDEX idx_borrow_records_content_id ON borrow_records(content_id);
CREATE INDEX idx_borrow_records_status ON borrow_records(status);
CREATE INDEX idx_borrow_records_due_date ON borrow_records(due_date);

-- Enable Row Level Security
ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own borrow records" ON borrow_records;
DROP POLICY IF EXISTS "Admins and librarians can view all borrow records" ON borrow_records;
DROP POLICY IF EXISTS "Only admins and librarians can insert borrow records" ON borrow_records;
DROP POLICY IF EXISTS "Users can update their own borrow records" ON borrow_records;
DROP POLICY IF EXISTS "Admins and librarians can update any borrow record" ON borrow_records;
DROP POLICY IF EXISTS "Only admins can delete borrow records" ON borrow_records;

-- Everyone can view their own borrow records
CREATE POLICY "Users can view their own borrow records"
    ON borrow_records FOR SELECT
    USING (auth.uid() = user_id);

-- Admins and librarians can view all borrow records
CREATE POLICY "Admins and librarians can view all borrow records"
    ON borrow_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Only admins and librarians can insert borrow records
CREATE POLICY "Only admins and librarians can insert borrow records"
    ON borrow_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Users can update their own borrow records (for self-service returns)
CREATE POLICY "Users can update their own borrow records"
    ON borrow_records FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins and librarians can update any borrow record
CREATE POLICY "Admins and librarians can update any borrow record"
    ON borrow_records FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Only admins can delete borrow records
CREATE POLICY "Only admins can delete borrow records"
    ON borrow_records FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create a trigger to update the content status when borrowed or returned
CREATE OR REPLACE FUNCTION update_content_status_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
        IF NEW.status = 'borrowed' THEN
            -- Update content status to 'borrowed' when a new borrow record is created
            UPDATE digital_content
            SET status = 'borrowed'
            WHERE content_id = NEW.content_id;
        ELSIF NEW.status = 'returned' THEN
            -- Update content status to 'available' when item is returned
            UPDATE digital_content
            SET status = 'available'
            WHERE content_id = NEW.content_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_content_status ON borrow_records;

-- Create the trigger
CREATE TRIGGER trigger_update_content_status
AFTER INSERT OR UPDATE ON borrow_records
FOR EACH ROW
EXECUTE FUNCTION update_content_status_on_borrow();

-- Create a function to borrow an item that bypasses RLS
CREATE OR REPLACE FUNCTION borrow_item(
    p_user_id UUID,
    p_content_id INT,
    p_due_date DATE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_borrow_id INT;
    v_content_status VARCHAR(20);
BEGIN
    -- Check if content is available
    SELECT status INTO v_content_status
    FROM digital_content
    WHERE content_id = p_content_id;
    
    IF v_content_status != 'available' THEN
        RAISE EXCEPTION 'Content is not available for borrowing';
    END IF;
    
    -- Insert borrow record
    INSERT INTO borrow_records (
        user_id,
        content_id,
        borrow_date,
        due_date,
        status
    ) VALUES (
        p_user_id,
        p_content_id,
        CURRENT_DATE,
        p_due_date,
        'borrowed'
    )
    RETURNING borrow_id INTO v_borrow_id;
    
    RETURN v_borrow_id;
END;
$$;

-- Create a function to return an item that bypasses RLS
CREATE OR REPLACE FUNCTION return_item(
    p_borrow_id INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if borrow record exists
    SELECT EXISTS(
        SELECT 1 FROM borrow_records
        WHERE borrow_id = p_borrow_id AND status = 'borrowed'
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        RAISE EXCEPTION 'Invalid borrow record or item already returned';
    END IF;
    
    -- Update borrow record
    UPDATE borrow_records
    SET 
        status = 'returned',
        return_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
    WHERE borrow_id = p_borrow_id;
    
    RETURN TRUE;
END;
$$; 