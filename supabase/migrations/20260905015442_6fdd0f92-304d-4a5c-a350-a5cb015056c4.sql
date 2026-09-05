CREATE POLICY "public can read book assets" ON storage.objects FOR SELECT
  USING (bucket_id IN ('book-assets','site-assets'));

CREATE POLICY "admins upload assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('book-assets','site-assets') AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('book-assets','site-assets') AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id IN ('book-assets','site-assets') AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('book-assets','site-assets') AND public.has_role(auth.uid(), 'admin'));