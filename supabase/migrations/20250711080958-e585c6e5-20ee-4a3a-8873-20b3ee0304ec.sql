-- Add room name to rooms table
ALTER TABLE public.rooms 
ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Room';

-- Create room_members table for many-to-many relationship
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_members
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Create policies for room_members
CREATE POLICY "Users can view room memberships" 
ON public.room_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join rooms" 
ON public.room_members 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can leave their rooms" 
ON public.room_members 
FOR UPDATE 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their room memberships" 
ON public.room_members 
FOR DELETE 
USING (user_id = auth.uid()::text);

-- Add is_registered field to profiles to track registration status
ALTER TABLE public.profiles 
ADD COLUMN is_registered BOOLEAN NOT NULL DEFAULT false;