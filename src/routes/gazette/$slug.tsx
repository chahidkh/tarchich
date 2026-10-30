import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { bumpGazetteViews, getGazetteMeta } from "@/lib/gazette.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { GAZETTE_FIELDS, PUBLISHER, normalizeCategory, readingMinutes, type GazettePost } from "@/lib/gazette";
import { GazetteShare, SourceBadge } from "@/components/gazette-share";
import { CategoryBadge, SourceImage, SourceLine } from "@/components/gazette-ui";
import { InFeedAd, SponsoredAd, StickyBottomAd, useAds } from "@/components/ad-slot";

export const Route = createFileRoute("/gazette/$slug")({
  loader: ({ params }) => getGazetteMeta({ data: { slug: params.slug } }),
  head: ({ params, loaderData }) => {
    const title = loaderData?.title ? `${loaderData.title} | جريدة مكتبة ترشيش` : "مقال الجريدة | مكتبة ترشيش";
    const description = (loaderData?.excerpt ?? "خبر ومقال من جريدة مكتبة ترشيش.").slice(0, 160);
    const image = loaderData?.media_url && /^https:\/\//.test(loaderData.media_url) ? loaderData.media_url : null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/gazette/${params.slug}` },
        ...(loaderData?.created_at ? [{ property: "article:published_time", content: loaderData.created_at }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: `/gazette/${params.slug}` }],
    };
  },
  errorComponent: () => (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center" role="alert">
      <h1 className="text-2xl text-gold">تعذّر تحميل المقال</h1>
      <p className="mt-3 text-sm text-muted-foreground">حدث خطأ أثناء التحميل، أعد المحاولة بعد قليل.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl text-gold">لم نعثر على هذا المقال</h1>
    </main>
  ),
  component: Article,
});

function useProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return p;
}

function Article() {
  const { slug } = Route.useParams();
  const progress = useProgress();
  const bumpViews = useServerFn(bumpGazetteViews);
  const { data: ads } = useAds();
  const inFeed = (ads ?? []).filter((a) => a.type === "in_feed");
  const sponsored = (ads ?? []).find((a) => a.type === "sponsored_article");
  const sticky = (ads ?? []).find((a) => a.type === "sticky_bottom");

  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ["gazette-post", slug],
    queryFn: async () => {
      const isUuid = /^[0-9a-f-]{36}$/i.test(slug);
      const { data, error } = await supabase
        .from("posts")
        .select(GAZETTE_FIELDS)
        .eq("section", "gazette")
        .eq(isUuid ? "id" : "slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as GazettePost | null;
    },
  });

  useEffect(() => {
    if (post?.id) void bumpViews({ data: { id: post.id } }).catch(() => {});
  }, [post?.id, bumpViews]);

  const [imgFailed, setImgFailed] = useState(false);
  const category = post ? normalizeCategory(post.category) : null;
  const { data: related } = useQuery({
    enabled: Boolean(post?.id && category),
    queryKey: ["gazette-related", post?.id, category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(GAZETTE_FIELDS)
        .eq("section", "gazette")
        .eq("is_published", true)
        .eq("category", category!)
        .neq("id", post!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as GazettePost[];
    },
  });


  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14">
        <Skeleton className="h-96 rounded-xl bg-secondary/50" />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center" role="alert">
        <h1 className="text-2xl text-gold">تعذّر تحميل المقال</h1>
        <button onClick={() => void refetch()} className="mt-6 rounded-full border border-gold/40 px-5 py-1.5 text-sm text-gold">
          إعادة المحاولة
        </button>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl text-gold">لم نعثر على هذا المقال</h1>
        <Link to="/gazette" className="mt-6 inline-block text-sm text-gold underline">
          العودة إلى الجريدة
        </Link>
      </main>
    );
  }

  const paragraphs = post.content.split(/\n{2,}/);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
        <div className="h-full bg-gold transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <main className="mx-auto max-w-3xl px-4 py-14">
        <Link to="/gazette" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold">
          <ArrowRight className="size-4" /> الجريدة
        </Link>

        <article className="glass rounded-2xl border-gold/30 p-6 sm:p-10">
          <Link to="/gazette" search={{ section: normalizeCategory(post.category) }}>
            <CategoryBadge category={post.category} />
          </Link>
          <h1 className="mt-3 text-2xl leading-[1.5] text-gold sm:text-4xl">{post.title}</h1>
          <div className="gold-rule mt-5 w-32" />
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("ar")}</time>
            <span className="inline-flex items-center gap-1 text-gold-soft">
              <Clock className="size-3.5" /> {readingMinutes(post.content)} دقيقة قراءة
            </span>
            <span className="text-gold-soft">نشر: {PUBLISHER}</span>
            <SourceBadge source={post.source_name} />
          </div>

          <div className="mt-5">
            <GazetteShare title={post.title} />
          </div>


          {post.media_url && !imgFailed && (
            <figure className="mt-6">
              <SourceImage
                src={post.media_url}
                alt={post.title}
                eager
                className="rounded-xl"
                onFail={() => setImgFailed(true)}
              />
              <figcaption>
                <SourceLine post={post} className="mt-2" />
              </figcaption>
            </figure>
          )}
          {(!post.media_url || imgFailed) && post.source_url && <SourceLine post={post} className="mt-4" />}

          <div className="mt-6 space-y-5">
            {paragraphs.map((para, i) => (
              <div key={i}>
                <p className="article-body whitespace-pre-line text-[17px] leading-9 text-parchment/90">{para}</p>
                {i === 1 && inFeed[0] && (
                  <div className="mt-5">
                    <InFeedAd ad={inFeed[0]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>

        {(related ?? []).length > 0 && (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-xl text-gold">مقالات ذات صلة</h2>
            <div className="gold-rule mt-3 w-24" />
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {(related ?? []).map((r) => (
                <Link
                  key={r.id}
                  to="/gazette/$slug"
                  params={{ slug: r.slug ?? r.id }}
                  className="glass group flex flex-col overflow-hidden rounded-xl border-gold/25 transition hover:border-gold/60"
                >
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm leading-relaxed transition group-hover:text-gold">
                      {r.title}
                    </h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-gold-soft">
                      <Clock className="size-3" /> {readingMinutes(r.content)} دقيقة قراءة
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {sponsored && (
          <div className="mt-8">
            <SponsoredAd ad={sponsored} />
          </div>
        )}
      </main>

      {sticky && <StickyBottomAd ad={sticky} />}
    </>
  );
}
