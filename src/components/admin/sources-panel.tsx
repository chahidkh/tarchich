import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Library, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchContentSources, type ContentSource } from "@/lib/content-sources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export function SourcesPanel() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [license, setLicense] = useState("");

  const { data: sources, isLoading } = useQuery({
    queryKey: ["content-sources"],
    queryFn: () => fetchContentSources(false),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["content-sources"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("content_sources").insert({
        name: name.trim(),
        url: url.trim(),
        license_note: license.trim() || null,
        is_active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setUrl("");
      setLicense("");
      toast.success("أُضيف المصدر (معطّل افتراضياً)");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase.from("content_sources").update(values as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("حُذف المصدر");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="glass rounded-xl p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl text-gold">
        <Library className="size-5" /> المصادر الموثوقة
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        المصادر المفعّلة فقط هي التي يُسمح للمحرّر الذكي بالاعتماد عليها.
      </p>

      <div className="mt-5 space-y-3 rounded-lg border border-border bg-card/60 p-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المصدر" className="bg-background" />
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="رابط الموقع أو خلاصة RSS" className="bg-background" dir="ltr" />
        <Textarea
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          placeholder="ملاحظة الترخيص (مثال: مشاع إبداعي CC BY-SA مع الإسناد)"
          className="bg-background"
        />
        <Button disabled={!name.trim() || !url.trim() || create.isPending} onClick={() => create.mutate()}>
          إضافة مصدر
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-secondary/50" />)
          : (sources ?? []).map((s: ContentSource) => (
              <div key={s.id} className="space-y-3 rounded-lg border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <Input
                      defaultValue={s.name}
                      onBlur={(e) =>
                        e.target.value.trim() !== s.name &&
                        patch.mutate({ id: s.id, values: { name: e.target.value.trim() } })
                      }
                      className="bg-background"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    {s.is_active ? "مفعّل" : "معطّل"}
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={() => patch.mutate({ id: s.id, values: { is_active: !s.is_active } })}
                    />
                  </label>
                  <Button variant="outline" size="icon" onClick={() => del.mutate(s.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Input
                  dir="ltr"
                  defaultValue={s.url}
                  onBlur={(e) =>
                    e.target.value.trim() !== s.url &&
                    patch.mutate({ id: s.id, values: { url: e.target.value.trim() } })
                  }
                  className="bg-background"
                />
                <Textarea
                  defaultValue={s.license_note ?? ""}
                  placeholder="ملاحظة الترخيص"
                  onBlur={(e) =>
                    e.target.value.trim() !== (s.license_note ?? "") &&
                    patch.mutate({ id: s.id, values: { license_note: e.target.value.trim() || null } })
                  }
                  className="bg-background"
                />
              </div>
            ))}
      </div>
    </section>
  );
}
