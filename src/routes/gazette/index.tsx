import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchGazettePosts, readingMinutes, type GazettePost } from "@/lib/gazette";
import { InFeedAd, SponsoredAd, StickyBottomAd, useAds } from "@/components/ad-slot";

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
      {post.media_url && (
        <img src={post.media_url} alt={post.title} loading="lazy" className="h-40 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[11px] tracking-widest text-gold-soft">{post.category ?? "أخبار"}</span>
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
  const { data: posts, isLoading } = useQuery({ queryKey: ["gazette"], queryFn: () => fetchGazettePosts() });
  const { data: ads } = useAds();
  const sponsored = (ads ?? []).filter((a) => a.type === "sponsored_article");
  const inFeed = (ads ?? []).filter((a) => a.type === "in_feed");
  const sticky = (ads ?? []).find((a) => a.type === "sticky_bottom");

  const categories = useMemo(
    () => ["الكل", ...Array.from(new Set((posts ?? []).map((p) => p.category ?? "أخبار")))],
    [posts],
  );

  const list = (posts ?? []).filter((p) => cat === "الكل" || (p.category ?? "أخبار") === cat);
  const hero = list.find((p) => p.is_featured) ?? list[0];
  const rest = list.filter((p) => p.id !== hero?.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <header className="mb-10 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl text-gold">
          <Newspaper className="size-7" /> الجريدة
        </h1>
        <div className="gold-rule mx-auto mt-5 w-32" />
        <p className="mt-4 text-sm text-muted-foreground">أخبارٌ ومقالاتٌ من ذاكرة التاريخ وحاضر الثقافة.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl bg-secondary/50" />
          ))}
        </div>
      ) : (
        <>
          {hero && (
            <Link
              to="/gazette/$slug"
              params={{ slug: hero.slug ?? hero.id }}
              className="glass mb-10 grid gap-6 overflow-hidden rounded-2xl border-gold/40 p-6 md:grid-cols-2 md:p-8"
            >
              {hero.media_url ? (
                <img src={hero.media_url} alt={hero.title} className="h-64 w-full rounded-xl object-cover" />
              ) : (
                <div className="grid h-64 place-items-center rounded-xl border border-gold/20 bg-secondary/40">
                  <Newspaper className="size-10 text-gold/60" />
                </div>
              )}
              <div className="self-center">
                <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] text-gold">مقال الصدارة</span>
                <h2 className="mt-4 text-3xl leading-relaxed text-parchment">{hero.title}</h2>
                <p className="mt-3 line-clamp-4 text-sm leading-8 text-muted-foreground">
                  {hero.excerpt ?? hero.content}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-xs text-gold-soft">
                  <Clock className="size-3.5" /> {readingMinutes(hero.content)} دقيقة قراءة
                </span>
              </div>
            </Link>
          )}

          <div className="mb-8 flex flex-wrap justify-center gap-2">
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
            <div className="mb-8 space-y-4">
              {sponsored.map((ad) => (
                <SponsoredAd key={ad.id} ad={ad} />
              ))}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p, i) => (
              <Fragment key={p.id}>
                <Card post={p} />
                {inFeed.length > 0 && i > 0 && i % 3 === 2 && (
                  <InFeedAd ad={inFeed[Math.floor(i / 3) % inFeed.length]!} />
                )}
              </Fragment>
            ))}
          </div>

          {list.length === 0 && <p className="text-center text-sm text-muted-foreground">لا مقالات في هذا التصنيف بعد.</p>}
        </>
      )}

      {sticky && <StickyBottomAd ad={sticky} />}
    </main>
  );
}
