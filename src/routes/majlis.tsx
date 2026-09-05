import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, BadgeCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { InFeedAd, SponsoredAd, StickyBottomAd, useAds } from "@/components/ad-slot";

export const Route = createFileRoute("/majlis")({
  head: () => ({
    meta: [
      { title: "المجلس الثقافي | مكتبة زينة" },
      { name: "description", content: "مقالات يومية ومراجعات ونقاشات متشعّبة بين قرّاء مكتبة زينة." },
      { property: "og:title", content: "المجلس الثقافي | مكتبة زينة" },
      { property: "og:description", content: "مقالات يومية ونقاشات بين القرّاء والمؤلفين." },
    ],
  }),
  component: Majlis,
});

type Post = {
  id: string;
  author_id: string | null;
  title: string;
  content: string;
  media_url: string | null;
  created_at: string;
};

function Majlis() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,author_id,title,content,media_url,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  const { data: likes } = useQuery({
    queryKey: ["likes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("post_likes").select("post_id,user_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: ads } = useAds();
  const inFeedAds = (ads ?? []).filter((a) => a.type === "in_feed");
  const sponsoredAds = (ads ?? []).filter((a) => a.type === "sponsored_article");
  const stickyAd = (ads ?? []).find((a) => a.type === "sticky_bottom");

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { error } = await supabase
        .from("posts")
        .insert({ author_id: user.id, title: title.trim(), content: content.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      toast.success("نُشرت مشاركتك في المجلس");
      void qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => toast.error("تعذّر نشر المشاركة"),
  });

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("auth");
      const mine = likes?.some((l) => l.post_id === postId && l.user_id === user.id);
      if (mine) {
        const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["likes"] }),
    onError: () => toast("سجّل الدخول لتتفاعل مع المقالات"),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <header className="mb-10 text-center">
        <h1 className="text-4xl text-gold">المجلس الثقافي</h1>
        <div className="gold-rule mx-auto mt-5 w-32" />
        <p className="mt-4 text-sm text-muted-foreground">مقالُ اليوم، ورأيُك، ومجلسٌ لا يُغلق بابه.</p>
      </header>

      {user ? (
        <section className="glass mb-10 space-y-3 rounded-xl p-5">
          <Input
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان مشاركتك…"
            className="bg-background"
          />
          <Textarea
            value={content}
            maxLength={4000}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب مقالك أو مراجعتك أو اقتباساً أعجبك…"
            className="min-h-28 bg-background"
          />
          <Button
            disabled={!title.trim() || !content.trim() || publish.isPending}
            onClick={() => publish.mutate()}
          >
            <Send className="size-4" /> انشر في المجلس
          </Button>
        </section>
      ) : (
        <p className="mb-10 text-center text-sm text-muted-foreground">
          <Link to="/auth" className="text-gold underline">
            سجّل الدخول
          </Link>{" "}
          لتنشر مشاركتك وتشارك في النقاش.
        </p>
      )}

      <div className="space-y-6">
        {sponsoredAds.map((ad) => (
          <SponsoredAd key={ad.id} ad={ad} />
        ))}
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl bg-secondary/50" />)
          : posts?.map((p, idx) => {
              const count = likes?.filter((l) => l.post_id === p.id).length ?? 0;
              const mine = !!user && !!likes?.some((l) => l.post_id === p.id && l.user_id === user.id);
              const ad = idx > 0 && idx % 3 === 0 ? inFeedAds[Math.floor(idx / 3) % Math.max(inFeedAds.length, 1)] : undefined;
              return (
                <article key={p.id} className="glass rounded-xl p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BadgeCheck className="size-4 text-gold" />
                    {p.author_id ? "عضو في المجلس" : "تحرير مكتبة زينة"}
                    <span>·</span>
                    <time>{new Date(p.created_at).toLocaleDateString("ar")}</time>
                  </div>
                  <h2 className="mt-3 text-2xl leading-relaxed">{p.title}</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-8 text-muted-foreground">{p.content}</p>
                  <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
                    <button
                      onClick={() => toggleLike.mutate(p.id)}
                      className={`flex items-center gap-1 text-sm transition ${mine ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                    >
                      <Heart className={`size-4 ${mine ? "fill-current" : ""}`} /> {count}
                    </button>
                    <Comments postId={p.id} />
                  </div>
                </article>
              );
            })}
      </div>
    </main>
  );
}

type Comment = { id: string; post_id: string; user_id: string; parent_id: string | null; content: string; created_at: string };

function Comments({ postId }: { postId: string }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const { data: comments } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id,post_id,user_id,parent_id,content,created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: open,
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { error } = await supabase
        .from("comments")
        .insert({ post_id: postId, user_id: user.id, parent_id: replyTo, content: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      setReplyTo(null);
      toast.success("أُضيفت مداخلتك");
      void qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: () => toast.error("تعذّر إرسال المداخلة"),
  });

  const roots = comments?.filter((c) => !c.parent_id) ?? [];

  return (
    <div className="flex-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-gold"
      >
        <MessageCircle className="size-4" /> النقاش
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {roots.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-sm leading-7">{c.content}</p>
              <button
                onClick={() => setReplyTo(c.id)}
                className="mt-1 text-xs text-muted-foreground hover:text-gold"
              >
                ردّ
              </button>
              <div className="mt-2 space-y-2 border-s-2 border-gold/30 pe-0 ps-3">
                {comments
                  ?.filter((r) => r.parent_id === c.id)
                  .map((r) => (
                    <p key={r.id} className="text-sm leading-7 text-muted-foreground">
                      {r.content}
                    </p>
                  ))}
              </div>
            </div>
          ))}

          {user ? (
            <div className="flex gap-2">
              <Input
                value={text}
                maxLength={1000}
                onChange={(e) => setText(e.target.value)}
                placeholder={replyTo ? "اكتب ردّك…" : "شاركنا رأيك…"}
                className="bg-background"
              />
              <Button size="icon" disabled={!text.trim() || send.isPending} onClick={() => send.mutate()}>
                <Send className="size-4" />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">سجّل الدخول للمشاركة في النقاش.</p>
          )}
        </div>
      )}
    </div>
  );
}
