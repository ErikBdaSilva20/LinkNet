-- Recreate function with explicit auth schema reference
-- and grant to authenticated role specifically
DROP POLICY IF EXISTS pages_insert_own ON public.pages;

CREATE OR REPLACE FUNCTION public.user_owns_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE profiles.id = p_profile_id 
      AND profiles.user_id = auth.uid()
  )
$$;

-- Grant to all relevant roles
GRANT EXECUTE ON FUNCTION public.user_owns_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_profile(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.user_owns_profile(uuid) TO service_role;

-- Recreate policy
CREATE POLICY pages_insert_own ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_profile(profile_id));