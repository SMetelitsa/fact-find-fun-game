-- Fix critical security issue with profile updates
-- Currently any user can update any profile due to 'USING (true)' condition

-- Drop the overly permissive update policy
DROP POLICY "Users can update their own profile" ON public.profiles;

-- Create a secure policy that only allows users to update their own profile
CREATE POLICY "Users can update only their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid()::text);