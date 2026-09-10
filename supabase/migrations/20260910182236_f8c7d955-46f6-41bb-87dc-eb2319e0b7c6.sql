CREATE TABLE public.content_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  license_note text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_sources TO authenticated;
GRANT ALL ON public.content_sources TO service_role;

ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage content sources" ON public.content_sources
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_content_sources_updated_at
  BEFORE UPDATE ON public.content_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.content_sources (name, url, license_note, is_active) VALUES
  ('ويكيبيديا العربية', 'https://ar.wikipedia.org', 'محتوى بترخيص المشاع الإبداعي CC BY-SA — يلزم الإسناد وذكر المصدر.', false),
  ('مؤسسة هنداوي', 'https://www.hindawi.org', 'كتب ومقالات بترخيص المشاع الإبداعي في الغالب — يجب التحقق لكل عمل على حدة.', false);