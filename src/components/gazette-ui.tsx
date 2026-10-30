import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, ExternalLink } from "lucide-react";
import { normalizeCategory, readingMinutes, timeAgo, type GazettePost } from "@/lib/gazette";

/**
 * تدرّجات من عائلة الذهب نفسها لتمييز الأقسام، مشتقّة من --gold بإزاحة
 * طفيفة في الدرجة اللونية فتبقى ضمن هوية الموقع في الوضعين. "عاجل" وحده أحمر.
 */
const CATEGORY_HUE: Record<string, number> = {
  سياسة: -14,
  "اقتصاد وتجارة": 8,
  رياضة: -28,
  تقنية: -40,
  "علوم وصحة": 40,
  "ثقافة وكتب": 30,
  التاريخ: 16,
  منوعات: 52,
};

export function CategoryBadge({ category }: { category: string | null }) {
  const c = normalizeCategory(category);
  if (c === "عاجل") {
    return (
      <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-red-400">
        {c}
      </span>
    );
  }
  const base = `oklch(from var(--gold) l c calc(h + ${CATEGORY_HUE[c] ?? 0}))`;
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] tracking-wider"
      style={{ color: base, backgroundColor: `color-mix(in oklab, ${base} 14%, transparent)` }}
    >
      {c}
    </span>
  );
}

/**
 * صورة الخبر من مصدرها الأصلي: مساحة محجوزة بنسبة ثابتة لمنع القفز،
 * وتحميل كسول، وعند فشل التحميل تختفي الكتلة كلها (onFail) فلا تظهر صورة مكسورة.
 */
export function SourceImage({
  src,
  alt,
  ratio = "aspect-[16/9]",
  eager = false,
  onFail,
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: string;
  eager?: boolean;
  onFail: () => void;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-secondary/40 ${ratio} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={onFail}
        className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.03]"
      />
    </div>
  );
}

export function SourceLine({ post, className = "" }: { post: GazettePost; className?: string }) {
  if (!post.source_name && !post.source_url) return null;
  return (
    <p className={`flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground ${className}`}>
      {post.source_name && <span>الصورة والخبر: {post.source_name}</span>}
      {post.source_url && (
        <a
          href={post.source_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-gold-soft underline-offset-2 hover:text-gold hover:underline"
        >
          المصدر <ExternalLink className="size-3" />
        </a>
      )}
    </p>
  );
}

export function MetaRow({ post }: { post: GazettePost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {post.source_name && <span className="text-gold-soft">{post.source_name}</span>}
      <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3" /> {readingMinutes(post.content)} د قراءة
      </span>
    </div>
  );
}

/** بطاقة خبر: مصوّرة إن توفّرت صورة صالحة، وإلا نصية بالكامل. */
export function NewsCard({ post, size = "sm" }: { post: GazettePost; size?: "lg" | "sm" }) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(post.media_url) && !failed;
  const lg = size === "lg";
  return (
    <article
      className={`glass group relative flex flex-col overflow-hidden rounded-xl border border-gold/15 transition hover:border-gold/45 ${
        lg && hasImage ? "sm:col-span-2" : ""
      }`}
    >
      {hasImage && (
        <SourceImage
          src={post.media_url!}
          alt={post.title}
          ratio={lg ? "aspect-[16/9]" : "aspect-[16/10]"}
          onFail={() => setFailed(true)}
        />
      )}
      <div className={`flex flex-1 flex-col gap-2.5 ${lg ? "p-5 sm:p-6" : "p-4"}`}>
        <div>
          <CategoryBadge category={post.category} />
        </div>
        <h3 className={`leading-relaxed transition group-hover:text-gold ${lg ? "text-xl sm:text-2xl" : "text-base"}`}>
          <Link
            to="/gazette/$slug"
            params={{ slug: post.slug ?? post.id }}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {post.title}
          </Link>
        </h3>
        <p className={`text-sm leading-7 text-muted-foreground ${hasImage ? "line-clamp-2" : "line-clamp-4"}`}>
          {post.excerpt ?? post.content}
        </p>
        <div className="mt-auto pt-1">
          <MetaRow post={post} />
        </div>
      </div>
    </article>
  );
}
