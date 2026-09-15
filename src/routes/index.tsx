import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Crown,
  Users,
  Feather,
  Library,
  Newspaper,
  MessagesSquare,
  Quote,
  Star,
  Mail,
  Loader2,
  Scroll,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { BookCard, type Book } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceTag } from "@/components/price-tag";
import { SiteFooter } from "@/components/site-footer";
import { useProfiles, AvatarInitial } from "@/hooks/use-profiles";
import { HomeHero } from "@/components/home-hero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مكتبة ترشيش | مجلس المعرفة العربي" },
      {
        name: "description",
        content: "مكتبة ترشيش: كتب مختارة بعناية، مقالات يومية، ومستشار معرفي ذكي بعربية أصيلة.",
      },
      { property: "og:title", content: "مكتبة ترشيش | مجلس المعرفة العربي" },
      { property: "og:description", content: "كتب مختارة، مجلس ثقافي، وحكيمٌ يرشدك إلى قراءتك القادمة." },
    ],
  }),
  component: Home,
});

const QUOTES: { text: string; author: string }[] = [
  { text: "من لم يذق ذلّ التعلّم ساعة، تجرّع ذلّ الجهل أبداً.", author: "الإمام الشافعي" },
  { text: "الكتاب هو الجليس الذي لا يُطريك، والصديق الذي لا يُغريك.", author: "الجاحظ" },
  { text: "قيمة كل امرئٍ ما يُحسنه.", author: "الإمام علي بن أبي طالب" },
  { text: "العلم يحرس صاحبه، والمال يحرسه صاحبه.", author: "الإمام علي بن أبي طالب" },
  { text: "الإنسان ابن عوائده ومألوفه، لا ابن طبيعته ومزاجه.", author: "ابن خلدون" },
  { text: "من طلب العُلا سهر الليالي.", author: "المتنبي" },
  { text: "أعزُّ مكانٍ في الدنى سرجُ سابحٍ، وخير جليسٍ في الزمان كتابُ.", author: "المتنبي" },
  { text: "العلم ما نفع، ليس العلم ما حُفظ.", author: "الإمام الشافعي" },
  { text: "لو كان الكلام من فضة، لكان الصمت من ذهب.", author: "مثل عربي مأثور" },
  { text: "من عرف نفسه فقد عرف ربّه.", author: "أبو حامد الغزالي" },
];

const ERAS = [
  "التراث الإسلامي",
  "التاريخ",
  "الأدب",
  "الفلسفة والعلوم",
  "التصوف",
  "اللغة والمعاجم",
  "الرحلات والجغرافيا",
];

function dayOfYear(d: Date) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86_400_000);
}

const BOOK_FIELDS =
  "id,title,author,description,price,cover_image_url,category,badge,stock,external_url,copyright_notice,sample_pdf_url";

function Home() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("zaina-ref", ref);
  }, []);

  const { data: books, isLoading } = useQuery({
    queryKey: ["featured-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select(BOOK_FIELDS)
        .eq("is_visible", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data as Book[];
    },
  });

  return (
    <main>
      <HomeHero />

      <QuoteBar />

      <section className="mx-auto max-w-6xl px-4 py-20">
        <header className="mb-10 text-center">
          <h2 className="text-3xl text-gold sm:text-4xl">مختاراتُ الرفّ الذهبي</h2>
          <p className="mt-3 text-sm text-muted-foreground">نفائس اخترناها لك من أعمدة التراث والفكر</p>
        </header>

        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(165px,1fr))]">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl bg-secondary/50" />)
            : books?.map((b) => <BookCard key={b.id} book={b} />)}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link to="/store">كل الكتب</Link>
          </Button>
        </div>
      </section>

      <EraStrip />

      <BookOfTheDay />

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Library,
              title: "متجر الكتب التراثية",
              text: "مكتبة تضمّ نفائس التراث والتاريخ والأدب، جاهزة للقراءة والاقتناء.",
              to: "/store" as const,
            },
            {
              icon: Newspaper,
              title: "جريدة ترشيش",
              text: "مقالات ثقافية يومية في التاريخ والسياسة والفكر بلغةٍ رصينة.",
              to: "/gazette" as const,
            },
            {
              icon: MessagesSquare,
              title: "المجلس الثقافي",
              text: "نقاشات حيّة بين القرّاء والمؤلفين حول ما يُقرأ ويُكتب اليوم.",
              to: "/majlis" as const,
            },
          ].map(({ icon: Icon, title, text, to }) => (
            <Link key={title} to={to} className="glass block rounded-xl p-6 transition hover:border-gold/50">
              <Icon className="size-5 text-gold" />
              <h3 className="mt-4 text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
            </Link>
          ))}

          {[
            { icon: Sparkles, title: "حكيم ترشيش", text: "مستشار معرفي يجيبك بعربية أصيلة ويرشّح لك بحسب حالك." },
            { icon: Users, title: "المجلس الثقافي", text: "مقالات يومية ونقاشات متشعّبة بين القرّاء والمؤلفين." },
            { icon: Feather, title: "برنامج الإحالة", text: "عمولة ١٠٪ على كل كتاب يُباع عبر رابطك الخاص." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass rounded-xl p-6">
              <Icon className="size-5 text-gold" />
              <h3 className="mt-4 text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <ReaderVoices />

      <LibraryPulse />

      <section className="mx-auto max-w-4xl px-4 pb-24">
        <div className="glass relative overflow-hidden rounded-2xl p-10 text-center">
          <Crown className="mx-auto size-6 text-gold" />
          <h2 className="mt-4 text-3xl text-gold">عضوية مجلس ترشيش</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
            مقالات يومية حصرية، كتبٌ صوتية نادرة، واستشارات غير محدودة مع حكيم المكتبة.
          </p>
          <p className="mt-6 flex items-center justify-center gap-2 font-display text-3xl text-parchment">
            <PriceTag amount={49} className="text-3xl" />
            <span className="text-base text-muted-foreground">/ شهرياً</span>
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/auth">انضم إلى المجلس</Link>
          </Button>
        </div>
      </section>

      <NewsletterBox />

      <SiteFooter />
    </main>
  );
}

/** شريط اقتباس تراثي يُختار عشوائياً من قائمة ثابتة داخل الكود. */
function QuoteBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(Math.floor(Math.random() * QUOTES.length));
  }, []);
  const q = QUOTES[i]!;
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="glass flex items-center gap-4 rounded-xl px-5 py-4 text-center sm:text-right">
        <Quote className="hidden size-5 shrink-0 text-gold sm:block" />
        <p className="flex-1 text-sm leading-8 text-muted-foreground">
          <span className="text-foreground">«{q.text}»</span>
          <span className="mx-2 text-gold">— {q.author}</span>
        </p>
      </div>
    </div>
  );
}

/** شريط العصور/التصنيفات، يوجّه إلى صفحة المتجر. */
function EraStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-6">
      <h2 className="mb-4 text-center text-2xl text-gold">تصفّح بحسب العصور والفنون</h2>
      <div className="flex flex-wrap justify-center gap-2">
        {ERAS.map((e) => (
          <Link
            key={e}
            to="/store"
            className="glass rounded-full border-gold/30 px-4 py-2 text-xs text-muted-foreground transition hover:border-gold/60 hover:text-gold"
          >
            {e}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** كتاب اليوم: اختيار حتمي بحسب رقم اليوم من السنة. */
function BookOfTheDay() {
  const { data, isLoading } = useQuery({
    queryKey: ["book-of-the-day", new Date().toDateString()],
    queryFn: async () => {
      const { count, error: cErr } = await supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .eq("is_visible", true);
      if (cErr) throw cErr;
      if (!count) return null;
      const idx = dayOfYear(new Date()) % count;
      const { data, error } = await supabase
        .from("books")
        .select(BOOK_FIELDS)
        .eq("is_visible", true)
        .order("created_at", { ascending: true })
        .range(idx, idx);
      if (error) throw error;
      return (data?.[0] ?? null) as Book | null;
    },
  });

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 pb-20"><Skeleton className="h-72 rounded-2xl bg-secondary/50" /></div>;
  if (!data) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-20">
      <header className="mb-6 text-center">
        <h2 className="text-3xl text-gold">كتاب اليوم</h2>
        <p className="mt-2 text-sm text-muted-foreground">اختيارٌ يتجدّد كل يوم من رفوف المكتبة</p>
      </header>
      <div className="glass grid gap-6 rounded-2xl p-6 sm:grid-cols-[220px_1fr]">
        <div className="mx-auto aspect-3/4 w-[200px] overflow-hidden rounded-xl border border-gold/25">
          <BookCover src={data.cover_image_url} title={data.title} imgClassName="size-full object-cover" />
        </div>
        <div className="flex flex-col text-right">
          <h3 className="font-display text-2xl text-gold">{data.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{data.author}</p>
          {data.category && <p className="mt-1 text-xs text-muted-foreground">{data.category}</p>}
          <p className="mt-3 line-clamp-5 text-sm leading-8 text-muted-foreground">{data.description}</p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
            <PriceTag amount={Number(data.price)} className="text-2xl" />
            <Button asChild>
              <Link to="/store">اذهب إلى الكتاب في المتجر</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** آراء قرّاء حقيقية من جدول المراجعات. */
function ReaderVoices() {
  const { byId } = useProfiles();
  const { data } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,user_id,rating,comment,created_at,books(title)")
        .not("comment", "is", null)
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <header className="mb-6 text-center">
        <h2 className="text-3xl text-gold">آراء القرّاء</h2>
      </header>
      {data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => {
            const p = byId(r.user_id);
            return (
              <div key={r.id} className="glass rounded-xl p-6 text-right">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full border border-gold/30 bg-card text-xs text-gold">
                    {AvatarInitial(p?.full_name)}
                  </span>
                  <span className="text-sm">{p?.full_name ?? "عضو"}</span>
                  <span className="ms-auto flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-gold text-gold" />
                    ))}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{r.comment}</p>
                {r.books?.title && <p className="mt-3 text-xs text-gold">عن كتاب: {r.books.title}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="glass rounded-xl p-6 text-center text-sm text-muted-foreground">
          لم تُسجَّل مراجعات كافية بعد. كن أوّل من يشارك رأيه في كتابٍ قرأه من المكتبة.
        </p>
      )}
    </section>
  );
}

/** مؤشر نشاط صادق: أرقام حقيقية فقط من قاعدة البيانات. */
function LibraryPulse() {
  const { data } = useQuery({
    queryKey: ["library-pulse"],
    queryFn: async () => {
      const [booksRes, reviewsRes, postsRes] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }).eq("is_visible", true),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("is_published", true),
      ]);
      return {
        books: booksRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
        posts: postsRes.count ?? 0,
      };
    },
  });

  const items = useMemo(
    () => [
      { label: "كتاب متاح الآن", value: data?.books ?? 0 },
      { label: "مقال ومشاركة منشورة", value: data?.posts ?? 0 },
      { label: "مراجعة قارئ", value: data?.reviews ?? 0 },
    ],
    [data],
  );

  const empty = !data || (data.books === 0 && data.posts === 0 && data.reviews === 0);

  return (
    <section className="mx-auto max-w-4xl px-4 pb-20">
      <div className="glass rounded-2xl p-6 text-center">
        <Scroll className="mx-auto size-5 text-gold" />
        {empty ? (
          <p className="mt-3 text-sm text-muted-foreground">المكتبة في طور الإثراء، وستُعرض هنا أرقامها الحقيقية فور توفّرها.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {items.map((it) => (
              <div key={it.label}>
                <p className="font-display text-3xl text-gold">{it.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{it.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** اشتراك بريدي بسيط يُخزَّن في قاعدة البيانات فقط. */
function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("أدخل بريداً إلكترونياً صحيحاً");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: value });
    setSaving(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("تعذّر حفظ الاشتراك، حاول لاحقاً");
      return;
    }
    setDone(true);
    setEmail("");
    toast.success("شكراً لك، تم تسجيل بريدك بنجاح");
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pb-24">
      <div className="glass rounded-2xl p-8 text-center">
        <Mail className="mx-auto size-5 text-gold" />
        <h2 className="mt-4 text-2xl text-gold">اشترك بإشعارات الجديد</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
          سجّل بريدك لنُعلمك بالكتب والمقالات الجديدة فور صدورها.
        </p>
        {done ? (
          <p className="mt-6 text-sm text-gold">شكراً لك، تم تسجيل بريدك بنجاح وسنوافيك بكل جديد.</p>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="بريدك الإلكتروني"
              className="bg-background text-right"
            />
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              اشترك
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
