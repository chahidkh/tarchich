import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("أدخل بريداً إلكترونياً صحيحاً");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: value });
    setSaving(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("تعذّر حفظ الاشتراك، حاول لاحقاً");
      return;
    }
    setDone(true);
    setEmail("");
    toast.success("شكراً لك، تم تسجيل بريدك بنجاح");
  }

  return (
    <div className="mx-auto mb-7 max-w-xl border-b border-border pb-7">
      <Mail className="mx-auto size-4 text-gold" />
      <p className="mt-2 font-display text-lg text-gold">اشترك بإشعارات الجديد</p>
      <p className="mt-1 text-xs leading-6 text-muted-foreground">ليصلك جديد الكتب والمقالات فور صدوره.</p>
      {done ? (
        <p className="mt-4 text-xs text-gold">تم تسجيل بريدك بنجاح.</p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mx-auto mt-4 grid max-w-md grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="بريدك الإلكتروني"
            aria-label="البريد الإلكتروني"
            className="min-w-0 bg-background text-right"
          />
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            اشترك
          </Button>
        </form>
      )}
    </div>
  );
}