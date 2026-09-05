ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'أخبار',
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

CREATE TABLE public.ads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'in_feed' CHECK (type IN ('in_feed','sponsored_article','sticky_bottom')),
  code_or_image text NOT NULL,
  link text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active ads are public" ON public.ads FOR SELECT USING (is_active OR has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage ads" ON public.ads FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

UPDATE public.posts SET slug = 'post-' || substr(id::text,1,8) WHERE slug IS NULL;