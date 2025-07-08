-- Create profiles table for users
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,  -- Telegram ID as string
  name TEXT NOT NULL DEFAULT 'Guest',
  surname TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create facts table for storing player facts
CREATE TABLE public.facts (
  id TEXT PRIMARY KEY,  -- Telegram ID as string
  fact1 TEXT NOT NULL,
  fact2 TEXT NOT NULL,
  fact3 TEXT NOT NULL,  -- This is the fake fact
  room_id INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(id, room_id, date)  -- One entry per player per room per day
);

-- Create game_stats table for storing guess results
CREATE TABLE public.game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,  -- Telegram ID of the guesser
  aim_id TEXT NOT NULL,     -- Telegram ID of the target player
  chosen_fact TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  room_id INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, aim_id, room_id, date)  -- One guess per player per target per room per day
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (true);

-- RLS Policies for facts
CREATE POLICY "Users can view facts in their rooms" 
ON public.facts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own facts" 
ON public.facts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own facts" 
ON public.facts 
FOR UPDATE 
USING (true);

-- RLS Policies for game_stats
CREATE POLICY "Users can view game stats in their rooms" 
ON public.game_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own guesses" 
ON public.game_stats 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();