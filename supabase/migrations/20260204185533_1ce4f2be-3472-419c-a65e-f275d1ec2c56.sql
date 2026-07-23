-- Tighten anonymous INSERT policies to avoid WITH CHECK (true)
-- while keeping intended public tracking/checkout behavior.

-- 1) Public link check (used by link_clicks anon inserts)
CREATE OR REPLACE FUNCTION public.is_link_public(p_link_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.links l
    WHERE l.id = p_link_id
      AND l.is_active = true
      AND public.is_page_public(l.page_id)
      AND public.is_link_scheduled_active(l.schedule_enabled, l.starts_at, l.ends_at)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_link_public(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS link_clicks_insert_anon ON public.link_clicks;
CREATE POLICY link_clicks_insert_anon
ON public.link_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_link_public(link_id));


-- 2) Public product check (used by orders anon inserts)
CREATE OR REPLACE FUNCTION public.is_product_public(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.digital_products dp
    WHERE dp.id = p_product_id
      AND dp.is_active = true
      AND public.is_page_public(dp.page_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_product_public(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS orders_insert_anon ON public.orders;
CREATE POLICY orders_insert_anon
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_product_public(product_id));


-- 3) Public page check (used by page_views anon inserts)
DROP POLICY IF EXISTS page_views_insert_anon ON public.page_views;
CREATE POLICY page_views_insert_anon
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  page_id IS NOT NULL
  AND public.is_page_public(page_id)
);