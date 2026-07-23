-- Try a different approach: use a subquery directly in the policy
-- instead of a function, similar to how pages_select_own works

DROP POLICY IF EXISTS pages_insert_own ON public.pages;

CREATE POLICY pages_insert_own ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT pr.id 
      FROM public.profiles pr 
      WHERE pr.user_id = auth.uid()
    )
  );