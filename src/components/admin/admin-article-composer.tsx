import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BotMessageSquare, Save, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchContentSources } from "@/lib/content-sources";
import { slugify } from "@/lib/gazette";
import { composerChat, type ComposerDraft } from "@/lib/article-composer.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function AdminArticleComposer() {
  const qc = useQueryClient();
  const chat = useServerFn(composerChat);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "مرحباً بك. اطلب منّي مثلاً: «لخّص لي آخر ما ورد عن الدولة العباسية» أو «اكتب مقالاً عن تاريخ ترشيش». سأعتمد حصراً على المصادر المفعّلة.",
    },
  ]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<ComposerDraft | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: active } = useQuery({
    queryKey: ["content-sources", "active"],
    queryFn: () => fetchContentSources(true),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useMutation({
    mutationFn: async (history: ChatMessage[]) => chat({ data: { messages: history } }),
    onSuccess: (r) => {
      const note = r.sources.length ? `\n\nالمصادر المعتمدة: ${r.sources.map((s) => s.name).join("، ")}` : "";
      setMessages((m) => [...m, { role: "assistant", content: r.reply + note }]);
      if (r.draft) setDraft(r.draft);
    },
    onError: (e: Error) => {
      setMessages((m) => [...m, { role: "assistant", content: e.message }]);
      toast.error(e.message);
    },
  });

  function submit() {
    const text = input.trim();
    if (!text || send.isPending) return;
    const history = [...messages.filter((m) => m.role === "user" || messages.indexOf(m) > 0), { role: "user" as const, content: text }];
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    send.mutate(history.slice(-12));
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("posts").insert({
        title: draft.title.trim(),
        slug: slugify(draft.title),
        excerpt: draft.excerpt.trim() || null,
        content: draft.content.trim(),
        category: draft.category,
        section: "gazette",
        is_published: false,
        author_id: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("حُفظ المقال كمسودّة في الجريدة");
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["admin-gazette"] });
      void qc.invalidateQueries({ queryKey: ["gazette"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="glass rounded-xl p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl text-gold">
        <BotMessageSquare className="size-5" /> المحرّر الذكي بالمحادثة
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {active?.length
          ? `المصادر المفعّلة: ${active.map((s) => s.name).join("، ")}`
          : "لا توجد مصادر مفعّلة بعد — فعّل مصدراً من تبويب «المصادر» أولاً."}
      </p>

      <div className="mt-5 max-h-[26rem] space-y-3 overflow-y-auto rounded-lg border border-border bg-card/60 p-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "border border-gold/40 bg-gold/10 text-foreground"
                  : "border border-border bg-background text-muted-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {send.isPending && (
          <div className="flex justify-end">
            <div className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
              جارٍ التحرير…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="اطلب مقالاً أو ملخّصاً…"
          className="min-h-12 bg-background"
        />
        <Button onClick={submit} disabled={!input.trim() || send.isPending} size="icon" className="size-11 shrink-0">
          <Send className="size-4" />
        </Button>
      </div>

      {draft && (
        <div className="mt-6 space-y-3 rounded-lg border border-gold/30 bg-card/60 p-4">
          <p className="text-sm text-gold-soft">مسودّة مقترحة — يمكنك تعديلها قبل الحفظ</p>
          <Input
            value={draft.title}
            maxLength={160}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="العنوان"
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">التصنيف: {draft.category}</p>
          <Textarea
            value={draft.excerpt}
            maxLength={300}
            onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
            placeholder="مقتطف قصير"
            className="bg-background"
          />
          <Textarea
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            className="min-h-56 bg-background"
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={!draft.title.trim() || !draft.content.trim() || save.isPending} onClick={() => save.mutate()}>
              <Save className="size-4" /> حفظ كمسودّة في الجريدة
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              تجاهل
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
