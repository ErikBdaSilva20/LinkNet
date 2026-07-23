
-- =====================================================
-- PART 4: Create remaining tables and finalize FKs
-- =====================================================

-- Create digital_products table
CREATE TABLE IF NOT EXISTS public.digital_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  file_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_digital_products_updated_at ON public.digital_products;
CREATE TRIGGER update_digital_products_updated_at
  BEFORE UPDATE ON public.digital_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_products_page ON public.digital_products(page_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  buyer_email text NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Add foreign keys for new tables
DO $$ BEGIN
  ALTER TABLE public.digital_products
    ADD CONSTRAINT digital_products_page_id_fkey 
    FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.digital_products(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_links_page_position ON public.links(page_id, position);
CREATE INDEX IF NOT EXISTS idx_page_views_page_date ON public.page_views(page_id, created_at);
