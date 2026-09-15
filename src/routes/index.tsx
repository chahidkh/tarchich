import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Quote,
  Star,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { BookCard, type Book } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceTag } from "@/components/price-tag";
import { SiteFooter } from "@/components/site-footer";
import { useProfiles, AvatarInitial } from "@/hooks/use-profiles";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const QUOTES: { text: string; author: string }[] = [
  { text: "الكتاب هو الجليس الذي لا يُطريك، والصديق الذي لا يُغريك.", author: "الجاحظ" },
  { text: "قيمة كل امرئٍ ما يُحسنه.", author: "الإمام علي بن أبي طالب" },
  { text: "أعزُّ مكانٍ في الدنى سرجُ سابحٍ، وخير جليسٍ في الزمان كتابُ.", author: "المتنبي" },
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
      <section className="relative isolate flex min-h-[34rem] items-center justify-center overflow-hidden sm:min-h-[88vh]">
        <div aria-hidden className="absolute inset-0 bg-background/35 sm:hidden" />
        <div className="rise-in relative mx-auto max-w-3xl px-6 py-8 text-center sm:py-0">
          <p className="font-kufi text-xs tracking-[0.3em] text-gold-soft hero-text sm:text-sm">منصة المعرفة العربية</p>
          <h1 className="mt-4 text-4xl leading-[1.35] text-parchment hero-text sm:mt-6 sm:text-7xl">مكتبة ترشيش</h1>
          <div className="gold-rule mx-auto mt-4 w-32 sm:mt-6 sm:w-40" />
          <p className="mt-4 text-base leading-8 text-parchment/85 hero-text sm:mt-6 sm:text-lg sm:leading-9">
            حيث يلتقي عبقُ المخطوط بذكاء العصر. كتبٌ منتقاة، مجلسٌ ثقافي يومي، وحكيمٌ يصحبك في اختيار قراءتك.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
            <Button asChild size="lg" className="px-4 sm:px-8">
              <Link to="/store">تصفّح المتجر</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-4 sm:px-8">
              <Link to="/majlis">ادخل المجلس</Link>
            </Button>
          </div>
        </div>
      </section>

      <QuoteBar />

      <section className="islamic-corners mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <header className="mb-7 text-center sm:mb-10">
          <h2 className="ink-reveal text-3xl text-gold sm:text-4xl">مختاراتُ الرفّ الذهبي</h2>
          <p className="mt-3 text-sm text-muted-foreground">نفائس اخترناها لك من أعمدة التراث والفكر</p>
        </header>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:hidden">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-60 w-28 shrink-0 rounded-md bg-secondary/50" />)
            : books?.map((book) => <BookCard key={book.id} book={book} compact />)}
        </div>
        <div className="hidden gap-5 [grid-template-columns:repeat(auto-fill,minmax(165px,1fr))] md:grid">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl bg-secondary/50" />)
            : books?.map((book) => <BookCard key={book.id} book={book} />)}
        </div>

        <div className="mt-7 text-center sm:mt-10">
          <Button asChild variant="outline">
            <Link to="/store">كل الكتب</Link>
          </Button>
        </div>
      </section>

      <BookOfTheDay />

      <ReaderVoices />

      <MembershipPanel />

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
    <section className="islamic-corners mx-auto max-w-5xl px-4 pb-20">
      <header className="mb-6 text-center">
        <h2 className="ink-reveal text-3xl text-gold">كتاب اليوم</h2>
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
    <section className="islamic-corners mx-auto max-w-6xl px-4 pb-20">
      <header className="mb-6 text-center">
        <h2 className="ink-reveal text-3xl text-gold">آراء القرّاء</h2>
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

/** عضوية المجلس مع أرقام المكتبة الحقيقية مدمجة في الشريط نفسه. */
function MembershipPanel() {
  const { data } = useQuery({
    queryKey: ["library-pulse"],
    queryFn: async () => {
      const [booksRes, reviewsRes, postsRes] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }).eq("is_visible", true),
        supabase.from("reviews").select("id", { count: "exact", head: true),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("is_published", true),
      ]);
      return { books: booksRes.count ?? 0, reviews: reviewsRes.count ?? 0, posts: postsRes.count ?? 0 };
    },
  });

  const items = useMemo(
    () => [
      { label: "كتاب متاح", value: data?.books ?? 0 },
      { label: "مقال ومشاركة", value: data?.posts ?? 0 },
      { label: "مراجعة قارئ", value: data?.reviews ?? 0 },
    ],
    [data],
  );

  return (
    <section className="islamic-corners mx-auto max-w-4xl px-4 pb-24">
      <div className="glass relative overflow-hidden rounded-2xl p-7 text-center sm:p-10">
        <Crown className="mx-auto size-6 text-gold" />
        <h2 className="ink-reveal mt-4 text-3xl text-gold">عضوية مجلس ترشيش</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
          مقالات يومية حصرية، كتبٌ صوتية نادرة، واستشارات غير محدودة مع حكيم المكتبة.
        </p>
        {data && (data.books > 0 || data.posts > 0 || data.reviews > 0) && (
          <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 border-y border-border py-4">
            {items.map((item) => (
              <div key={item.label} className="border-e border-border px-2 last:border-0">
                <p className="font-display text-xl text-gold sm:text-2xl">{item.value}</p>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground sm:text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 flex items-center justify-center gap-2 font-display text-3xl text-parchment">
          <PriceTag amount={49} className="text-3xl" />
          <span className="text-base text-muted-foreground">/ شهرياً</span>
        </p>
        <Button asChild className="mt-6" size="lg">
          <Link to="/auth">انضم إلى المجلس</Link>
        </Button>
      </div>
    </section>
  );
}
