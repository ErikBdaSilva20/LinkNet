-- DIAGNOSTIC STEP: check whether auth.uid() is present during INSERT
DROP POLICY IF EXISTS pages_insert_own ON public.pages;

CREATE POLICY pages_insert_own ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);