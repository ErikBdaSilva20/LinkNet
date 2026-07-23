-- Create leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for page_id lookups
CREATE INDEX leads_page_id_idx ON public.leads(page_id);

-- Unique constraint to prevent duplicate emails per page
CREATE UNIQUE INDEX leads_page_email_unique ON public.leads(page_id, email);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Page owner can view their leads
CREATE POLICY "leads_select_own" ON public.leads
FOR SELECT USING (user_owns_page(page_id));

-- Policy: Public can insert leads (for public pages only)
CREATE POLICY "leads_insert_public" ON public.leads
FOR INSERT WITH CHECK (is_page_public(page_id));

-- Policy: Page owner can delete leads
CREATE POLICY "leads_delete_own" ON public.leads
FOR DELETE USING (user_owns_page(page_id));

-- Add lead form configuration columns to pages table
ALTER TABLE public.pages
ADD COLUMN lead_form_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN lead_form_title text DEFAULT 'Fique por dentro',
ADD COLUMN lead_form_description text DEFAULT 'Cadastre seu e-mail para receber novidades';