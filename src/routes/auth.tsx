import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkRateLimit } from "@/lib/rate-limit";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "الدخول والتسجيل | مكتبة ترشيش" },
      { name: "description", content: "انضم إلى مكتبة ترشيش لتتابع المجلس الثقافي وتقتني الكتب وتربح من الإحالة." },
      { property: "og:title", content: "الدخول والتسجيل | مكتبة ترشيش" },
      { property: "og:description", content: "أنشئ حسابك في مكتبة ترشيش بالبريد أو عبر جوجل." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) void navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Slow down repeated credential guessing from the same device.
    const limit = checkRateLimit(mode === "signup" ? "signup" : "signin", mode === "signup" ? 3 : 5, 5 * 60_000);
    if (!limit.allowed) {
      toast.error(`محاولات كثيرة، انتظر ${limit.retryInSec} ثانية قبل المحاولة مجدداً.`);
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: name.trim() },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("أهلاً بك في مكتبة ترشيش");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) {
        toast.error("بيانات الدخول غير صحيحة");
        return;
      }
      toast.success("مرحباً بعودتك");
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("تعذّر الدخول عبر جوجل");
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-14">
      <div className="glass rounded-2xl p-8">
        <h1 className="text-center text-3xl text-gold">{mode === "signin" ? "أهلاً بعودتك" : "انضم إلى المجلس"}</h1>
        <div className="gold-rule mx-auto mt-4 w-24" />

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} required className="bg-background" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "signin" ? "دخول" : "إنشاء الحساب"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={() => void google()}>
          المتابعة عبر جوجل
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "لا تملك حساباً؟" : "لديك حساب بالفعل؟"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-gold underline">
            {mode === "signin" ? "أنشئ حسابك" : "سجّل الدخول"}
          </button>
        </p>
      </div>
    </main>
  );
}
