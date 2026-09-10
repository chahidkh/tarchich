CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_events TO service_role;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view stripe events" ON public.stripe_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.stripe_events TO authenticated;