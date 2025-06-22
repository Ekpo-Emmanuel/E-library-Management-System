-- Drop existing objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'librarian', 'student', 'guest')),
    address VARCHAR(255),
    phone VARCHAR(20),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create a function to check if user is admin (to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
    RETURN user_role = 'admin';
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin policies using the function
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE
    USING (is_admin() OR auth.uid() = id)
    WITH CHECK (is_admin() OR auth.uid() = id);

-- Create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(20);
    user_name text;
    error_context text;
BEGIN
    -- Log the incoming data
    RAISE LOG 'New user signup - User ID: %, Metadata: %', NEW.id, NEW.raw_user_meta_data;

    -- Safely extract name
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');

    -- Safely extract role
    BEGIN
        user_role := COALESCE(
            NEW.raw_user_meta_data->>'role',
            'student'
        );
        
        -- Validate role
        IF user_role NOT IN ('admin', 'librarian', 'student', 'guest') THEN
            user_role := 'student';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Log the role extraction error
        RAISE LOG 'Error extracting role for user %: %', NEW.id, SQLERRM;
        user_role := 'student';
    END;

    -- Log the extracted values
    RAISE LOG 'Extracted values - Name: %, Role: %', user_name, user_role;

    -- Insert the new profile with error context
    BEGIN
        INSERT INTO public.profiles (
            id,
            name,
            role
        ) VALUES (
            NEW.id,
            user_name,
            user_role
        );
        
        RAISE LOG 'Successfully created profile for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        -- Log detailed error information
        GET STACKED DIAGNOSTICS error_context = PG_EXCEPTION_CONTEXT;
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RAISE LOG 'Error context: %', error_context;
        RAISE;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 