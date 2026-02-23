-- Fix handle_new_user trigger to prevent it from crashing user creation
-- The trigger must never throw an exception, or GoTrue returns
-- "Database error creating new user" for ALL createUser calls.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create profile with default member role
    BEGIN
        INSERT INTO public.profiles (id, role)
        VALUES (NEW.id, 'member')
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user: profiles insert failed for %: %', NEW.id, SQLERRM;
    END;

    -- Create user_roles entry
    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'member'::user_role_type)
        ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user: user_roles insert failed for %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
