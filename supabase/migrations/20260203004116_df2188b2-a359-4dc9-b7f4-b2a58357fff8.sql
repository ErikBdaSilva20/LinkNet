
-- =====================================================
-- PART 6: Clean up old columns and tables
-- =====================================================

-- Drop old RLS policies on clicks table before dropping it
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.clicks;
DROP POLICY IF EXISTS "Users can view clicks on their links" ON public.clicks;

-- Drop old clicks table
DROP TABLE IF EXISTS public.clicks;

-- Drop old columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS custom_domain,
  DROP COLUMN IF EXISTS facebook_pixel,
  DROP COLUMN IF EXISTS google_analytics;

-- Drop old columns from links
ALTER TABLE public.links
  DROP COLUMN IF EXISTS profile_id,
  DROP COLUMN IF EXISTS active,
  DROP COLUMN IF EXISTS featured,
  DROP COLUMN IF EXISTS slug;

-- Drop old column from themes (profile_id was already removed earlier)
ALTER TABLE public.themes
  DROP COLUMN IF EXISTS profile_id;
