import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Trash2, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  route_to: string;
  is_read: boolean;
  created_at: string;
};

export function MessagesPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id,name,email,subject,message,route_to,is_read,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Message[];
    },
  });

  async function markRead(id: string) {
    const { error } = await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    if (error) { toast.error("تعذّر التحديث"); return; }
    void qc.invalidateQueries({ queryKey: ["contact-messages"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    toast.success("حُذفت الرسالة");
    void qc.invalidateQueries({ queryKey: ["contact-messages"] });
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl bg-secondary/50" />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        بريد الدعم المعلن: tarchich@gmail.com — وتُوجَّه كل الرسائل إلى chahidkh33@gmail.com
      </p>
      {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">لا رسائل بعد.</p>}
      {(data ?? []).map((m) => (
        <article key={m.id} className="glass rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Mail className="size-4 text-gold" />
            <span className="font-medium">{m.name}</span>
            <a href={`mailto:${m.email}`} className="text-xs text-gold hover:underline">
              {m.email}
            </a>
            {!m.is_read && <span className="rounded-full bg-primary/20 px-2 text-[11px] text-gold">جديدة</span>}
            <span className="ms-auto text-xs text-muted-foreground">
              {new Date(m.created_at).toLocaleString("ar")}
            </span>
          </div>
          {m.subject && <p className="mt-2 text-sm text-gold-soft">{m.subject}</p>}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{m.message}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void markRead(m.id)} disabled={m.is_read}>
              <CheckCheck className="size-4" /> تمّت القراءة
            </Button>
            <Button size="sm" variant="outline" onClick={() => void remove(m.id)}>
              <Trash2 className="size-4" /> حذف
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={`mailto:${m.route_to}?subject=${encodeURIComponent(m.subject ?? "رسالة من موقع مكتبة ترشيش")}&body=${encodeURIComponent(`${m.message}\n\n— ${m.name} <${m.email}>`)}`}>
                تحويل إلى {m.route_to}
              </a>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
