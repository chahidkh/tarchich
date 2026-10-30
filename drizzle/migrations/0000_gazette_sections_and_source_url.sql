ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.posts ALTER COLUMN category SET DEFAULT 'ثقافة وكتب';

-- AI-generated covers are retired: those articles become text cards.
UPDATE public.posts SET media_url = NULL WHERE section = 'gazette' AND media_url LIKE '%gazette-covers%';

-- Legacy category names.
UPDATE public.posts SET category = 'ثقافة وكتب' WHERE section = 'gazette' AND category IN ('الثقافة','ثقافة','أدب','أعلام','اعلام');
UPDATE public.posts SET category = 'التاريخ' WHERE section = 'gazette' AND category IN ('تاريخ','التراث','تراث');

-- Keyword reclassification of news items currently filed under politics.
UPDATE public.posts SET category = 'رياضة' WHERE section = 'gazette' AND category = 'سياسة'
  AND (title || ' ' || coalesce(excerpt,'')) ~ '(كرة القدم|كرة|رياض|مباراة|بطولة|منتخب|أولمبي|الدوري|لاعب|مونديال|كأس العالم|تنس|فورمولا)';
UPDATE public.posts SET category = 'تقنية' WHERE section = 'gazette' AND category = 'سياسة'
  AND (title || ' ' || coalesce(excerpt,'')) ~ '(تقني|تكنولوج|الذكاء الاصطناعي|ذكاء اصطناعي|إنترنت|الإنترنت|رقمي|رقمية|تطبيق|هواتف|هاتف ذكي|سيبراني|برمجي|رقائق|أشباه الموصلات|منصات التواصل)';
UPDATE public.posts SET category = 'علوم وصحة' WHERE section = 'gazette' AND category = 'سياسة'
  AND (title || ' ' || coalesce(excerpt,'')) ~ '(صحة|الصحة|طبي|أطباء|مرض|أمراض|لقاح|فيروس|وباء|علماء|علمي|دراسة|الفضاء|فضائي|ناسا|المناخ|مناخي|البيئة|بيئي|مستشفى|سرطان|حرائق الغابات)';
UPDATE public.posts SET category = 'اقتصاد وتجارة' WHERE section = 'gazette' AND category = 'سياسة'
  AND (title || ' ' || coalesce(excerpt,'')) ~ '(اقتصاد|تجار|تجاري|أسواق|السوق|بورصة|النفط|نفط|الغاز|تضخم|البنك المركزي|مصرف|عملة|اليورو|الدولار|استثمار|الأسعار|ضرائب|رسوم جمركية|جمارك|ميزانية|صادرات|واردات|شركات)';
UPDATE public.posts SET category = 'منوعات' WHERE section = 'gazette' AND category = 'سياسة'
  AND (title || ' ' || coalesce(excerpt,'')) ~ '(سينما|فيلم|موسيقى|مهرجان|سياحة|سياح|طبخ|موضة|فنان|مغني|حيوان)';
UPDATE public.posts SET category = 'ثقافة وكتب' WHERE section = 'gazette' AND category = 'سياسة'
  AND (title || ' ' || coalesce(excerpt,'')) ~ '(كتاب|رواية|أدب|متحف|شاعر|شعر|معرض الكتاب|تراث ثقافي)';

-- Any remaining unknown values fall back to culture & books.
UPDATE public.posts SET category = 'ثقافة وكتب' WHERE section = 'gazette'
  AND (category IS NULL OR category NOT IN ('عاجل','سياسة','اقتصاد وتجارة','رياضة','تقنية','علوم وصحة','ثقافة وكتب','التاريخ','منوعات'));

CREATE INDEX IF NOT EXISTS posts_gazette_cat_created_idx ON public.posts (section, category, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_views_idx ON public.posts (section, views DESC);