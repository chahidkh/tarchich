ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'majlis';

DROP POLICY IF EXISTS "posts are public" ON public.posts;
CREATE POLICY "published posts are public" ON public.posts FOR SELECT USING (
  is_published OR auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "members upload own profile assets" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-assets' AND (storage.foldername(name))[1] = 'profiles' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "members update own profile assets" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-assets' AND (storage.foldername(name))[1] = 'profiles' AND (storage.foldername(name))[2] = auth.uid()::text)
WITH CHECK (bucket_id = 'site-assets' AND (storage.foldername(name))[1] = 'profiles' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "members delete own profile assets" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-assets' AND (storage.foldername(name))[1] = 'profiles' AND (storage.foldername(name))[2] = auth.uid()::text);