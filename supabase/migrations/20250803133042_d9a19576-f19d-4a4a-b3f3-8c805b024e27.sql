-- Fix RLS policy for leaving rooms
DROP POLICY IF EXISTS "Users can leave their rooms" ON public.room_members;

-- Create new policy that allows users to update their own membership status
CREATE POLICY "Users can update their room membership" 
ON public.room_members 
FOR UPDATE 
USING (user_id = (auth.uid())::text);