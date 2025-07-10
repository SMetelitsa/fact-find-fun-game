-- Fix facts table structure to allow multiple entries per player per day
-- Remove PRIMARY KEY from id column and add proper UUID primary key
ALTER TABLE public.facts DROP CONSTRAINT facts_pkey;

-- Add UUID primary key column
ALTER TABLE public.facts ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid();

-- Make the new UUID column the primary key
ALTER TABLE public.facts ADD PRIMARY KEY (uuid_id);

-- The UNIQUE constraint (id, room_id, date) already ensures one entry per player per room per day