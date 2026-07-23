-- First drop the policy that depends on the function
DROP POLICY IF EXISTS pages_insert_own ON public.pages;

-- Now we can safely recreate the function with explicit permissions
CREATE OR REPLACE FUNCTION public.user_owns_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.user_owns_profile(uuid) TO authenticated;

-- Recreate the policy using the updated function
CREATE POLICY pages_insert_own ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_profile(profile_id));