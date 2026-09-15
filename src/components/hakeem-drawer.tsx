import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askHakeem } from "@/lib/hakeem.functions";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "أنا في حالة تأمل، بم تنصحني؟",
  "لخّص لي مقدمة ابن خلدون",
  "ما الفرق بين الأدب الأندلسي والعباسي؟",
];

export function HakeemDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "مرحباً بك في مكتبة ترشيش. أنا حكيمها، سلني عن كتابٍ أو فكرة أو حالٍ تبحث لها عن قراءة.",
    },
  ]);
  const ask = useServerFn(askHakeem);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...messages, { role: "user" as const, content: clean }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({ data: { messages: next.slice(-12) } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "تعثّر الاتصال، أعد المحاولة رجاءً." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="icon"
        title="استشر حكيم المكتبة"
        aria-label="استشر حكيم المكتبة"
        className="glow-pulse fixed bottom-20 left-4 z-40 size-12 rounded-full border-gold/40 bg-card/90 text-gold shadow-lg backdrop-blur hover:bg-card sm:bottom-6 sm:left-6 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-3"
      >
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">استشر حكيم المكتبة</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-full flex-col bg-card sm:max-w-md">
          <SheetHeader className="text-right">
            <SheetTitle className="font-display text-2xl text-gold">حكيم ترشيش</SheetTitle>
            <SheetDescription>مستشارك في الكتب والمعرفة، بعربيةٍ أصيلة.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ms-auto max-w-[85%] rounded-2xl rounded-se-sm bg-primary/15 px-4 py-3 text-sm leading-7"
                    : "me-auto max-w-[92%] rounded-2xl rounded-ss-sm border border-border bg-secondary/50 px-4 py-3 text-sm leading-8"
                }
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> يخطّ الحكيم جوابه…
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-border p-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-gold/60 hover:text-gold"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <Input
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك…"
                className="bg-background"
              />
              <Button type="submit" disabled={busy} size="icon">
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
