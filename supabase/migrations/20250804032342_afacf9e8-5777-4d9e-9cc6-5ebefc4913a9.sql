-- Create RPC function to reactivate room membership
CREATE OR REPLACE FUNCTION public.reactivate_room_membership(p_room_id integer, p_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.room_members 
  SET is_active = true 
  WHERE room_id = p_room_id AND user_id = p_user_id AND is_active = false;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;