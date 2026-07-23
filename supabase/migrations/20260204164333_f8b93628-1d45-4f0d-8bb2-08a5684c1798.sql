-- Add slug column for sub-pages
ALTER TABLE public.pages ADD COLUMN slug text;

-- Index for fast lookup by profile and slug
CREATE INDEX idx_pages_profile_slug ON public.pages(profile_id, slug);

-- Constraint: slug must be unique per profile (allows NULL for main page)
ALTER TABLE public.pages ADD CONSTRAINT pages_profile_slug_unique 
  UNIQUE NULLS NOT DISTINCT (profile_id, slug);