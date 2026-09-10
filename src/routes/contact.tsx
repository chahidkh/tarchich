import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { checkRateLimit } from "@/lib/rate-limit";
import { SUPPORT_EMAIL, SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | مكتبة ترشيش" },
      { name: "description", content: "راسل مكتبة ترشيش: اقتراحاتكم وملاحظاتكم واستفساراتكم تصلنا مباشرة ونجيب عنها بسرعة." },
      { property: "og:title", content: "تواصل معنا | مكتبة ترشيش" },
      { property: "og:description", content: "بريد الدعم والنموذج المباشر للتواصل مع مكتبة ترشيش." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(100),
  email: z.string().trim().email("بريد إلكتروني غير صحيح").max(255),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, "اكتب رسالة أوضح").max(2000),
});

function Contact() {
  const { t } = useT();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "تحقق من البيانات");
      return;
    }
    const limit = checkRateLimit("contact", 2, 60_000);
    if (!limit.allowed) {
      toast.error(`أرسلت رسائل كثيرة بسرعة، انتظر ${limit.retryInSec} ثانية.`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject ?? null,
      message: parsed.data.message,
      route_to: "chahidkh33@gmail.com",
    });
    setBusy(false);
    if (error) {
      toast.error("تعذّر إرسال الرسالة، حاول مجدداً.");
      return;
    }
    toast.success(t("contact.sent"));
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <main>
      <section className="mx-auto max-w-2xl px-4 py-14">
        <header className="mb-8 text-center">
          <h1 className="text-4xl text-gold">{t("contact.title")}</h1>
          <div className="gold-rule mx-auto mt-5 w-32" />
          <p className="mt-4 text-sm text-muted-foreground">{t("contact.lead")}</p>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm">
            <Mail className="size-4 text-gold" />
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </header>

        <form onSubmit={submit} className="glass grid gap-3 rounded-xl p-5">
          <Input
            placeholder={t("contact.name")}
            value={form.name}
            maxLength={100}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            type="email"
            placeholder={t("contact.email")}
            value={form.email}
            maxLength={255}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder={t("contact.subject")}
            value={form.subject}
            maxLength={160}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Textarea
            placeholder={t("contact.message")}
            rows={6}
            maxLength={2000}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <Button type="submit" disabled={busy}>
            <Send className="size-4" /> {t("contact.send")}
          </Button>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
