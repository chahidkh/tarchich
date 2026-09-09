import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Upload, Plus, Star, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

type BookRow = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  price: number;
  cover_image_url: string | null;
  sample_pdf_url: string | null;
  full_pdf_url: string | null;
  external_url: string | null;
  copyright_notice: string | null;
  category: string | null;
  badge: string | null;
  stock: number;
  is_visible: boolean;
  is_featured: boolean;
};

const EMPTY = {
  title: "",
  author: "",
  description: "",
  price: "0",
  category: "",
  badge: "",
  stock: "0",
  cover_image_url: "",
  external_url: "",
  copyright_notice: "",
  sample_pdf_url: "",
  full_pdf_url: "",
};

export function BooksPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState<string | null>(null);

  const { data: books, isLoading } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as BookRow[];
    },
  });

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleUpload(bucket: "book-assets", field: keyof typeof EMPTY, file?: File | null) {
    if (!file) return;
    setBusy(field);
    try {
      const url = await uploadAsset(bucket, file, field === "cover_image_url" ? "covers" : "pdfs");
      set(field, url);
      toast.success("تم رفع الملف بنجاح");
    } catch (e) {
      toast.error("تعذّر رفع الملف: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.author.trim()) throw new Error("العنوان واسم المؤلف مطلوبان");
      const { error } = await supabase.from("books").insert({
        title: form.title.trim(),
        author: form.author.trim(),
        description: form.description || null,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        category: form.category || null,
        badge: form.badge || null,
        cover_image_url: form.cover_image_url || null,
        external_url: form.external_url || null,
        copyright_notice: form.copyright_notice || null,
        sample_pdf_url: form.sample_pdf_url || null,
        full_pdf_url: form.full_pdf_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة الكتاب إلى المتجر");
      setForm({ ...EMPTY });
      void qc.invalidateQueries({ queryKey: ["admin-books"] });
      void qc.invalidateQueries({ queryKey: ["books"] });
      void qc.invalidateQueries({ queryKey: ["featured-books"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BookRow> }) => {
      const { error } = await supabase.from("books").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث الكتاب");
      void qc.invalidateQueries({ queryKey: ["admin-books"] });
      void qc.invalidateQueries({ queryKey: ["books"] });
      void qc.invalidateQueries({ queryKey: ["featured-books"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الكتاب");
      void qc.invalidateQueries({ queryKey: ["admin-books"] });
      void qc.invalidateQueries({ queryKey: ["books"] });
      void qc.invalidateQueries({ queryKey: ["featured-books"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <section className="glass rounded-xl p-6">
        <h2 className="font-display text-2xl text-gold">إضافة كتاب جديد</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          أضف كتاباً من متجر خارجي (أمازون، جملون…) برابط الإحالة، أو ارفع ملف PDF من جهازك مباشرة.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="عنوان الكتاب">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="bg-card" />
          </Field>
          <Field label="المؤلف">
            <Input value={form.author} onChange={(e) => set("author", e.target.value)} className="bg-card" />
          </Field>
          <Field label="السعر (ر.س)">
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="bg-card"
            />
          </Field>
          <Field label="المخزون">
            <Input
              type="number"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              className="bg-card"
            />
          </Field>
          <Field label="التصنيف">
            <Input value={form.category} onChange={(e) => set("category", e.target.value)} className="bg-card" />
          </Field>
          <Field label="شارة (الأكثر مبيعاً، حصري…)">
            <Input value={form.badge} onChange={(e) => set("badge", e.target.value)} className="bg-card" />
          </Field>
          <Field label="رابط الشراء الخارجي / الإحالة" className="md:col-span-2">
            <Input
              dir="ltr"
              placeholder="https://www.amazon.com/dp/..."
              value={form.external_url}
              onChange={(e) => set("external_url", e.target.value)}
              className="bg-card"
            />
          </Field>
          <Field label="الوصف" className="md:col-span-2">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="bg-card"
            />
          </Field>
          <Field label="حقوق النشر / إشعار DMCA / الناشر الأصلي" className="md:col-span-2">
            <Textarea
              rows={2}
              value={form.copyright_notice}
              onChange={(e) => set("copyright_notice", e.target.value)}
              className="bg-card"
            />
          </Field>

          <UploadField
            label="صورة الغلاف"
            accept="image/*"
            value={form.cover_image_url}
            busy={busy === "cover_image_url"}
            onFile={(f) => void handleUpload("book-assets", "cover_image_url", f)}
            onText={(v) => set("cover_image_url", v)}
          />
          <UploadField
            label="نموذج معاينة PDF"
            accept="application/pdf"
            value={form.sample_pdf_url}
            busy={busy === "sample_pdf_url"}
            onFile={(f) => void handleUpload("book-assets", "sample_pdf_url", f)}
            onText={(v) => set("sample_pdf_url", v)}
          />
          <UploadField
            label="ملف الكتاب الكامل PDF"
            accept="application/pdf"
            value={form.full_pdf_url}
            busy={busy === "full_pdf_url"}
            onFile={(f) => void handleUpload("book-assets", "full_pdf_url", f)}
            onText={(v) => set("full_pdf_url", v)}
          />
        </div>

        <Button className="mt-6" disabled={create.isPending} onClick={() => create.mutate()}>
          <Plus className="size-4" /> {create.isPending ? "جارٍ الحفظ…" : "إضافة الكتاب"}
        </Button>
      </section>

      <CsvImport
        onDone={() => {
          void qc.invalidateQueries({ queryKey: ["admin-books"] });
          void qc.invalidateQueries({ queryKey: ["books"] });
        }}
      />

      <section className="glass rounded-xl p-6">
        <h2 className="font-display text-2xl text-gold">إدارة الكتب</h2>
        <div className="mt-5 space-y-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-secondary/50" />)
            : (books ?? []).map((b) => (
                <div key={b.id} className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-40 flex-1">
                      <p className="font-display text-lg">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.author}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">السعر</Label>
                      <Input
                        defaultValue={String(b.price)}
                        type="number"
                        step="0.01"
                        className="h-9 w-24 bg-card"
                        onBlur={(e) => {
                          const price = Number(e.target.value);
                          if (price !== Number(b.price)) update.mutate({ id: b.id, patch: { price } });
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant={b.is_visible ? "outline" : "secondary"}
                      onClick={() => update.mutate({ id: b.id, patch: { is_visible: !b.is_visible } })}
                    >
                      {b.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      {b.is_visible ? "ظاهر" : "مخفي"}
                    </Button>
                    <Button
                      size="sm"
                      variant={b.is_featured ? "default" : "outline"}
                      onClick={() => update.mutate({ id: b.id, patch: { is_featured: !b.is_featured } })}
                    >
                      <Star className="size-4" /> مميّز
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`حذف «${b.title}» نهائياً؟`)) remove.mutate(b.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="رابط التحميل / الشراء الخارجي">
                      <Input
                        dir="ltr"
                        defaultValue={b.external_url ?? ""}
                        className="h-9 bg-card"
                        onBlur={(e) =>
                          e.target.value !== (b.external_url ?? "") &&
                          update.mutate({ id: b.id, patch: { external_url: e.target.value || null } })
                        }
                      />
                    </Field>
                    <Field label="ملف PDF الكامل">
                      <Input
                        dir="ltr"
                        defaultValue={b.full_pdf_url ?? ""}
                        className="h-9 bg-card"
                        onBlur={(e) =>
                          e.target.value !== (b.full_pdf_url ?? "") &&
                          update.mutate({ id: b.id, patch: { full_pdf_url: e.target.value || null } })
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"space-y-1.5 " + className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function UploadField({
  label,
  accept,
  value,
  busy,
  onFile,
  onText,
}: {
  label: string;
  accept: string;
  value: string;
  busy: boolean;
  onFile: (f: File | null) => void;
  onText: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        dir="ltr"
        placeholder="أو الصق رابطاً مباشراً"
        value={value}
        onChange={(e) => onText(e.target.value)}
        className="bg-card"
      />
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gold/40 px-3 py-2 text-xs text-gold-soft transition hover:border-gold">
        <Upload className="size-4" />
        {busy ? "جارٍ الرفع…" : "رفع من جهازي"}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
