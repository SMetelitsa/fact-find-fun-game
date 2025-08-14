-- Disable RLS on profiles table for Telegram authentication
-- Since we're using Telegram user IDs and managing auth at the application level,
-- we don't need RLS on the profiles table

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;