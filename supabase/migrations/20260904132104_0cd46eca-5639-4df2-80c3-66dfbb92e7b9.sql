
-- ROLES
CREATE TYPE public.app_role AS ENUM ('reader','vip','author','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  bio text,
  referral_code text UNIQUE,
  wallet_balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- BOOKS
CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  cover_image_url text,
  sample_pdf_url text,
  stock integer NOT NULL DEFAULT 0,
  category text,
  badge text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.books TO anon, authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books are public" ON public.books FOR SELECT USING (true);
CREATE POLICY "admins manage books" ON public.books FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POSTS
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('image','video')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts are public" ON public.posts FOR SELECT USING (true);
CREATE POLICY "users create own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "users update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "users delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- COMMENTS
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments are public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "users create own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LIKES
CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT ON public.post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes are public" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "users like" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users unlike" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  referrer_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'ZN-' || upper(substr(replace(NEW.id::text,'-',''),1,8))
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'reader') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED
INSERT INTO public.books (title, author, description, price, category, badge, stock) VALUES
('مقدمة ابن خلدون','عبد الرحمن بن خلدون','أعظم ما كُتب في علم العمران البشري وفلسفة التاريخ، بتحقيق جديد وشروح ميسّرة.',120.00,'تاريخ وفلسفة','الأكثر مبيعاً',24),
('إحياء علوم الدين','أبو حامد الغزالي','رحلة في تهذيب النفس ومقامات القلوب، طبعة فاخرة بغلاف مذهّب.',180.00,'تزكية','حصري',12),
('كليلة ودمنة','عبد الله بن المقفع','حكم الشرق على ألسنة الحيوان، بأسلوب أدبي رفيع ورسوم منمنمة.',75.00,'أدب',NULL,40),
('البيان والتبيين','الجاحظ','في البلاغة والخطابة وأسرار العربية، لمن أراد أن يتذوّق جمال اللسان.',95.00,'لغة وبلاغة',NULL,18),
('طوق الحمامة','ابن حزم الأندلسي','في الألفة والأُلّاف، أرقّ ما كتبه الأندلسيون عن النفس والمحبة.',65.00,'أدب','الأكثر مبيعاً',30),
('رسائل إخوان الصفا','إخوان الصفا','موسوعة فلسفية علمية نادرة، نسخة رقمية محققة مع فهارس تفصيلية.',150.00,'فلسفة','حصري',8);

INSERT INTO public.posts (title, content, media_type) VALUES
('لماذا نعود إلى المخطوطات في زمن الشاشات؟','في زمنٍ صارت فيه المعرفة على مسافة نقرة، تبقى للمخطوط رائحةٌ لا تُنسخ. نقرأ اليوم في أثر الورق كيف كان العالِم ينسخ الكتاب مرتين: مرة بيده ومرة بقلبه. هذه المقالة دعوة لاستعادة البطء النبيل في القراءة.', NULL),
('ثلاث نصائح لبناء مكتبة منزلية أنيقة','ابدأ بالرفوف لا بالكتب، واختر الإضاءة الدافئة، ثم رتّب حسب الموضوع لا حسب اللون. المكتبة ليست ديكوراً بل سيرة ذاتية معلنة لصاحبها.', NULL),
('الجاحظ: أول من كتب عن متعة القراءة','قال الجاحظ إن الكتاب "نعم الجليس"، وسبق بذلك كل ما كُتب في أدب القراءة. نقرأ في هذا المقال نصوصه عن الوحدة والأنس بالورق.', NULL);
