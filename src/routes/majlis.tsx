import { Fragment, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BookMarked, Heart, MessageCircle, Pin, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useProfiles } from "@/hooks/use-profiles";
import { MemberBadge } from "@/components/member-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MAJLIS_CATEGORIES, MAJLIS_SORTS, type MajlisSort } from "@/lib/majlis";

export const Route = createFileRoute("/majlis")({
  validateSearch: (search: Record<string, unknown>): { book?: string; bookTitle?: string } => ({
    ...(typeof search['book'] === "string" && search['book'] ? { book: search['book'] as string } : {}),
    ...(typeof search['bookTitle'] === "string" && search['bookTitle']
      ? { bookTitle: search['bookTitle'] as string }
      : {}),
  }),
  head: () => ({
    meta: [
      { title: "المجلس الثقافي | مكتبة ترشيش" },
      { name: "description", content: "مقالات يومية ومراجعات ونقاشات متشعّبة بين قرّاء مكتبة ترشيش." },
      { property: "og:title", content: "المجلس الثقافي | مكتبة ترشيش" },
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
  majlis_category: string | null;
  book_id: string | null;
  is_pinned: boolean;
};

function Majlis() {
  const { book: bookId, bookTitle } = Route.useSearch();
  const { user } = useSession();
  const { byId } = useProfiles();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(MAJLIS_CATEGORIES[1]);
  const [filter, setFilter] = useState<string>("الكل");
  const [sort, setSort] = useState<MajlisSort>("new");

  // تعبئة النموذج تلقائياً عند القدوم من تفاصيل كتاب في المتجر
  useEffect(() => {
    if (bookId && bookTitle) {
      setCategory("نقاش كتاب");
      setTitle((t) => t || `نقاش كتاب: ${bookTitle}`);
    }
  }, [bookId, bookTitle]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,author_id,title,content,media_url,created_at,majlis_category,book_id,is_pinned")
        .eq("section", "majlis")
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

  // معرفات التعليقات فقط، لحساب عدد النقاشات وعدد المشاركين بكفاءة
  const { data: commentMeta } = useQuery({
    queryKey: ["comment-meta"],
    queryFn: async () => {
      const { data, error } = await supabase.from("comments").select("post_id,user_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: books } = useQuery({
    queryKey: ["majlis-books"],
    enabled: (posts ?? []).some((p) => p.book_id),
    queryFn: async () => {
      const ids = [...new Set((posts ?? []).map((p) => p.book_id).filter(Boolean))] as string[];
      if (!ids.length) return [];
      const { data, error } = await supabase.from("books").select("id,title,cover_image_url").in("id", ids);
      if (error) throw error;
      return data;
    },
  });

  const bookById = (id: string | null) => (id ? books?.find((b) => b.id === id) : undefined);

  const counts = useMemo(() => {
    const likeCount = new Map<string, number>();
    const commentCount = new Map<string, number>();
    for (const l of likes ?? []) likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1);
    for (const c of commentMeta ?? []) commentCount.set(c.post_id, (commentCount.get(c.post_id) ?? 0) + 1);
    return { likeCount, commentCount };
  }, [likes, commentMeta]);

  const participants = useMemo(() => {
    const set = new Set<string>();
    for (const p of posts ?? []) if (p.author_id) set.add(p.author_id);
    for (const c of commentMeta ?? []) set.add(c.user_id);
    return set.size;
  }, [posts, commentMeta]);

  const visible = useMemo(() => {
    let list = [...(posts ?? [])];
    if (filter !== "الكل") list = list.filter((p) => p.majlis_category === filter);
    if (sort === "liked") list.sort((a, b) => (counts.likeCount.get(b.id) ?? 0) - (counts.likeCount.get(a.id) ?? 0));
    else if (sort === "discussed")
      list.sort((a, b) => (counts.commentCount.get(b.id) ?? 0) - (counts.commentCount.get(a.id) ?? 0));
    list.sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
    return list;
  }, [posts, filter, sort, counts]);

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
        majlis_category: category,
        book_id: bookId ?? null,
      });
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

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-xs transition ${
      active ? "border-gold/60 bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-gold"
    }`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <header className="mb-8 text-center">
        <h1 className="text-4xl text-gold">المجلس الثقافي</h1>
        <div className="gold-rule mx-auto mt-5 w-32" />
        <p className="mt-4 text-sm text-muted-foreground">مقالُ اليوم، ورأيُك، ومجلسٌ لا يُغلق بابه.</p>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5 text-gold" /> {participants} عضواً شاركوا في المجلس حتى الآن
        </p>
      </header>

      <NotificationsBell />

      {user ? (
        <section className="glass mb-8 space-y-3 rounded-xl p-5">
          {bookId && bookTitle && (
            <p className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs text-gold">
              <BookMarked className="size-4" /> نقاش مرتبط بكتاب: {bookTitle}
            </p>
          )}
          <Input
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان مشاركتك…"
            className="bg-background"
          />
          <div className="flex flex-wrap gap-2">
            {MAJLIS_CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={chip(category === c)}>
                {c}
              </button>
            ))}
          </div>
          <Textarea
            value={content}
            maxLength={4000}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب مقالك أو مراجعتك أو اقتباساً أعجبك…"
            className="min-h-28 bg-background"
          />
          <Button disabled={!title.trim() || !content.trim() || publish.isPending} onClick={() => publish.mutate()}>
            <Send className="size-4" /> انشر في المجلس
          </Button>
        </section>
      ) : (
        <p className="mb-8 text-center text-sm text-muted-foreground">
          <Link to="/auth" className="text-gold underline">
            سجّل الدخول
          </Link>{" "}
          لتنشر مشاركتك وتشارك في النقاش.
        </p>
      )}

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {["الكل", ...MAJLIS_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={chip(filter === c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">الترتيب:</span>
          {MAJLIS_SORTS.map((s) => (
            <button key={s.id} onClick={() => setSort(s.id)} className={chip(sort === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl bg-secondary/50" />)
          : visible.map((p) => {
              const count = counts.likeCount.get(p.id) ?? 0;
              const mine = !!user && !!likes?.some((l) => l.post_id === p.id && l.user_id === user.id);
              const linked = bookById(p.book_id);
              return (
                <Fragment key={p.id}>
                  <article className={`glass rounded-xl p-6 ${p.is_pinned ? "border-gold/50" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <MemberBadge profile={byId(p.author_id)} verified={!p.author_id} />
                      <span>·</span>
                      <time>{new Date(p.created_at).toLocaleDateString("ar")}</time>
                      {p.majlis_category && (
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] text-gold">
                          {p.majlis_category}
                        </span>
                      )}
                      {p.is_pinned && (
                        <span className="flex items-center gap-1 rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 text-[11px] text-gold">
                          <Pin className="size-3" /> مثبّت
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 text-2xl leading-relaxed">{p.title}</h2>
                    {linked && (
                      <Link
                        to="/store"
                        search={{ q: linked.title }}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card/60 px-3 py-1.5 text-[11px] text-gold transition hover:border-gold/60"
                      >
                        {linked.cover_image_url && (
                          <img src={linked.cover_image_url} alt="" className="size-6 rounded object-cover" />
                        )}
                        <BookMarked className="size-3.5" /> {linked.title}
                      </Link>
                    )}
                    <p className="mt-3 whitespace-pre-line text-sm leading-8 text-muted-foreground">{p.content}</p>
                    <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
                      <button
                        onClick={() => toggleLike.mutate(p.id)}
                        className={`flex items-center gap-1 text-sm transition ${mine ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                      >
                        <Heart className={`size-4 ${mine ? "fill-current" : ""}`} /> {count}
                      </button>
                      <Comments postId={p.id} count={counts.commentCount.get(p.id) ?? 0} />
                    </div>
                  </article>
                </Fragment>
              );
            })}
      </div>
    </main>
  );
}

function NotificationsBell() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,preview,is_read,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id?: string) => {
      let q = supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
      if (id) q = q.eq("id", id);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!user) return null;
  const unread = (items ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="mb-6 flex flex-col items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition hover:text-gold"
      >
        <Bell className="size-4" /> إشعاراتي
        {unread > 0 && (
          <span className="absolute -top-1.5 -start-1.5 grid size-5 place-items-center rounded-full bg-gold text-[10px] text-background">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass mt-3 w-full space-y-2 rounded-xl p-4">
          {(items ?? []).length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">لا توجد إشعارات بعد.</p>
          ) : (
            <>
              {(items ?? []).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead.mutate(n.id)}
                  className={`block w-full rounded-lg border p-3 text-right text-xs leading-6 ${
                    n.is_read ? "border-border text-muted-foreground" : "border-gold/40 bg-gold/5 text-foreground"
                  }`}
                >
                  ردّ جديد: {n.preview}
                </button>
              ))}
              {unread > 0 && (
                <Button size="sm" variant="outline" onClick={() => markRead.mutate(undefined)}>
                  تعليم الكل كمقروء
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

type Comment = { id: string; post_id: string; user_id: string; parent_id: string | null; content: string; created_at: string };

function Comments({ postId, count }: { postId: string; count?: number }) {
  const { user } = useSession();
  const { byId } = useProfiles();
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
      void qc.invalidateQueries({ queryKey: ["comment-meta"] });
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
        <MessageCircle className="size-4" /> النقاش {count ? `(${count})` : ""}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {roots.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-secondary/40 p-3">
              <MemberBadge profile={byId(c.user_id)} fallback="عضو" />
              <p className="mt-2 text-sm leading-7">{c.content}</p>
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
                    <div key={r.id}>
                      <MemberBadge profile={byId(r.user_id)} fallback="عضو" />
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">{r.content}</p>
                    </div>
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
