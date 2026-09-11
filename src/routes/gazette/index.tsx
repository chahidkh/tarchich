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

function Card({ post }: { post: GazettePost }) {
  return (
    <Link
      to="/gazette/$slug"
      params={{ slug: post.slug ?? post.id }}
      className="glass group flex flex-col overflow-hidden rounded-xl border-gold/25 transition hover:border-gold/60"
    >
      {post.media_url ? (
        <img src={post.media_url} alt={post.title} loading="lazy" className="h-40 w-full object-cover" />
      ) : (
        <GazetteCover title={post.title} />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[11px] tracking-widest ${
              normalizeCategory(post.category) === "عاجل" ? "font-bold text-red-400" : "text-gold-soft"
            }`}
          >
            {normalizeCategory(post.category)}
          </span>
          <SourceBadge source={post.source_name} />
        </div>
        <h3 className="mt-2 text-xl leading-relaxed transition group-hover:text-gold">{post.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-7 text-muted-foreground">
          {post.excerpt ?? post.content}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 rounded-full border border-gold/30 px-2.5 py-1 text-[11px] text-gold-soft">
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
    <main className="mx-auto max-w-6xl px-4 py-14">
      <header className="mb-10 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl text-gold">
          <Newspaper className="size-7" /> الجريدة
        </h1>
        <div className="gold-rule mx-auto mt-5 w-32" />
        <p className="mt-4 text-sm text-muted-foreground">أخبارٌ ومقالاتٌ من ذاكرة التاريخ وحاضر الثقافة.</p>
        <p className="mt-1 text-xs text-gold-soft">تصدر عن {PUBLISHER}</p>
      </header>

      <div className="mx-auto mb-8 flex max-w-xl items-center gap-2 rounded-full border border-gold/30 bg-card/60 px-4 py-1.5">
        <Search className="size-4 shrink-0 text-gold-soft" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث في عناوين المقالات ونصوصها…"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl bg-secondary/50" />
          ))}
        </div>
      ) : (
        <>
          {hero && (
            <section className="mb-12">
              <div className="mb-3 flex items-center justify-center gap-3">
                <span className="gold-rule w-16" />
                <span className="text-[11px] tracking-[0.3em] text-gold-soft">مقال الصدارة</span>
                <span className="gold-rule w-16" />
              </div>
              <Link
                to="/gazette/$slug"
                params={{ slug: hero.slug ?? hero.id }}
                className="glass group grid gap-7 overflow-hidden rounded-2xl border-2 border-gold/50 p-6 shadow-[0_18px_60px_-25px_oklch(0.55_0.12_70_/_0.55)] transition hover:border-gold md:grid-cols-5 md:p-9"
              >
                <div className="md:col-span-3">
                  {hero.media_url ? (
                    <img
                      src={hero.media_url}
                      alt={hero.title}
                      className="h-72 w-full rounded-xl object-cover md:h-80"
                    />
                  ) : (
                    <GazetteCover title={hero.title} className="h-72 w-full rounded-xl border md:h-80" />
                  )}
                </div>
                <div className="self-center md:col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] ${
                        normalizeCategory(hero.category) === "عاجل"
                          ? "bg-red-500/15 font-bold text-red-400"
                          : "bg-gold/15 text-gold"
                      }`}
                    >
                      {normalizeCategory(hero.category)}
                    </span>
                    <SourceBadge source={hero.source_name} />
                  </div>
                  <h2 className="mt-4 font-display text-3xl leading-[1.45] text-gold transition group-hover:text-gold md:text-4xl">
                    {hero.title}
                  </h2>
                  <div className="gold-rule mt-4 w-24" />
                  <p className="mt-4 line-clamp-5 text-sm leading-8 text-muted-foreground">
                    {hero.excerpt ?? hero.content}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gold-soft">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> {readingMinutes(hero.content)} دقيقة قراءة
                    </span>
                    <time className="text-muted-foreground">
                      {new Date(hero.created_at).toLocaleDateString("ar")}
                    </time>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {weekly.length > 0 && (
            <section className="glass mb-8 rounded-xl border-gold/25 p-5">
              <h2 className="flex items-center gap-2 text-sm text-gold">
                <Flame className="size-4" /> الأكثر قراءة هذا الأسبوع
              </h2>
              <ol className="mt-3 space-y-2">
                {weekly.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 text-sm">
                    <span className="text-gold-soft">{i + 1}.</span>
                    <Link
                      to="/gazette/$slug"
                      params={{ slug: p.slug ?? p.id }}
                      className="min-w-0 flex-1 truncate text-muted-foreground transition hover:text-gold"
                    >
                      {p.title}
                    </Link>
                    <span className="shrink-0 text-xs text-gold-soft">{p.views} مشاهدة</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="mb-4 flex flex-wrap justify-center gap-2">
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

          {months.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">الأرشيف:</span>
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
          )}

          {sponsored.length > 0 && (
            <div className="mb-8 space-y-4">
              {sponsored.map((ad) => (
                <SponsoredAd key={ad.id} ad={ad} />
              ))}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p, i) => (
              <Fragment key={p.id}>
                <Card post={p} />
                {inFeed.length > 0 && i > 0 && i % 3 === 2 && (
                  <InFeedAd ad={inFeed[Math.floor(i / 3) % inFeed.length]!} />
                )}
              </Fragment>
            ))}
          </div>

          {rest.length > visible.length && (
            <div className="mt-10 text-center">
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
        </>
      )}

      {sticky && <StickyBottomAd ad={sticky} />}
    </main>
  );
}
