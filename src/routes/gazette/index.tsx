import { Fragment, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, Newspaper, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  GAZETTE_CATEGORIES,
  PUBLISHER,
  archiveKey,
  archiveLabel,
  fetchGazettePosts,
  normalizeCategory,
  readingMinutes,
  type GazettePost,
} from "@/lib/gazette";
import { GazetteCover } from "@/components/gazette-cover";
import { SourceBadge } from "@/components/gazette-share";
import { InFeedAd, SponsoredAd, StickyBottomAd, useAds } from "@/components/ad-slot";

const PAGE_SIZE = 9;

export const Route = createFileRoute("/gazette/")({
  head: () => ({
    meta: [
      { title: "الجريدة | مكتبة ترشيش" },
      {
        name: "description",
        content: "جريدة ترشيش: أخبار ومقالات تاريخية وثقافية مختارة، بقراءة أنيقة ومهلة قراءة مقدّرة.",
      },
      { property: "og:title", content: "الجريدة | مكتبة ترشيش" },
      { property: "og:description", content: "أخبار ومقالات تاريخية وثقافية في جريدة مكتبة ترشيش." },
    ],
  }),
  component: Gazette,
});

/**
 * تدرّجات من عائلة الذهب نفسها لتمييز التصنيفات، مشتقّة من متغيّر --gold
 * بإزاحة طفيفة في الدرجة اللونية، فتبقى داخل هوية الموقع في الوضعين.
 * "عاجل" وحده يحتفظ بلونه الأحمر المميّز.
 */
const CATEGORY_HUE: Record<string, number> = {
  سياسة: -14,
  التاريخ: 16,
  الثقافة: 30,
};

function categoryStyle(category: string): React.CSSProperties {
  const shift = CATEGORY_HUE[category] ?? 0;
  const base = `oklch(from var(--gold) l c calc(h + ${shift}))`;
  return { color: base, backgroundColor: `color-mix(in oklab, ${base} 14%, transparent)` };
}

function CategoryBadge({ category, plain = false }: { category: string; plain?: boolean }) {
  const c = normalizeCategory(category);
  if (c === "عاجل") {
    return (
      <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-bold tracking-wider text-red-400">
        {c}
      </span>
    );
  }
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] tracking-wider ${plain ? "" : ""}`}
      style={categoryStyle(c)}
    >
      {c}
    </span>
  );
}

function Card({ post, large = false }: { post: GazettePost; large?: boolean }) {
  return (
    <Link
      to="/gazette/$slug"
      params={{ slug: post.slug ?? post.id }}
      className={`glass group flex flex-col overflow-hidden rounded-2xl border border-gold/15 transition hover:border-gold/45 ${
        large ? "sm:col-span-2 sm:flex-row" : ""
      }`}
    >
      <div className={large ? "sm:w-1/2" : ""}>
        {post.media_url ? (
          <img
            src={post.media_url}
            alt={post.title}
            loading="lazy"
            className={`w-full object-cover ${large ? "h-52 sm:h-full" : "h-28"}`}
          />
        ) : (
          <GazetteCover title={post.title} className={large ? "h-52 w-full sm:h-full" : "h-28 w-full"} />
        )}
      </div>
      <div className={`flex flex-1 flex-col ${large ? "p-7" : "p-6"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={post.category} />
          <SourceBadge source={post.source_name} />
        </div>
        <h3
          className={`mt-3 leading-relaxed transition group-hover:text-gold ${
            large ? "text-2xl text-gold" : "text-lg"
          }`}
        >
          {post.title}
        </h3>
        <p
          className={`mt-3 flex-1 text-sm leading-7 text-muted-foreground ${
            large ? "line-clamp-4" : "line-clamp-3"
          }`}
        >
          {post.excerpt ?? post.content}
        </p>
        <span className="mt-5 inline-flex items-center gap-1 text-[11px] text-gold-soft">
          <Clock className="size-3" /> {readingMinutes(post.content)} دقيقة قراءة
        </span>
      </div>
    </Link>
  );
}

function Gazette() {
  const [cat, setCat] = useState("الكل");
  const [term, setTerm] = useState("");
  const [month, setMonth] = useState("الكل");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { data: posts, isLoading } = useQuery({ queryKey: ["gazette"], queryFn: () => fetchGazettePosts() });
  const { data: ads } = useAds();
  const sponsored = (ads ?? []).filter((a) => a.type === "sponsored_article");
  const inFeed = (ads ?? []).filter((a) => a.type === "in_feed");
  const sticky = (ads ?? []).find((a) => a.type === "sticky_bottom");

  const categories = useMemo(() => ["الكل", ...GAZETTE_CATEGORIES], []);

  const all = posts ?? [];

  const months = useMemo(() => {
    const keys = Array.from(new Set(all.map((p) => archiveKey(p.created_at))));
    return keys.sort().reverse();
  }, [all]);

  // الأكثر قراءة هذا الأسبوع — من بيانات المشاهدات الحقيقية فقط.
  const weekly = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return all
      .filter((p) => new Date(p.created_at).getTime() >= since && p.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [all]);

  const q = term.trim().toLowerCase();
  const list = all.filter((p) => {
    if (cat !== "الكل" && normalizeCategory(p.category) !== cat) return false;
    if (month !== "الكل" && archiveKey(p.created_at) !== month) return false;
    if (q && !(`${p.title} ${p.excerpt ?? ""} ${p.content}`.toLowerCase().includes(q))) return false;
    return true;
  });

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [cat, term, month]);

  const hero = list.find((p) => p.is_featured) ?? list[0];
  const rest = list.filter((p) => p.id !== hero?.id);
  const visible = rest.slice(0, limit);

  return (
    <main className="mx-auto max-w-7xl px-4 py-14">
      <header className="mb-10 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl text-gold">
          <Newspaper className="size-7" /> الجريدة
        </h1>
        <div className="gold-rule mx-auto mt-5 w-32" />
        <p className="mt-4 text-sm text-muted-foreground">أخبارٌ ومقالاتٌ من ذاكرة التاريخ وحاضر الثقافة.</p>
        <p className="mt-1 text-xs text-gold-soft">تصدر عن {PUBLISHER}</p>
      </header>

      <div className="mx-auto mb-10 flex max-w-xl items-center gap-2 rounded-full border border-gold/30 bg-card/60 px-4 py-1.5">
        <Search className="size-4 shrink-0 text-gold-soft" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث في عناوين المقالات ونصوصها…"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl bg-secondary/50" />
          ))}
        </div>
      ) : (
        <>
          {/* بانر مقال الصدارة — كامل العرض وبمساحة بارزة */}
          {hero && (
            <section className="mb-14">
              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="gold-rule w-16" />
                <span className="text-[11px] tracking-[0.3em] text-gold-soft">مقال الصدارة</span>
                <span className="gold-rule w-16" />
              </div>
              <Link
                to="/gazette/$slug"
                params={{ slug: hero.slug ?? hero.id }}
                className="group relative block overflow-hidden rounded-3xl border-2 border-gold/45 shadow-[0_26px_80px_-30px_oklch(0.55_0.12_70_/_0.6)] transition hover:border-gold"
              >
                {hero.media_url ? (
                  <img
                    src={hero.media_url}
                    alt={hero.title}
                    className="h-[320px] w-full object-cover transition duration-700 group-hover:scale-[1.03] md:h-[460px]"
                  />
                ) : (
                  <GazetteCover title={hero.title} className="h-[320px] w-full md:h-[460px]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
                  <div className="mx-auto max-w-4xl text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <CategoryBadge category={hero.category} />
                      <SourceBadge source={hero.source_name} />
                    </div>
                    <h2 className="mt-4 font-display text-3xl leading-[1.4] text-gold md:text-5xl">{hero.title}</h2>
                    <div className="gold-rule mx-auto mt-5 w-28" />
                    <p className="mx-auto mt-4 line-clamp-3 max-w-3xl text-sm leading-8 text-muted-foreground md:text-base">
                      {hero.excerpt ?? hero.content}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-gold-soft">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> {readingMinutes(hero.content)} دقيقة قراءة
                      </span>
                      <time className="text-muted-foreground">
                        {new Date(hero.created_at).toLocaleDateString("ar")}
                      </time>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          <div className="mb-5 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  cat === c ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-gold"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {sponsored.length > 0 && (
            <div className="mb-10 space-y-4">
              {sponsored.map((ad) => (
                <SponsoredAd key={ad.id} ad={ad} />
              ))}
            </div>
          )}

          {/* المحتوى الرئيسي + عمود جانبي لاصق على الشاشات الكبيرة */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <div className="grid gap-8 sm:grid-cols-2">
                {visible.map((p, i) => (
                  <Fragment key={p.id}>
                    <Card post={p} large={i === 0 || (i === 3 && Boolean(p.media_url))} />
                    {inFeed.length > 0 && i > 0 && i % 3 === 2 && (
                      <InFeedAd ad={inFeed[Math.floor(i / 3) % inFeed.length]!} />
                    )}
                  </Fragment>
                ))}
              </div>

              {rest.length > visible.length && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => setLimit((v) => v + PAGE_SIZE)}
                    className="rounded-full border border-gold/40 px-6 py-2 text-sm text-gold transition hover:bg-gold/10"
                  >
                    تحميل مقالات أقدم ({rest.length - visible.length})
                  </button>
                </div>
              )}

              {list.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {q ? "لا نتائج مطابقة لبحثك." : "لا مقالات في هذا التصنيف بعد."}
                </p>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {weekly.length > 0 && (
                <section className="glass rounded-2xl border border-gold/15 p-6">
                  <h2 className="flex items-center gap-2 text-sm text-gold">
                    <Flame className="size-4" /> الأكثر قراءة هذا الأسبوع
                  </h2>
                  <ol className="mt-4 space-y-3">
                    {weekly.map((p, i) => (
                      <li key={p.id} className="flex items-start gap-3 text-sm">
                        <span className="text-gold-soft">{i + 1}.</span>
                        <Link
                          to="/gazette/$slug"
                          params={{ slug: p.slug ?? p.id }}
                          className="min-w-0 flex-1 leading-6 text-muted-foreground transition hover:text-gold"
                        >
                          <span className="line-clamp-2">{p.title}</span>
                          <span className="mt-0.5 block text-[11px] text-gold-soft">{p.views} مشاهدة</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {months.length > 0 && (
                <section className="glass rounded-2xl border border-gold/15 p-6">
                  <h2 className="text-sm text-gold">الأرشيف الشهري</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["الكل", ...months].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonth(m)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          month === m
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border/70 text-muted-foreground hover:text-gold"
                        }`}
                      >
                        {m === "الكل" ? "كل الشهور" : archiveLabel(m)}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </>
      )}

      {sticky && <StickyBottomAd ad={sticky} />}
    </main>
  );
}
