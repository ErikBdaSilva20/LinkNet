
-- Add lead_form_fields JSONB to pages (stores field configuration)
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS lead_form_fields jsonb DEFAULT '[{"id":"name","type":"text","label":"Nome","enabled":true,"required":false},{"id":"email","type":"email","label":"E-mail","enabled":true,"required":true}]'::jsonb;

-- Add phone and custom_fields to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;
