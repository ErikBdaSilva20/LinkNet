
-- =====================================================
-- PART 5: Create helper functions and RLS policies
-- =====================================================

-- Function to check if link is within scheduled time
CREATE OR REPLACE FUNCTION public.is_link_scheduled_active(
  p_schedule_enabled boolean,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT p_schedule_enabled THEN
    RETURN true;
  END IF;
  
  RETURN (
    (p_starts_at IS NULL OR now() >= p_starts_at) AND
    (p_ends_at IS NULL OR now() <= p_ends_at)
  );
END;
$$;

-- Trigger function to validate schedule dates
CREATE OR REPLACE FUNCTION public.validate_link_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.schedule_enabled AND 
     NEW.starts_at IS NOT NULL AND 
     NEW.ends_at IS NOT NULL AND
     NEW.starts_at >= NEW.ends_at THEN
    RAISE EXCEPTION 'starts_at must be before ends_at';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_link_schedule_trigger ON public.links;
CREATE TRIGGER validate_link_schedule_trigger
  BEFORE INSERT OR UPDATE ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_link_schedule();

-- Function to check if user owns a page
CREATE OR REPLACE FUNCTION public.user_owns_page(p_page_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pages pg
    JOIN public.profiles pr ON pg.profile_id = pr.id
    WHERE pg.id = p_page_id AND pr.user_id = auth.uid()
  )
$$;

-- Function to check if page is public
CREATE OR REPLACE FUNCTION public.is_page_public(p_page_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pages pg
    JOIN public.profiles pr ON pg.profile_id = pr.id
    WHERE pg.id = p_page_id 
      AND pr.is_public = true 
      AND pr.handle IS NOT NULL
  )
$$;

-- =====================================================
-- DROP OLD RLS POLICIES
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by handle" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Links
DROP POLICY IF EXISTS "Active links are publicly viewable" ON public.links;
DROP POLICY IF EXISTS "Users can view their own links" ON public.links;
DROP POLICY IF EXISTS "Users can insert their own links" ON public.links;
DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;

-- Themes
DROP POLICY IF EXISTS "Public themes are viewable" ON public.themes;
DROP POLICY IF EXISTS "Users can view their own theme" ON public.themes;
DROP POLICY IF EXISTS "Users can insert their own theme" ON public.themes;
DROP POLICY IF EXISTS "Users can update their own theme" ON public.themes;

-- Page views
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Users can view their page views" ON public.page_views;

-- Clicks (old table)
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.clicks;
DROP POLICY IF EXISTS "Users can view clicks on their links" ON public.clicks;

-- =====================================================
-- CREATE NEW RLS POLICIES
-- =====================================================

-- PROFILES
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND handle IS NOT NULL);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- PAGES
CREATE POLICY "pages_select_own"
  ON public.pages FOR SELECT
  TO authenticated
  USING (public.user_owns_page(id));

CREATE POLICY "pages_select_public"
  ON public.pages FOR SELECT
  TO anon, authenticated
  USING (public.is_page_public(id));

CREATE POLICY "pages_insert_own"
  ON public.pages FOR INSERT
  TO authenticated
  WITH CHECK (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "pages_update_own"
  ON public.pages FOR UPDATE
  TO authenticated
  USING (public.user_owns_page(id));

CREATE POLICY "pages_delete_own"
  ON public.pages FOR DELETE
  TO authenticated
  USING (public.user_owns_page(id));

-- LINKS
CREATE POLICY "links_select_own"
  ON public.links FOR SELECT
  TO authenticated
  USING (public.user_owns_page(page_id));

CREATE POLICY "links_select_public"
  ON public.links FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND public.is_page_public(page_id)
    AND public.is_link_scheduled_active(schedule_enabled, starts_at, ends_at)
  );

CREATE POLICY "links_insert_own"
  ON public.links FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_page(page_id));

CREATE POLICY "links_update_own"
  ON public.links FOR UPDATE
  TO authenticated
  USING (public.user_owns_page(page_id));

CREATE POLICY "links_delete_own"
  ON public.links FOR DELETE
  TO authenticated
  USING (public.user_owns_page(page_id));

-- SHORT_LINKS
CREATE POLICY "short_links_select_public"
  ON public.short_links FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "short_links_insert_own"
  ON public.short_links FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_page(page_id));

CREATE POLICY "short_links_update_own"
  ON public.short_links FOR UPDATE
  TO authenticated
  USING (public.user_owns_page(page_id));

CREATE POLICY "short_links_delete_own"
  ON public.short_links FOR DELETE
  TO authenticated
  USING (public.user_owns_page(page_id));

-- THEMES
CREATE POLICY "themes_select_own"
  ON public.themes FOR SELECT
  TO authenticated
  USING (public.user_owns_page(page_id));

CREATE POLICY "themes_select_public"
  ON public.themes FOR SELECT
  TO anon, authenticated
  USING (public.is_page_public(page_id));

CREATE POLICY "themes_insert_own"
  ON public.themes FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_page(page_id));

CREATE POLICY "themes_update_own"
  ON public.themes FOR UPDATE
  TO authenticated
  USING (public.user_owns_page(page_id));

-- INTEGRATIONS
CREATE POLICY "integrations_select_own"
  ON public.integrations FOR SELECT
  TO authenticated
  USING (public.user_owns_page(page_id));

CREATE POLICY "integrations_insert_own"
  ON public.integrations FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_page(page_id));

CREATE POLICY "integrations_update_own"
  ON public.integrations FOR UPDATE
  TO authenticated
  USING (public.user_owns_page(page_id));

-- PAGE_VIEWS (anon can insert for tracking)
CREATE POLICY "page_views_insert_anon"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "page_views_select_own"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (public.user_owns_page(page_id));

-- LINK_CLICKS (anon can insert for tracking)
CREATE POLICY "link_clicks_insert_anon"
  ON public.link_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "link_clicks_select_own"
  ON public.link_clicks FOR SELECT
  TO authenticated
  USING (link_id IN (
    SELECT l.id FROM public.links l WHERE public.user_owns_page(l.page_id)
  ));

-- DIGITAL_PRODUCTS
CREATE POLICY "products_select_public"
  ON public.digital_products FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND public.is_page_public(page_id));

CREATE POLICY "products_select_own"
  ON public.digital_products FOR SELECT
  TO authenticated
  USING (public.user_owns_page(page_id));

CREATE POLICY "products_insert_own"
  ON public.digital_products FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_page(page_id));

CREATE POLICY "products_update_own"
  ON public.digital_products FOR UPDATE
  TO authenticated
  USING (public.user_owns_page(page_id));

CREATE POLICY "products_delete_own"
  ON public.digital_products FOR DELETE
  TO authenticated
  USING (public.user_owns_page(page_id));

-- ORDERS (anon can insert for purchases)
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  TO authenticated
  USING (product_id IN (
    SELECT dp.id FROM public.digital_products dp WHERE public.user_owns_page(dp.page_id)
  ));

CREATE POLICY "orders_insert_anon"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
