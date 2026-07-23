-- Drop the policy first
DROP POLICY IF EXISTS pages_insert_own ON public.pages;

-- Recreate function using direct JWT claim access which is more reliable
CREATE OR REPLACE FUNCTION public.user_owns_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE profiles.id = p_profile_id 
      AND profiles.user_id = (SELECT auth.uid())
  )
$$;

-- Grant to authenticated
GRANT EXECUTE ON FUNCTION public.user_owns_profile(uuid) TO authenticated;

-- Recreate policy with explicit schema
CREATE POLICY pages_insert_own ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_profile(profile_id));