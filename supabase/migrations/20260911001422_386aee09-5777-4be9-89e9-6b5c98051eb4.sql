ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS source_name text;

CREATE INDEX IF NOT EXISTS posts_section_views_idx ON public.posts (section, views DESC);

UPDATE public.content_sources SET is_active = true
WHERE url IN (
  'https://ar.wikipedia.org',
  'https://ar.wikipedia.org/w/api.php?action=featuredfeed&feed=featured&feedformat=atom',
  'https://archive.org/services/collection-rss.php?collection=arabic_books'
);