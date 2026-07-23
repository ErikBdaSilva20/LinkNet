-- Add UTM columns to integrations table
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text;

-- Add public SELECT policy for integrations (needed for GA/Pixel to load on public pages)
CREATE POLICY "integrations_select_public" 
ON integrations 
FOR SELECT 
USING (is_page_public(page_id));