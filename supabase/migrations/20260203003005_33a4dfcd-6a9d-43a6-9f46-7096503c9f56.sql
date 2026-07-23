
-- =====================================================
-- PART 1: Create ENUM types and new tables
-- =====================================================

-- Create ENUM types
DO $$ BEGIN
  CREATE TYPE public.thumbnail_type AS ENUM ('none', 'upload', 'icon');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.background_type AS ENUM ('color', 'gradient', 'image');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.button_style_type AS ENUM ('solid', 'outline', 'soft');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add is_public to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Rename name to display_name
ALTER TABLE public.profiles 
  RENAME COLUMN name TO display_name;

-- Create pages table
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  description text,
  og_image_url text,
  custom_domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pages_profile ON public.pages(profile_id);
