-- First, add status column to digital_content
\i 'supabase/migrations/20240617000100_add_status_to_digital_content.sql'

-- Then create borrow_records table and related functions
\i 'supabase/migrations/20240617000000_create_borrow_records.sql'

-- Add the borrow update trigger
\i 'supabase/migrations/20240617000200_add_borrow_update_trigger.sql'

-- Add tags support
\i 'supabase/migrations/20240618000000_add_tags.sql'

-- Add reservations and waitlist
\i 'supabase/migrations/20240618000100_add_reservations.sql'

-- Add content protection
\i 'supabase/migrations/20240619000000_add_content_protection.sql'

-- Add external systems support
\i 'supabase/migrations/20240620000000_add_external_systems.sql'

-- Finally run any other migrations
\i 'supabase/migrations/20240616000400_add_author_functions.sql'
\i 'supabase/migrations/20240616000700_add_content_functions_only.sql' 