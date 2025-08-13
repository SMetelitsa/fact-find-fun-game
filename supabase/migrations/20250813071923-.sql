-- Fix infinite recursion in room_members policies
-- The issue is that policies reference each other creating a circular dependency

-- Drop problematic policies first
DROP POLICY IF EXISTS "Users can view memberships in their rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.rooms;
DROP POLICY IF EXISTS "Users can view facts in their active rooms" ON public.facts;
DROP POLICY IF EXISTS "Users can view game stats in their active rooms" ON public.game_stats;

-- Create simpler, non-recursive policies for room_members
CREATE POLICY "Users can view their own room memberships" 
ON public.room_members 
FOR SELECT 
USING (user_id = auth.uid()::text);

-- Create policy for rooms that doesn't depend on room_members
CREATE POLICY "Users can view rooms they created or are invited to" 
ON public.rooms 
FOR SELECT 
USING (
  created_by = auth.uid()::text 
  OR id IN (
    SELECT room_id FROM public.room_members 
    WHERE user_id = auth.uid()::text AND is_active = true
  )
);

-- Create policies for facts that don't create recursion
CREATE POLICY "Users can view facts in rooms they belong to" 
ON public.facts 
FOR SELECT 
USING (
  room_id IN (
    SELECT room_id FROM public.room_members 
    WHERE user_id = auth.uid()::text AND is_active = true
  )
);

-- Create policies for game_stats that don't create recursion
CREATE POLICY "Users can view game stats in rooms they belong to" 
ON public.game_stats 
FOR SELECT 
USING (
  room_id IN (
    SELECT room_id FROM public.room_members 
    WHERE user_id = auth.uid()::text AND is_active = true
  )
);