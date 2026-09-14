
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS majlis_category text,
  ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS posts_single_pinned_idx ON public.posts ((is_pinned)) WHERE is_pinned;
CREATE INDEX IF NOT EXISTS posts_majlis_category_idx ON public.posts (majlis_category) WHERE section = 'majlis';
CREATE INDEX IF NOT EXISTS posts_book_id_idx ON public.posts (book_id);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes (post_id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'reply',
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  preview text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id, is_read, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO target FROM public.comments WHERE id = NEW.parent_id;
  ELSE
    SELECT author_id INTO target FROM public.posts WHERE id = NEW.post_id;
  END IF;

  IF target IS NOT NULL AND target <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id, preview)
    VALUES (target, NEW.user_id, 'reply', NEW.post_id, NEW.id, left(NEW.content, 120));
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_comment_notify ON public.comments;
CREATE TRIGGER on_comment_notify
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();
