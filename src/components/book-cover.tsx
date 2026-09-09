import { useState } from "react";

/** Book cover with an elegant branded fallback when the remote image fails to load. */
export function BookCover({
  src,
  title,
  className = "",
  imgClassName = "size-full object-cover transition duration-500 group-hover:scale-105",
}: {
  src: string | null | undefined;
  title: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className={`relative flex size-full items-center justify-center overflow-hidden ${className}`}>
      {showImage ? (
        <img
          src={src as string}
          alt={title}
          loading="lazy"
          onError={() => setFailed(true)}
          className={imgClassName}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_20%,oklch(0.3_0.05_60),oklch(0.19_0.03_55))] px-5 text-center">
          <div className="gold-rule w-16" />
          <span className="font-display text-xl leading-relaxed text-gold-soft line-clamp-4">{title}</span>
          <div className="gold-rule w-16" />
          <span className="text-[10px] tracking-widest text-muted-foreground">مكتبة ترشيش</span>
        </div>
      )}
    </div>
  );
}
