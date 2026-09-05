import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Ad = {
  id: string;
  title: string;
  type: "in_feed" | "sponsored_article" | "sticky_bottom";
  code_or_image: string;
  link: string | null;
  is_active: boolean;
};

export const AD_TYPE_LABEL: Record<Ad["type"], string> = {
  in_feed: "داخل المجلس",
  sponsored_article: "مقال إعلاني",
  sticky_bottom: "شريط لاصق أسفل الشاشة",
};

export function AdsPanel() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Ad["type"]>("in_feed");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ad[];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-ads"] });
    void qc.invalidateQueries({ queryKey: ["ads"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ads").insert({
        title: title.trim(),
        type,
        code_or_image: content.trim(),
        link: link.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setLink("");
      toast.success("أُضيف الإعلان");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (ad: Ad) => {
      const { error } = await supabase.from("ads").update({ is_active: !ad.is_active }).eq("id", ad.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("حُذف الإعلان");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadAsset("site-assets", file);
      setContent(url);
      toast.success("رُفعت صورة الإعلان");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="glass rounded-xl p-6">
      <h2 className="font-display text-2xl text-gold">إدارة الإعلانات</h2>

      <div className="mt-5 space-y-3 rounded-lg border border-border bg-card/60 p-4">
        <Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإعلان" className="bg-background" />
        <Select value={type} onValueChange={(v) => setType(v as Ad["type"])}>
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(AD_TYPE_LABEL) as Ad["type"][]).map((t) => (
              <SelectItem key={t} value={t}>
                {AD_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="رابط صورة الإعلان، أو نص/كود الإعلان…"
          className="min-h-20 bg-background"
        />
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" disabled={uploading}>
            <label className="cursor-pointer">
              <Upload className="size-4" /> {uploading ? "جارٍ الرفع…" : "رفع صورة إعلان"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
          </Button>
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="رابط الوجهة عند الضغط (اختياري)"
            dir="ltr"
            className="bg-background text-start"
          />
        </div>
        <Button disabled={!title.trim() || !content.trim() || create.isPending} onClick={() => create.mutate()}>
          <Megaphone className="size-4" /> أضف الإعلان
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-secondary/50" />)
          : (ads ?? []).map((ad) => (
              <div key={ad.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-4">
                <div className="flex-1">
                  <p className="font-display text-lg">{ad.title}</p>
                  <p className="text-[11px] text-muted-foreground">{AD_TYPE_LABEL[ad.type]}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  مفعّل
                  <Switch checked={ad.is_active} onCheckedChange={() => toggle.mutate(ad)} />
                </div>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del.mutate(ad.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
      </div>
    </section>
  );
}
