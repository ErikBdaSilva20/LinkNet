-- Create backgrounds storage bucket for custom theme backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to backgrounds
CREATE POLICY "backgrounds_public_read" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'backgrounds');

-- Allow authenticated users to upload their own backgrounds
CREATE POLICY "backgrounds_upload_own" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'backgrounds' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own backgrounds
CREATE POLICY "backgrounds_update_own" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'backgrounds' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own backgrounds
CREATE POLICY "backgrounds_delete_own" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'backgrounds' 
  AND auth.role() = 'authenticated'
);