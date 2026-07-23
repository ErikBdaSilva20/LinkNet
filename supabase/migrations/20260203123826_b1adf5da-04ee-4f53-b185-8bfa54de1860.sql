-- Criar bucket para arquivos de produtos digitais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-files', 
  'product-files', 
  false,
  52428800,
  ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed', 
        'image/jpeg', 'image/png', 'image/webp', 
        'audio/mpeg', 'video/mp4']
);

-- Politicas RLS para bucket avatars
CREATE POLICY "avatars_upload_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_select_public" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politicas RLS para bucket thumbnails
CREATE POLICY "thumbnails_upload_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.pages pg
    JOIN public.profiles pr ON pg.profile_id = pr.id
    WHERE (storage.foldername(name))[1] = pg.id::text
    AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "thumbnails_select_public" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.pages pg
    JOIN public.profiles pr ON pg.profile_id = pr.id
    WHERE (storage.foldername(name))[1] = pg.id::text
    AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "thumbnails_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.pages pg
    JOIN public.profiles pr ON pg.profile_id = pr.id
    WHERE (storage.foldername(name))[1] = pg.id::text
    AND pr.user_id = auth.uid()
  )
);

-- Politicas RLS para bucket product-files (privado)
CREATE POLICY "product_files_upload_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM public.pages pg
    JOIN public.profiles pr ON pg.profile_id = pr.id
    WHERE (storage.foldername(name))[1] = pg.id::text
    AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "product_files_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM public.pages pg
    JOIN public.profiles pr ON pg.profile_id = pr.id
    WHERE (storage.foldername(name))[1] = pg.id::text
    AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "product_files_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM public.pages pg
    JOIN public.profiles pr ON pg.profile_id = pr.id
    WHERE (storage.foldername(name))[1] = pg.id::text
    AND pr.user_id = auth.uid()
  )
);