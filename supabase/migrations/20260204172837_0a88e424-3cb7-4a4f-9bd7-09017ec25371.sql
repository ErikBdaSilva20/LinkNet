-- Create SECURITY DEFINER function to check profile ownership
-- This bypasses RLS on profiles table when checking ownership
CREATE OR REPLACE FUNCTION public.user_owns_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id 
    AND user_id = auth.uid()
  )
$$;

-- Update the pages INSERT policy to use the new function
DROP POLICY IF EXISTS pages_insert_own ON public.pages;
CREATE POLICY pages_insert_own ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_profile(profile_id));