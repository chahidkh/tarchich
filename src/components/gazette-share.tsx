import { useState } from "react";
import { Check, Link2, MessageCircle, Twitter } from "lucide-react";
import { toast } from "sonner";

/** أزرار مشاركة بسيطة: نسخ الرابط، واتساب، تويتر. */
export function GazetteShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.href;
  const text = `${title} — ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("نُسخ رابط المقال");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذّر نسخ الرابط");
    }
  }

  const cls =
    "inline-flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1.5 text-xs text-gold-soft transition hover:border-gold/70 hover:text-gold";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void copy()} className={cls} aria-label="نسخ الرابط">
        {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />} نسخ الرابط
      </button>
      <a
        className={cls}
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        <MessageCircle className="size-3.5" /> واتساب
      </a>
      <a
        className={cls}
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        <Twitter className="size-3.5" /> تويتر
      </a>
    </div>
  );
}

/** شارة صغيرة تُظهر المصدر الأصلي للمقال. */
export function SourceBadge({ source }: { source?: string | null }) {
  if (!source) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] tracking-wide text-gold-soft">
      المصدر: {source}
    </span>
  );
}
