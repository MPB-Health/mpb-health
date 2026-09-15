-- Add staff_hr to user_role_type (must commit before use in later migration).
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'staff_hr';
