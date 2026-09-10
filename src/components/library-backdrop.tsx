import goldImage from "@/assets/hero-library.jpg";
import parchmentImage from "@/assets/hero-library-parchment.jpg";

type Props = {
  className?: string;
  alt?: string;
  eager?: boolean;
};

/**
 * خلفية المكتبة المشتركة — تتبدّل تلقائياً حسب data-theme على عنصر html.
 * gold => الصورة الداكنة الأصلية، parchment => الصورة الفاتحة.
 */
export function LibraryBackdrop({ className = "", alt = "", eager = false }: Props) {
  return (
    <>
      <img
        src={goldImage}
        alt={alt}
        width={1920}
        height={1088}
        loading={eager ? "eager" : "lazy"}
        className={`theme-bg-gold ${className}`}
      />
      <img
        src={parchmentImage}
        alt=""
        aria-hidden
        width={1920}
        height={1088}
        loading="lazy"
        className={`theme-bg-parchment ${className}`}
      />
    </>
  );
}
