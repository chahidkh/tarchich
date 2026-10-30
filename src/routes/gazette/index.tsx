import { Fragment, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Flame, Newspaper, Search, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  GAZETTE_CATEGORIES,
  GAZETTE_PAGE_SIZE,
  PUBLISHER,
  archiveLabel,
  fetchGazetteBreaking,
  fetchGazetteLead,
  fetchGazetteMonths,
  fetchGazetteMostRead,
  fetchGazettePage,
  isGazetteCategory,
  type GazettePost,
} from "@/lib/gazette";
import { CategoryBadge, MetaRow, NewsCard, SourceImage, SourceLine } from "@/components/gazette-ui";
import { InFeedAd, SponsoredAd, StickyBottomAd, useAds } from "@/components/ad-slot";

type GazetteSearch = { section?: string; month?: string; q?: string };

export const Route = createFileRoute("/gazette/")({
  validateSearch: (s: Record<string, unknown>): GazetteSearch => ({
    ...(isGazetteCategory(s["section"]) ? { section: s["section"] } : {}),
    ...(typeof s["month"] === "string" && /^\d{4}-\d{2}$/.test(s["month"]) ? { month: s["month"] } : {}),
    ...(typeof s["q"] === "string" && s["q"].trim() ? { q: s["q"].slice(0, 80) } : {}),
  }),
  head: () => ({
    meta: [
      { title: "الجريدة — أخبار سياسة واقتصاد ورياضة وثقافة | مكتبة ترشيش" },
      {
        name: "description",
        content: "جريدة ترشيش: آخر الأخبار في السياسة والاقتصاد والرياضة والتقنية والعلوم والثقافة والتاريخ، مع إسناد واضح لكل مصدر.",
      },
      { property: "og:title", content: "الجريدة | مكتبة ترشيش" },
      { property: "og:description", content: "أخبار ومقالات مصنّفة في أقسام جريدة مكتبة ترشيش." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/gazette" }],
  }),
  component: Gazette,
});

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="glass flex flex-col items-center gap-3 rounded-xl border border-destructive/40 p-8 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <button onClick={onRetry} className="rounded-full border border-gold/40 px-5 py-1.5 text-sm text-gold hover:bg-gold/10">
        إعادة المحاولة
      </button>
    </div>
  );
}

function BreakingTicker() {
  const { data } = useQuery({ queryKey: ["gazette", "breaking"], queryFn: fetchGazetteBreaking });
  if (!data || data.length === 0) return null;
  const items = [...data, ...data];
  return (
    <div className="mb-6 flex items-stretch overflow-hidden rounded-lg border border-red-500/30 bg-card/70" aria-label="شريط الأخبار العاجلة">
      <span className="z-10 inline-flex shrink-0 items-center gap-1 bg-red-500/15 px-3 text-xs font-bold text-red-400">
        <Zap className="size-3.5" /> عاجل
      </span>
      <div className="gazette-ticker min-w-0 flex-1 overflow-hidden py-2" role="marquee">
        <ul className="gazette-ticker-track">
          {items.map((p, i) => (
            <li key={`${p.id}-${i}`} className="shrink-0 px-5 text-sm" aria-hidden={i >= data.length || undefined}>
              <Link
                to="/gazette/$slug"
                params={{ slug: p.slug ?? p.id }}
                tabIndex={i >= data.length ? -1 : undefined}
                className="whitespace-nowrap text-foreground/90 hover:text-gold"
              >
                <span className="me-2 text-red-400">●</span>
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LeadStory({ post }: { post: GazettePost }) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(post.media_url) && !failed;
  return (
    <article className="glass group relative mb-8 overflow-hidden rounded-2xl border-2 border-gold/35 transition hover:border-gold/70">
      <div className={hasImage ? "grid lg:grid-cols-[1.35fr_1fr]" : ""}>
        {hasImage && (
          <SourceImage src={post.media_url!} alt={post.title} eager ratio="aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[380px]" onFail={() => setFailed(true)} />
        )}
        <div className={`flex flex-col justify-center gap-3 p-5 sm:p-8 ${hasImage ? "" : "mx-auto max-w-3xl py-10 text-center"}`}>
          <div className={hasImage ? "" : "flex justify-center"}>
            <CategoryBadge category={post.category} />
          </div>
          <h2 className="font-display text-2xl leading-[1.45] text-gold sm:text-4xl">
            <Link to="/gazette/$slug" params={{ slug: post.slug ?? post.id }} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </h2>
          <p className="line-clamp-4 text-sm leading-8 text-muted-foreground sm:text-base">{post.excerpt ?? post.content}</p>
          <div className={hasImage ? "" : "flex justify-center"}>
            <MetaRow post={post} />
          </div>
          {hasImage && <SourceLine post={post} className="relative z-10" />}
        </div>
      </div>
    </article>
  );
}

function Gazette() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/gazette/" });
  const [term, setTerm] = useState(search.q ?? "");
  const { data: ads } = useAds();
  const sponsored = (ads ?? []).filter((a) => a.type === "sponsored_article");
  const inFeed = (ads ?? []).filter((a) => a.type === "in_feed");
  const sticky = (ads ?? []).find((a) => a.type === "sticky_bottom");

  const filtered = Boolean(search.month || search.q);

  const lead = useQuery({
    queryKey: ["gazette", "lead", search.section ?? ""],
    queryFn: () => fetchGazetteLead(search.section),
    enabled: !filtered,
  });
  const leadId = filtered ? undefined : lead.data?.id;

  const feed = useInfiniteQuery({
    queryKey: ["gazette", "feed", search.section ?? "", search.month ?? "", search.q ?? "", leadId ?? ""],
    enabled: filtered || !lead.isLoading,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchGazettePage({ category: search.section, month: search.month, term: search.q, offset: pageParam, excludeId: leadId }),
    getNextPageParam: (last, pages) => {
      const loaded = pages.length * GAZETTE_PAGE_SIZE;
      return loaded < last.count ? loaded : undefined;
    },
  });
  const mostRead = useQuery({ queryKey: ["gazette", "most-read"], queryFn: fetchGazetteMostRead });
  const months = useQuery({ queryKey: ["gazette", "months"], queryFn: fetchGazetteMonths });

  const rows = feed.data?.pages.flatMap((p) => p.rows) ?? [];
  const total = feed.data?.pages[0]?.count ?? 0;
  const loading = (!filtered && lead.isLoading) || feed.isLoading;

  const setSection = (section?: string) =>
    void navigate({ search: (prev) => ({ ...prev, section, month: undefined }) });

  const today = new Date().toLocaleDateString("ar", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-12">
      <header className="mb-6 border-b-2 border-gold/40 pb-4 text-center">
        <p className="text-[11px] text-muted-foreground">{today}</p>
        <h1 className="mt-1 flex items-center justify-center gap-3 font-display text-4xl text-gold sm:text-6xl">
          <Newspaper className="size-7 sm:size-9" /> الجريدة
        </h1>
        <p className="mt-1 text-xs text-gold-soft">تصدر عن {PUBLISHER}</p>
      </header>

      <BreakingTicker />

      <nav aria-label="أقسام الجريدة" className="sticky top-14 z-30 -mx-3 mb-6 border-y border-gold/20 bg-background/85 px-3 backdrop-blur-md sm:top-16 sm:mx-0 sm:rounded-lg sm:border">
        <ul className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {[undefined, ...GAZETTE_CATEGORIES].map((c) => {
            const active = (search.section ?? undefined) === c;
            return (
              <li key={c ?? "all"} className="shrink-0">
                <button
                  onClick={() => setSection(c)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                    active ? "bg-gold/15 font-bold text-gold" : "text-muted-foreground hover:text-gold"
                  } ${c === "عاجل" && !active ? "text-red-400" : ""}`}
                >
                  {c ?? "الرئيسية"}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({ search: (prev) => ({ ...prev, q: term.trim() || undefined }) });
        }}
        className="mx-auto mb-8 flex max-w-xl items-center gap-2 rounded-full border border-gold/30 bg-card/60 px-4 py-1"
      >
        <Search className="size-4 shrink-0 text-gold-soft" aria-hidden />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث في عناوين الأخبار…"
          aria-label="البحث في الجريدة"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </form>

      {(search.section || filtered) && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <h2 className="font-display text-2xl text-gold">{search.section ?? "نتائج"}</h2>
          {search.month && <span className="text-muted-foreground">· {archiveLabel(search.month)}</span>}
          {search.q && <span className="text-muted-foreground">· «{search.q}»</span>}
          {!loading && <span className="text-xs text-muted-foreground">({total + (leadId ? 1 : 0)} خبر)</span>}
          {filtered && (
            <button
              onClick={() => {
                setTerm("");
                void navigate({ search: (prev) => ({ section: prev.section }) });
              }}
              className="ms-auto text-xs text-gold-soft underline"
            >
              إلغاء الترشيح
            </button>
          )}
        </div>
      )}

      {lead.isError || feed.isError ? (
        <ErrorBox
          message="تعذّر تحميل أخبار الجريدة. تحقّق من اتصالك ثم أعد المحاولة."
          onRetry={() => {
            void lead.refetch();
            void feed.refetch();
          }}
        />
      ) : loading ? (
        <div aria-busy="true" aria-label="جارٍ تحميل الأخبار">
          <Skeleton className="mb-8 h-[320px] rounded-2xl bg-secondary/50 sm:h-[400px]" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-60 rounded-xl bg-secondary/50" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {!filtered && lead.data && <LeadStory post={lead.data} />}

          {sponsored.length > 0 && (
            <div className="mb-8 space-y-4">
              {sponsored.map((ad) => (
                <SponsoredAd key={ad.id} ad={ad} />
              ))}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section aria-label="آخر الأخبار">
              {rows.length === 0 && !lead.data ? (
                <p className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
                  {search.q ? "لا نتائج مطابقة لبحثك." : "لا أخبار في هذا القسم بعد."}
                </p>
              ) : (
                <div className="grid grid-flow-row-dense gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map((p, i) => (
                    <Fragment key={p.id}>
                      <NewsCard post={p} size={i % GAZETTE_PAGE_SIZE === 0 || i % GAZETTE_PAGE_SIZE === 7 ? "lg" : "sm"} />
                      {inFeed.length > 0 && i % 6 === 5 && <InFeedAd ad={inFeed[Math.floor(i / 6) % inFeed.length]!} />}
                    </Fragment>
                  ))}
                </div>
              )}

              {feed.hasNextPage && (
                <div className="mt-10 text-center">
                  <button
                    onClick={() => void feed.fetchNextPage()}
                    disabled={feed.isFetchingNextPage}
                    className="rounded-full border border-gold/40 px-6 py-2 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-60"
                  >
                    {feed.isFetchingNextPage ? "جارٍ التحميل…" : `عرض المزيد (${total - rows.length})`}
                  </button>
                </div>
              )}
            </section>

            <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
              {(mostRead.data ?? []).length > 0 && (
                <section className="glass rounded-xl border border-gold/15 p-5" aria-labelledby="most-read">
                  <h2 id="most-read" className="flex items-center gap-2 text-sm text-gold">
                    <Flame className="size-4" /> الأكثر قراءة
                  </h2>
                  <ol className="mt-4 space-y-3">
                    {mostRead.data!.map((p, i) => (
                      <li key={p.id} className="flex items-start gap-3 border-b border-border/40 pb-3 text-sm last:border-0 last:pb-0">
                        <span className="font-display text-2xl leading-none text-gold/60">{i + 1}</span>
                        <Link
                          to="/gazette/$slug"
                          params={{ slug: p.slug ?? p.id }}
                          className="min-w-0 flex-1 leading-6 text-foreground/85 transition hover:text-gold"
                        >
                          <span className="line-clamp-2">{p.title}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">{p.views} مشاهدة</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {(months.data ?? []).length > 0 && (
                <section className="glass rounded-xl border border-gold/15 p-5" aria-labelledby="archive">
                  <h2 id="archive" className="text-sm text-gold">الأرشيف الشهري</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[undefined, ...months.data!].map((m) => (
                      <button
                        key={m ?? "all"}
                        onClick={() => void navigate({ search: (prev) => ({ ...prev, month: m }) })}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          search.month === m ? "border-gold bg-gold/10 text-gold" : "border-border/70 text-muted-foreground hover:text-gold"
                        }`}
                      >
                        {m ? archiveLabel(m) : "كل الشهور"}
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
