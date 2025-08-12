-- Fix security issues with game data tables

-- 1. Fix room_members table - users should only see memberships for rooms they are part of
DROP POLICY "Users can view room memberships" ON public.room_members;
CREATE POLICY "Users can view memberships in their rooms" 
ON public.room_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.room_members rm
    WHERE rm.user_id = auth.uid()::text
      AND rm.room_id = room_members.room_id
      AND rm.is_active = true
  )
);

-- 2. Fix rooms table - users should only see rooms they are members of
DROP POLICY "Users can view all rooms" ON public.rooms;
CREATE POLICY "Users can view rooms they are members of" 
ON public.rooms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.room_members rm
    WHERE rm.user_id = auth.uid()::text
      AND rm.room_id = rooms.id
      AND rm.is_active = true
  )
);

-- 3. Fix room update policy to be more restrictive
DROP POLICY "Room creators can update their rooms" ON public.rooms;
CREATE POLICY "Room creators can update their own rooms" 
ON public.rooms 
FOR UPDATE 
USING (created_by = auth.uid()::text);

-- 4. Fix facts table policies to be more restrictive
DROP POLICY "Users can view facts in their rooms" ON public.facts;
DROP POLICY "Users can insert their own facts" ON public.facts;
DROP POLICY "Users can update their own facts" ON public.facts;

CREATE POLICY "Users can view facts in their active rooms" 
ON public.facts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.room_members rm
    WHERE rm.user_id = auth.uid()::text
      AND rm.room_id = facts.room_id
      AND rm.is_active = true
  )
);

CREATE POLICY "Users can insert facts in their active rooms" 
ON public.facts 
FOR INSERT 
WITH CHECK (
  id = auth.uid()::text
  AND EXISTS (
    SELECT 1 
    FROM public.room_members rm
    WHERE rm.user_id = auth.uid()::text
      AND rm.room_id = facts.room_id
      AND rm.is_active = true
  )
);

CREATE POLICY "Users can update their own facts in active rooms" 
ON public.facts 
FOR UPDATE 
USING (
  id = auth.uid()::text
  AND EXISTS (
    SELECT 1 
    FROM public.room_members rm
    WHERE rm.user_id = auth.uid()::text
      AND rm.room_id = facts.room_id
      AND rm.is_active = true
  )
);

-- 5. Fix game_stats table policies
DROP POLICY "Users can view game stats in their rooms" ON public.game_stats;
DROP POLICY "Users can insert their own guesses" ON public.game_stats;

CREATE POLICY "Users can view game stats in their active rooms" 
ON public.game_stats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.room_members rm
    WHERE rm.user_id = auth.uid()::text
      AND rm.room_id = game_stats.room_id
      AND rm.is_active = true
  )
);

CREATE POLICY "Users can insert guesses in their active rooms" 
ON public.game_stats 
FOR INSERT 
WITH CHECK (
  player_id = auth.uid()::text
  AND EXISTS (
    SELECT 1 
    FROM public.room_members rm
    WHERE rm.user_id = auth.uid()::text
      AND rm.room_id = game_stats.room_id
      AND rm.is_active = true
  )
);

-- 6. Fix room_members insert policy to be more restrictive
DROP POLICY "Users can join rooms" ON public.room_members;
CREATE POLICY "Users can join rooms as themselves" 
ON public.room_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);