import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Paintbrush, RotateCcw, Save, Upload } from "lucide-react";
import { saveSetting, uploadAsset, useSiteSettings } from "@/lib/site-settings";
import {
  COLOR_DEFAULTS,
  DESIGN_KEYS,
  GOLD_BACKGROUNDS,
  PARCHMENT_BACKGROUNDS,
} from "@/lib/backgrounds";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const COLOR_FIELDS: { key: string; label: string; fallback: string }[] = [
  { key: DESIGN_KEYS.goldGold, label: "الذهبي — الوضع الذهبي", fallback: COLOR_DEFAULTS.goldGold },
  { key: DESIGN_KEYS.goldBg, label: "الخلفية — الوضع الذهبي", fallback: COLOR_DEFAULTS.goldBg },
  { key: DESIGN_KEYS.goldFg, label: "النص — الوضع الذهبي", fallback: COLOR_DEFAULTS.goldFg },
  { key: DESIGN_KEYS.parchmentGold, label: "الذهبي — وضع المخطوطة", fallback: COLOR_DEFAULTS.parchmentGold },
  { key: DESIGN_KEYS.parchmentBg, label: "الخلفية — وضع المخطوطة", fallback: COLOR_DEFAULTS.parchmentBg },
  { key: DESIGN_KEYS.parchmentFg, label: "النص — وضع المخطوطة", fallback: COLOR_DEFAULTS.parchmentFg },
];

function parseList(raw?: string): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export function DesignPanel() {
  const { data } = useSiteSettings();
  const qc = useQueryClient();
  const [colors, setColors] = useState<Record<string, string>>({});
  const [font, setFont] = useState("naskh");
  const [scale, setScale] = useState("100");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setColors((c) => ({ ...Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, data[f.key] ?? ""])), ...c }));
    setFont((f) => data[DESIGN_KEYS.font] || f);
    setScale((s) => (data[DESIGN_KEYS.fontScale] ? String(Math.round(Number(data[DESIGN_KEYS.fontScale]) * 100)) : s));
  }, [data]);

  const goldSelected = data?.[DESIGN_KEYS.bgGold] || "gold-default";
  const parchmentSelected = data?.[DESIGN_KEYS.bgParchment] || "parchment-default";
  const goldCustom = parseList(data?.[DESIGN_KEYS.bgGoldCustom]);
  const parchmentCustom = parseList(data?.[DESIGN_KEYS.bgParchmentCustom]);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["site-settings"] });
  }

  async function chooseBg(mode: "gold" | "parchment", id: string) {
    try {
      await saveSetting(mode === "gold" ? DESIGN_KEYS.bgGold : DESIGN_KEYS.bgParchment, id);
      await refresh();
      toast.success("تم تطبيق الخلفية على كامل الموقع");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function uploadBg(mode: "gold" | "parchment", file?: File | null) {
    if (!file) return;
    setBusy(mode);
    try {
      const url = await uploadAsset("site-assets", file, "backgrounds");
      const listKey = mode === "gold" ? DESIGN_KEYS.bgGoldCustom : DESIGN_KEYS.bgParchmentCustom;
      const list = mode === "gold" ? goldCustom : parchmentCustom;
      await saveSetting(listKey, JSON.stringify([...list, url]));
      await saveSetting(mode === "gold" ? DESIGN_KEYS.bgGold : DESIGN_KEYS.bgParchment, url);
      await refresh();
      toast.success("تم رفع الخلفية وتفعيلها");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function uploadAuthorAsset(key: "author_photo_url" | "author_signature_url", file?: File | null) {
    if (!file) return;
    setBusy(key);
    try {
      const url = await uploadAsset("site-assets", file, "diwan");
      await saveSetting(key, url);
      await refresh();
      toast.success(key === "author_photo_url" ? "تم رفع صورة المؤلف" : "تم رفع توقيع المؤلف");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveColors() {
    try {
      for (const f of COLOR_FIELDS) await saveSetting(f.key, colors[f.key] ?? "");
      await refresh();
      toast.success("تم حفظ الألوان وتطبيقها");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function resetColors() {
    try {
      for (const f of COLOR_FIELDS) await saveSetting(f.key, "");
      setColors({});
      await refresh();
      toast.success("تمت استعادة الألوان الافتراضية");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function saveTypography() {
    try {
      const pct = Math.min(150, Math.max(80, Number(scale) || 100));
      await saveSetting(DESIGN_KEYS.font, font);
      await saveSetting(DESIGN_KEYS.fontScale, String(pct / 100));
      await refresh();
      toast.success("تم حفظ إعدادات الخط الافتراضية");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function gallery(mode: "gold" | "parchment") {
    const items = mode === "gold" ? GOLD_BACKGROUNDS : PARCHMENT_BACKGROUNDS;
    const custom = (mode === "gold" ? goldCustom : parchmentCustom).map((url, i) => ({
      id: url,
      url,
      label: `مخصصة ${i + 1}`,
    }));
    const selected = mode === "gold" ? goldSelected : parchmentSelected;
    return (
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
        {[...items, ...custom].map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => void chooseBg(mode, b.id)}
            className={`group relative overflow-hidden rounded-lg border transition ${
              selected === b.id ? "border-gold ring-2 ring-gold/50" : "border-border hover:border-gold/60"
            }`}
          >
            <img src={b.url} alt={b.label} loading="lazy" className="h-24 w-full object-cover" />
            <span className="block bg-card/80 py-1 text-center text-[11px] text-muted-foreground">{b.label}</span>
            {selected === b.id && (
              <span className="absolute top-1 end-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass rounded-xl p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl text-gold">
          <Paintbrush className="size-5" /> لوحة التصميم
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          كل ما تغيّره هنا يُطبَّق فوراً على كامل الموقع ولجميع الزوار.
        </p>
      </section>

      <section className="glass rounded-xl p-6">
        <h3 className="font-display text-xl text-gold">١) خلفيات الوضع الذهبي</h3>
        <div className="mt-4">{gallery("gold")}</div>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gold/40 px-3 py-1.5 text-xs text-gold-soft transition hover:border-gold">
          <Upload className="size-4" />
          {busy === "gold" ? "جارٍ الرفع…" : "رفع خلفية مخصصة"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void uploadBg("gold", e.target.files?.[0] ?? null)}
          />
        </label>
      </section>

      <section className="glass rounded-xl p-6">
        <h3 className="font-display text-xl text-gold">٢) خلفيات وضع المخطوطة</h3>
        <div className="mt-4">{gallery("parchment")}</div>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gold/40 px-3 py-1.5 text-xs text-gold-soft transition hover:border-gold">
          <Upload className="size-4" />
          {busy === "parchment" ? "جارٍ الرفع…" : "رفع خلفية مخصصة"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void uploadBg("parchment", e.target.files?.[0] ?? null)}
          />
        </label>
      </section>

      <section className="glass rounded-xl p-6">
        <h3 className="font-display text-xl text-gold">٣) الألوان</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {COLOR_FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[f.key] || f.fallback}
                  onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                  className="h-9 w-14 cursor-pointer rounded-md border border-border bg-card"
                />
                <Input
                  dir="ltr"
                  value={colors[f.key] ?? ""}
                  placeholder="افتراضي"
                  onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                  className="bg-card"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void saveColors()}>
            <Save className="size-4" /> حفظ الألوان
          </Button>
          <Button size="sm" variant="outline" onClick={() => void resetColors()}>
            <RotateCcw className="size-4" /> استعادة الافتراضي
          </Button>
        </div>
      </section>

      <section className="glass rounded-xl p-6">
        <h3 className="font-display text-xl text-gold">٤) الخط الافتراضي</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">نوع الخط</Label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
            >
              <option value="naskh">نسخي (Tajawal / Aref Ruqaa)</option>
              <option value="kufi">كوفي (Reem Kufi)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">حجم الخط الافتراضي (٪)</Label>
            <Input
              dir="ltr"
              type="number"
              min={80}
              max={150}
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              className="bg-card"
            />
          </div>
        </div>
        <Button size="sm" className="mt-5" onClick={() => void saveTypography()}>
          <Save className="size-4" /> حفظ إعدادات الخط
        </Button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          يبقى بإمكان كل زائر تعديل الخط لنفسه من قائمة الإعدادات.
        </p>
      </section>

      <section className="glass rounded-xl p-6">
        <h3 className="font-display text-xl text-gold">٥) صور الديوان</h3>
        <p className="mt-1 text-xs text-muted-foreground">صورة المؤلف وتوقيعه في صفحة الديوان.</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {([
            { key: "author_photo_url", label: "صورة المؤلف", preview: "صورة فريد خدومة" },
            { key: "author_signature_url", label: "صورة التوقيع", preview: "توقيع فريد خدومة" },
          ] as const).map((item) => (
            <div key={item.key} className="space-y-3">
              <Label className="text-sm text-foreground">{item.label}</Label>
              {data?.[item.key] && (
                <img
                  src={data[item.key]}
                  alt={item.preview}
                  className="h-32 w-full rounded-lg border border-gold/20 object-contain"
                />
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gold/40 px-3 py-1.5 text-xs text-gold-soft transition hover:border-gold">
                <Upload className="size-4" />
                {busy === item.key ? "جارٍ الرفع…" : `رفع ${item.label}`}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy === item.key}
                  onChange={(e) => void uploadAuthorAsset(item.key, e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
