-- Fix profiles RLS policies to allow proper user registration
-- The current INSERT policy might be causing issues

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new INSERT policy that ensures users can only create their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid()::text);

-- Also ensure the SELECT policy allows users to see their own profile during registration
DROP POLICY IF EXISTS "Users can view own profile and profiles in shared rooms" ON public.profiles;

CREATE POLICY "Users can view own profile and profiles in shared rooms" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid()::text 
  OR EXISTS (
    SELECT 1 FROM public.room_members rm1
    JOIN public.room_members rm2 ON rm1.room_id = rm2.room_id
    WHERE rm1.user_id = auth.uid()::text 
    AND rm2.user_id = profiles.id 
    AND rm1.is_active = true 
    AND rm2.is_active = true
  )
);