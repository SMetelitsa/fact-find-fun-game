-- Create RPC function to leave room (bypass RLS)
CREATE OR REPLACE FUNCTION public.leave_room(p_room_id integer, p_user_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.room_members 
  SET is_active = false 
  WHERE room_id = p_room_id AND user_id = p_user_id;
$$;