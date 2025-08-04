-- Create RPC function to rejoin room (reactivate membership)
CREATE OR REPLACE FUNCTION public.rejoin_room(p_room_id integer, p_user_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.room_members 
  SET is_active = true 
  WHERE room_id = p_room_id AND user_id = p_user_id;
  
  -- Return true if a row was updated (user had previous membership)
  SELECT FOUND;
$$;