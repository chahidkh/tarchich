import { Feather } from "lucide-react";

/**
 * غلاف افتراضي أنيق لمقالات الجريدة التي لا تملك صورة،
 * مبني على ألوان الهوية (gold/parchment) عبر متغيّرات التصميم فقط.
 */
export function GazetteCover({
  title,
  className = "h-40 w-full",
}: {
  title: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`relative grid place-items-center overflow-hidden border-b border-gold/25 ${className}`}
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, color-mix(in oklab, var(--gold) 22%, transparent), transparent 70%), var(--card)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, color-mix(in oklab, var(--gold) 14%, transparent) 0 1px, transparent 1px 12px)",
        }}
      />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <Feather className="size-6 text-gold/80" />
        <span className="gold-rule w-16" />
        <span className="line-clamp-2 font-display text-sm text-gold-soft">{title}</span>
      </div>
    </div>
  );
}
