import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Newspaper, Sparkles, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/lib/site-settings";
import {
  GAZETTE_CATEGORIES,
  PUBLISHER,
  fetchGazettePosts,
  normalizeCategory,
  slugify,
  type GazetteCategory,
  type GazettePost,
} from "@/lib/gazette";
import { composeGazetteArticle } from "@/lib/gazette-ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export function GazettePanel() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GazetteCategory>("الثقافة");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState("");
  const [uploading, setUploading] = useState(false);
  const [source, setSource] = useState("");

  const compose = useServerFn(composeGazetteArticle);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-gazette"],
    queryFn: () => fetchGazettePosts(false),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-gazette"] });
    void qc.invalidateQueries({ queryKey: ["gazette"] });
  };

  const generate = useMutation({
    mutationFn: () => compose({ data: { source: source.trim() } }),
    onSuccess: (a) => {
      setTitle(a.title);
      setCategory(a.category);
      setExcerpt(a.excerpt);
      setContent(a.content);
      toast.success(`صيغ المقال وصُنّف في «${a.category}»`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("posts").insert({
        title: title.trim(),
        slug: slugify(title),
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        media_url: media.trim() || null,
        category,
        section: "gazette",
        is_published: false,
        author_id: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setExcerpt("");
      setContent("");
      setMedia("");
      setSource("");
      toast.success("أُضيف المقال كمسودّة");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase.from("posts").update(values as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("حُذف المقال");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      setMedia(await uploadAsset("site-assets", file, "gazette"));
      toast.success("رُفعت صورة المقال");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الرفع");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="glass rounded-xl p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl text-gold">
        <Newspaper className="size-5" /> إدارة الجريدة
      </h2>

      <div className="mt-5 space-y-3 rounded-lg border border-gold/30 bg-card/60 p-4">
        <p className="flex items-center gap-2 text-sm text-gold-soft">
          <Sparkles className="size-4" /> المحرّر الذكي — يصوغ الخبر بصوت {PUBLISHER} ويصنّفه تلقائياً
        </p>
        <Textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="ألصق هنا نصّ الخبر أو موضوعه…"
          className="min-h-28 bg-background"
        />
        <Button
          variant="outline"
          disabled={source.trim().length < 10 || generate.isPending}
          onClick={() => generate.mutate()}
        >
          {generate.isPending ? "جارٍ التحرير…" : "توليد المقال وتصنيفه"}
        </Button>
      </div>

      <div className="mt-5 space-y-3 rounded-lg border border-border bg-card/60 p-4">
        <Input value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المقال" className="bg-background" />
        <div className="flex flex-wrap gap-2">
          {GAZETTE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                category === c ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-gold"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <Textarea value={excerpt} maxLength={300} onChange={(e) => setExcerpt(e.target.value)} placeholder="مقتطف قصير" className="bg-background" />
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="نص المقال…" className="min-h-40 bg-background" />
        <div className="flex flex-wrap items-center gap-2">
          <Input value={media} onChange={(e) => setMedia(e.target.value)} placeholder="رابط صورة المقال" className="bg-background" />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/60">
            <Upload className="size-4" /> {uploading ? "جارٍ الرفع…" : "رفع صورة"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
          </label>
        </div>
        <Button disabled={!title.trim() || !content.trim() || create.isPending} onClick={() => create.mutate()}>
          إضافة مقال
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-secondary/50" />)
          : (posts ?? []).map((p: GazettePost) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/60 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {normalizeCategory(p.category)} · {p.views} مشاهدة · {p.is_published ? "منشور" : "مسودّة"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  نشر
                  <Switch checked={p.is_published} onCheckedChange={() => patch.mutate({ id: p.id, values: { is_published: !p.is_published } })} />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  الصدارة
                  <Switch checked={p.is_featured} onCheckedChange={() => patch.mutate({ id: p.id, values: { is_featured: !p.is_featured } })} />
                </label>
                <Button variant="outline" size="icon" onClick={() => del.mutate(p.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
      </div>
    </section>
  );
}
