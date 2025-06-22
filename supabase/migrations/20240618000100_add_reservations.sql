-- Create reservations table
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id INT REFERENCES digital_content(content_id) ON DELETE CASCADE,
    reservation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create waitlist table
CREATE TABLE waitlist (
    waitlist_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id INT REFERENCES digital_content(content_id) ON DELETE CASCADE,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    position INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_id) -- Prevent duplicate waitlist entries
);

-- Create indexes
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_content_id ON reservations(content_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_waitlist_content_id ON waitlist(content_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_position ON waitlist(position);

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reservations
CREATE POLICY "Users can view their own reservations"
    ON reservations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins and librarians can view all reservations"
    ON reservations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'librarian')
    ));

CREATE POLICY "Only admins and librarians can create reservations"
    ON reservations FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'librarian')
    ));

CREATE POLICY "Users can update their own reservations"
    ON reservations FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for waitlist
CREATE POLICY "Users can view their own waitlist entries"
    ON waitlist FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins and librarians can view all waitlist entries"
    ON waitlist FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'librarian')
    ));

CREATE POLICY "Users can add themselves to waitlist"
    ON waitlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from waitlist"
    ON waitlist FOR DELETE
    USING (auth.uid() = user_id);

-- Function to reserve an item
CREATE OR REPLACE FUNCTION reserve_item(
    p_user_id UUID,
    p_content_id INT,
    p_expiry_date TIMESTAMP WITH TIME ZONE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reservation_id INT;
    v_content_status VARCHAR(20);
BEGIN
    -- Check if content is available for reservation
    SELECT status INTO v_content_status
    FROM digital_content
    WHERE content_id = p_content_id;
    
    IF v_content_status NOT IN ('available', 'borrowed') THEN
        RAISE EXCEPTION 'Content is not available for reservation';
    END IF;
    
    -- Create reservation
    INSERT INTO reservations (
        user_id,
        content_id,
        expiry_date,
        status
    ) VALUES (
        p_user_id,
        p_content_id,
        p_expiry_date,
        'pending'
    )
    RETURNING reservation_id INTO v_reservation_id;
    
    -- Update content status
    UPDATE digital_content
    SET status = 'reserved'
    WHERE content_id = p_content_id;
    
    RETURN v_reservation_id;
END;
$$;

-- Function to join waitlist
CREATE OR REPLACE FUNCTION join_waitlist(
    p_user_id UUID,
    p_content_id INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_waitlist_id INT;
    v_position INT;
BEGIN
    -- Get next position in waitlist
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
    FROM waitlist
    WHERE content_id = p_content_id AND status = 'waiting';
    
    -- Add to waitlist
    INSERT INTO waitlist (
        user_id,
        content_id,
        position,
        status
    ) VALUES (
        p_user_id,
        p_content_id,
        v_position,
        'waiting'
    )
    RETURNING waitlist_id INTO v_waitlist_id;
    
    RETURN v_waitlist_id;
END;
$$;

-- Function to update waitlist positions
CREATE OR REPLACE FUNCTION update_waitlist_positions(p_content_id INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_position INT := 1;
    v_record RECORD;
BEGIN
    FOR v_record IN (
        SELECT waitlist_id
        FROM waitlist
        WHERE content_id = p_content_id
          AND status = 'waiting'
        ORDER BY join_date
    ) LOOP
        UPDATE waitlist
        SET position = v_position
        WHERE waitlist_id = v_record.waitlist_id;
        
        v_position := v_position + 1;
    END LOOP;
END;
$$;

-- Trigger to maintain waitlist positions
CREATE OR REPLACE FUNCTION maintain_waitlist_positions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        PERFORM update_waitlist_positions(OLD.content_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintain_waitlist_positions
AFTER DELETE OR UPDATE ON waitlist
FOR EACH ROW
EXECUTE FUNCTION maintain_waitlist_positions(); 