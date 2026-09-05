import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Wallet, Library, Feather, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadAsset } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة حسابي | مكتبة ترشيش" },
      { name: "description", content: "ملفك الشخصي، مكتبتك المقتناة، رصيد الإحالة، ومشاركاتك في المجلس." },
      { property: "og:title", content: "لوحة حسابي | مكتبة ترشيش" },
      { property: "og:description", content: "إدارة ملفك ومقتنياتك ورصيد إحالاتك في مكتبة ترشيش." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,total_amount,status,items,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myPosts } = useQuery({
    queryKey: ["my-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,created_at")
        .eq("author_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      setAvatar(profile.avatar_url ?? "");
      setCover((profile as { cover_url?: string | null }).cover_url ?? "");
    }
  }, [profile]);

  async function save() {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: avatar.trim() || null,
        cover_url: cover.trim() || null,
      } as never)
      .eq("id", user.id);
    if (error) {
      toast.error("تعذّر حفظ التعديلات");
      return;
    }
    toast.success("حُفظت بياناتك بنجاح");
    void qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function upload(kind: "avatar" | "cover", file: File) {
    if (!user) return;
    setBusy(kind);
    try {
      const url = await uploadAsset("site-assets", file, `profiles/${user.id}`);
      if (kind === "avatar") setAvatar(url);
      else setCover(url);
      toast.success("رُفعت الصورة، لا تنسَ الحفظ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر رفع الصورة");
    } finally {
      setBusy(null);
    }
  }

  const referralUrl =
    typeof window !== "undefined" && profile?.referral_code
      ? `${window.location.origin}/?ref=${profile.referral_code}`
      : "";

  const purchased = (orders ?? []).flatMap((o) => (Array.isArray(o.items) ? (o.items as { title: string }[]) : []));

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-14">
        <Skeleton className="h-40 rounded-xl bg-secondary/50" />
        <Skeleton className="h-40 rounded-xl bg-secondary/50" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-14">
      <header className="text-center">
        <h1 className="text-4xl text-gold">لوحة حسابي</h1>
        <div className="gold-rule mx-auto mt-5 w-32" />
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-xl p-5">
          <Wallet className="size-5 text-gold" />
          <p className="mt-3 text-sm text-muted-foreground">رصيد الإحالة</p>
          <p className="font-display text-3xl text-parchment">
            {Number(profile?.wallet_balance ?? 0).toFixed(2)} ر.س
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <Library className="size-5 text-gold" />
          <p className="mt-3 text-sm text-muted-foreground">كتبي المقتناة</p>
          <p className="font-display text-3xl text-parchment">{purchased.length}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <Feather className="size-5 text-gold" />
          <p className="mt-3 text-sm text-muted-foreground">مشاركاتي</p>
          <p className="font-display text-3xl text-parchment">{myPosts?.length ?? 0}</p>
        </div>
      </div>

      <section className="glass space-y-3 rounded-xl p-6">
        <h2 className="text-2xl text-gold">رابط الإحالة (عمولة ١٠٪)</h2>
        <div className="flex gap-2">
          <Input readOnly value={referralUrl} className="bg-background text-xs" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              void navigator.clipboard.writeText(referralUrl);
              toast.success("نُسخ رابط الإحالة");
            }}
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </section>

      <section className="glass space-y-4 overflow-hidden rounded-xl p-0">
        <div className="relative h-40 w-full border-b border-gold/25 bg-secondary/40">
          {cover && <img src={cover} alt="صورة الغلاف" className="size-full object-cover" />}
          <label className="absolute bottom-3 left-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-gold/40 bg-background/80 px-3 py-1.5 text-xs backdrop-blur hover:border-gold">
            <Upload className="size-3.5" /> {busy === "cover" ? "جارٍ الرفع…" : "تغيير صورة الغلاف"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload("cover", f); }} />
          </label>
          <div className="absolute -bottom-8 right-6">
            {avatar ? (
              <img src={avatar} alt="صورتي الشخصية" className="size-20 rounded-full border-2 border-gold/60 object-cover" />
            ) : (
              <div className="grid size-20 place-items-center rounded-full border-2 border-gold/60 bg-card text-2xl text-gold">
                {(fullName || "ض").charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6 pt-12">
        <h2 className="text-2xl text-gold">ملفي الشخصي</h2>
        <div className="space-y-2">
          <Label htmlFor="fn">الاسم الظاهر</Label>
          <Input id="fn" value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="av">الصورة الشخصية</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input id="av" value={avatar} maxLength={500} onChange={(e) => setAvatar(e.target.value)} placeholder="رابط الصورة أو ارفعها" className="bg-background" />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/60">
              <Upload className="size-4" /> {busy === "avatar" ? "جارٍ الرفع…" : "رفع"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload("avatar", f); }} />
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">نبذة عنك</Label>
          <Textarea id="bio" value={bio} maxLength={500} onChange={(e) => setBio(e.target.value)} className="bg-background" />
        </div>
        <Button onClick={() => void save()}>حفظ التعديلات</Button>
        </div>
      </section>

      <section className="glass space-y-3 rounded-xl p-6">
        <h2 className="text-2xl text-gold">مكتبتي</h2>
        {purchased.length === 0 ? (
          <p className="text-sm text-muted-foreground">لم تقتنِ كتاباً بعد.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {purchased.map((b, i) => (
              <li key={i} className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
                {b.title}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
