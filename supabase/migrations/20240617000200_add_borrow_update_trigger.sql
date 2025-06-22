-- Create a trigger to restrict what fields regular users can update
CREATE OR REPLACE FUNCTION restrict_borrow_record_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user is admin or librarian
    IF EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'librarian')
    ) THEN
        -- Admins and librarians can update anything
        RETURN NEW;
    ELSE
        -- Regular users can only update status and return_date
        IF (
            NEW.user_id != OLD.user_id OR
            NEW.content_id != OLD.content_id OR
            NEW.borrow_date != OLD.borrow_date OR
            NEW.due_date != OLD.due_date
        ) THEN
            RAISE EXCEPTION 'You can only update the status and return date of your borrowed items';
        END IF;
        
        -- Only allow changing status to 'returned'
        IF NEW.status != 'returned' AND NEW.status != OLD.status THEN
            RAISE EXCEPTION 'You can only mark items as returned';
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_restrict_borrow_updates ON borrow_records;

-- Create the trigger
CREATE TRIGGER trigger_restrict_borrow_updates
BEFORE UPDATE ON borrow_records
FOR EACH ROW
EXECUTE FUNCTION restrict_borrow_record_updates(); 