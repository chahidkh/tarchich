import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";
import { saveSetting, uploadAsset, useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FIELDS: { key: string; label: string; kind: "text" | "long" | "image" }[] = [
  { key: "store_banner_url", label: "صورة بانر صفحة المتجر", kind: "image" },
  { key: "store_description", label: "وصف صفحة المتجر", kind: "long" },
  { key: "majlis_banner_url", label: "صورة بانر المجلس الثقافي", kind: "image" },
  { key: "majlis_description", label: "وصف المجلس الثقافي", kind: "long" },
  { key: "featured_title", label: "عنوان قسم الكتب المميزة في الرئيسية", kind: "text" },
  { key: "featured_description", label: "وصف قسم الكتب المميزة", kind: "long" },
];

export function ContentPanel() {
  const { data } = useSiteSettings();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (data) setValues((v) => ({ ...data, ...v }));
  }, [data]);

  async function save(key: string) {
    try {
      await saveSetting(key, values[key] ?? "");
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("تم حفظ التعديل");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function upload(key: string, file?: File | null) {
    if (!file) return;
    setBusy(key);
    try {
      const url = await uploadAsset("site-assets", file, "banners");
      setValues((v) => ({ ...v, [key]: url }));
      await saveSetting(key, url);
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("تم رفع الصورة وحفظها");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="glass rounded-xl p-6">
      <h2 className="font-display text-2xl text-gold">محرّك التخصيص</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        عدّل صور البانر ونصوص الصفحات الداخلية دون لمس الشيفرة. (تصميم الصفحة الرئيسية الأساسي محفوظ كما هو.)
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            {f.kind === "long" ? (
              <Textarea
                rows={3}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="bg-card"
              />
            ) : (
              <Input
                dir={f.kind === "image" ? "ltr" : "rtl"}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="bg-card"
              />
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void save(f.key)}>
                <Save className="size-4" /> حفظ
              </Button>
              {f.kind === "image" && (
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gold/40 px-3 py-1.5 text-xs text-gold-soft transition hover:border-gold">
                  <Upload className="size-4" />
                  {busy === f.key ? "جارٍ الرفع…" : "رفع صورة"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void upload(f.key, e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
            {f.kind === "image" && values[f.key] && (
              <img src={values[f.key]} alt="" className="h-24 w-full rounded-md object-cover" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
