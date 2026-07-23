-- TEMP DEBUG: diagnose why pages INSERT RLS fails in real requests
-- Creates a debug function that raises a clear exception when the check fails.

CREATE OR REPLACE FUNCTION public.debug_pages_insert(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text := current_setting('request.jwt.claim.role', true);
  v_sub text := current_setting('request.jwt.claim.sub', true);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'debug_pages_insert: auth.uid() is NULL; role=% sub=% claims=%',
      v_role,
      v_sub,
      left(coalesce(current_setting('request.jwt.claims', true), ''), 200);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'debug_pages_insert: ownership check failed; uid=% role=% profile_id=%',
      v_uid,
      v_role,
      p_profile_id;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_pages_insert(uuid) TO authenticated;

DROP POLICY IF EXISTS pages_insert_own ON public.pages;
CREATE POLICY pages_insert_own ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.debug_pages_insert(profile_id));