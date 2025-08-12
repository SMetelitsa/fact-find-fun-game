-- Drop the overly permissive policy that allows viewing all profiles
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Create a new, more secure policy that allows:
-- 1. Users to view their own profile
-- 2. Users to view profiles of other users in the same room
CREATE POLICY "Users can view own profile and profiles in shared rooms" 
ON public.profiles 
FOR SELECT 
USING (
  -- User can always view their own profile
  id = auth.uid()::text 
  OR 
  -- User can view profiles of others in the same room
  EXISTS (
    SELECT 1 
    FROM public.room_members rm1
    JOIN public.room_members rm2 ON rm1.room_id = rm2.room_id
    WHERE rm1.user_id = auth.uid()::text
      AND rm2.user_id = profiles.id
      AND rm1.is_active = true
      AND rm2.is_active = true
  )
);