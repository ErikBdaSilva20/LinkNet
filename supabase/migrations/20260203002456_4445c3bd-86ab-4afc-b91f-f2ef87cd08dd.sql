
-- =====================================================
-- MIGRATION FIX: Drop remaining old policies on themes
-- =====================================================

-- Drop old policies on themes that depend on profile_id
DROP POLICY IF EXISTS "Users can view their own theme" ON public.themes;
DROP POLICY IF EXISTS "Users can insert their own theme" ON public.themes;
DROP POLICY IF EXISTS "Users can update their own theme" ON public.themes;
DROP POLICY IF EXISTS "Public themes are viewable" ON public.themes;

-- Drop old policies on page_views that may depend on profile_id
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Users can view their page views" ON public.page_views;

-- Now we can safely drop the columns

-- Drop old column from themes
ALTER TABLE public.themes
  DROP COLUMN IF EXISTS profile_id,
  DROP COLUMN IF EXISTS button_style_old;

-- Drop old column from page_views
ALTER TABLE public.page_views
  DROP COLUMN IF EXISTS profile_id,
  DROP COLUMN IF EXISTS ip_address;
