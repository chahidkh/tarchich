import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { bumpGazetteViews } from "@/lib/gazette.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { GAZETTE_FIELDS, PUBLISHER, normalizeCategory, readingMinutes, type GazettePost } from "@/lib/gazette";
import { GazetteShare, SourceBadge } from "@/components/gazette-share";
import { GazetteCover } from "@/components/gazette-cover";
import { InFeedAd, SponsoredAd, StickyBottomAd, useAds } from "@/components/ad-slot";

export const Route = createFileRoute("/gazette/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `مقال الجريدة | مكتبة ترشيش` },
      { name: "description", content: `اقرأ مقال ${params.slug} في جريدة مكتبة ترشيش الثقافية والتاريخية.` },
      { property: "og:title", content: "مقال الجريدة | مكتبة ترشيش" },
      { property: "og:description", content: "مقال ثقافي وتاريخي من جريدة مكتبة ترشيش." },
    ],
  }),
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

  const { data: post, isLoading } = useQuery({
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
        .neq("id", post!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data as GazettePost[]).filter((p) => normalizeCategory(p.category) === category).slice(0, 3);
    },
  });


  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14">
        <Skeleton className="h-96 rounded-xl bg-secondary/50" />
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
          <span
            className={`text-[11px] tracking-widest ${
              normalizeCategory(post.category) === "عاجل" ? "font-bold text-red-400" : "text-gold-soft"
            }`}
          >
            {normalizeCategory(post.category)}
          </span>
          <h1 className="mt-3 text-4xl leading-[1.5] text-gold">{post.title}</h1>
          <div className="gold-rule mt-5 w-32" />
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <time>{new Date(post.created_at).toLocaleDateString("ar")}</time>
            <span className="inline-flex items-center gap-1 text-gold-soft">
              <Clock className="size-3.5" /> {readingMinutes(post.content)} دقيقة قراءة
            </span>
            <span className="text-gold-soft">نشر: {PUBLISHER}</span>
            <SourceBadge source={post.source_name} />
          </div>

          <div className="mt-5">
            <GazetteShare title={post.title} />
          </div>


          {post.media_url && (
            <img src={post.media_url} alt={post.title} className="mt-6 w-full rounded-xl object-cover" />
          )}

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
