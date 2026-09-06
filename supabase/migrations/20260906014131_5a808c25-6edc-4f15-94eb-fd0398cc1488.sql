UPDATE public.posts SET category = CASE
  WHEN category IN ('التراث','تراث','تاريخ') THEN 'التاريخ'
  WHEN category IN ('أعلام','اعلام','ثقافة','أدب') THEN 'الثقافة'
  WHEN category IN ('أخبار','اخبار') THEN 'عاجل'
  WHEN category IN ('سياسية') THEN 'سياسة'
  ELSE 'الثقافة' END
WHERE section = 'gazette'
  AND (category IS NULL OR category NOT IN ('عاجل','سياسة','التاريخ','الثقافة'));

ALTER TABLE public.posts ALTER COLUMN category SET DEFAULT 'الثقافة';