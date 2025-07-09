-- Create rooms table
CREATE TABLE public.rooms (
  id INTEGER PRIMARY KEY,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add room_id to profiles table  
ALTER TABLE public.profiles ADD COLUMN current_room_id INTEGER;

-- Remove unique constraint from facts to allow history
ALTER TABLE public.facts DROP CONSTRAINT facts_id_room_id_date_key;

-- Enable RLS for rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Users can view all rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create rooms" 
ON public.rooms 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Room creators can update their rooms" 
ON public.rooms 
FOR UPDATE 
USING (true);