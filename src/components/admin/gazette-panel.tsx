import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Newspaper, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/lib/site-settings";
import { fetchGazettePosts, slugify, type GazettePost } from "@/lib/gazette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export function GazettePanel() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("أخبار");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-gazette"],
    queryFn: () => fetchGazettePosts(false),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-gazette"] });
    void qc.invalidateQueries({ queryKey: ["gazette"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("posts").insert({
        title: title.trim(),
        slug: slugify(title),
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        media_url: media.trim() || null,
        category: category.trim() || "أخبار",
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

      <div className="mt-5 space-y-3 rounded-lg border border-border bg-card/60 p-4">
        <Input value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المقال" className="bg-background" />
        <Input value={category} maxLength={40} onChange={(e) => setCategory(e.target.value)} placeholder="التصنيف (تاريخ، ثقافة، أخبار…)" className="bg-background" />
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
                    {p.category ?? "أخبار"} · {p.views} مشاهدة · {p.is_published ? "منشور" : "مسودّة"}
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
