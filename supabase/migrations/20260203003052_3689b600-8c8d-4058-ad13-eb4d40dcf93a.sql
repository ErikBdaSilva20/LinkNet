
-- =====================================================
-- PART 2: Modify links table and create short_links
-- =====================================================

-- Add new columns to links
ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS page_id uuid,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thumbnail_type public.thumbnail_type NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS icon_name text,
  ADD COLUMN IF NOT EXISTS schedule_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

-- Create short_links table
CREATE TABLE public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  link_id uuid,
  slug text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_short_links_slug ON public.short_links(slug);

-- Create integrations table
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL UNIQUE,
  google_analytics_measurement_id text,
  meta_pixel_id text,
  custom_head_html text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Modify themes table
ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS page_id uuid,
  ADD COLUMN IF NOT EXISTS preset text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS background_type public.background_type NOT NULL DEFAULT 'gradient',
  ADD COLUMN IF NOT EXISTS background_value text,
  ADD COLUMN IF NOT EXISTS button_radius integer NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS accent_color text;

-- Add page_id and ip_hash to page_views
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS page_id uuid,
  ADD COLUMN IF NOT EXISTS ip_hash text;

-- Create link_clicks table
CREATE TABLE public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL,
  short_link_id uuid,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  referrer text,
  user_agent text,
  ip_hash text,
  country text,
  city text,
  device_type text,
  browser text
);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_link_clicks_link_date ON public.link_clicks(link_id, clicked_at);
