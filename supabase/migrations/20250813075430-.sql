-- Allow unauthenticated access to check if a user is registered
-- This is safe because we only allow reading the is_registered flag

-- Create a function that can be called without authentication to check registration status
CREATE OR REPLACE FUNCTION public.check_user_registration(user_telegram_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(is_registered, false) 
  FROM public.profiles 
  WHERE id = user_telegram_id;
$$;

-- Create a function to get user profile data (for registered users)
CREATE OR REPLACE FUNCTION public.get_user_profile(user_telegram_id text)
RETURNS TABLE(id text, name text, surname text, user_position text, is_registered boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.id, p.name, p.surname, p.position as user_position, p.is_registered
  FROM public.profiles p
  WHERE p.id = user_telegram_id AND p.is_registered = true;
$$;