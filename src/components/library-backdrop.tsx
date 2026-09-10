import { useSiteSettings } from "@/lib/site-settings";
import {
  DEFAULT_GOLD_BG,
  DEFAULT_PARCHMENT_BG,
  DESIGN_KEYS,
  resolveBackground,
} from "@/lib/backgrounds";


type Props = {
  className?: string;
  alt?: string;
  eager?: boolean;
};

/**
 * خلفية المكتبة المشتركة — تتبدّل تلقائياً حسب data-theme على عنصر html.
 * gold => الصورة الداكنة، parchment => الصورة الفاتحة.
 * يمكن لصاحب الموقع تغيير الصورتين من لوحة التصميم (site_settings).
 */
export function LibraryBackdrop({ className = "", alt = "", eager = false }: Props) {
  const { data } = useSiteSettings();
  const goldImage = resolveBackground(data?.[DESIGN_KEYS.bgGold], DEFAULT_GOLD_BG);
  const parchmentImage = resolveBackground(data?.[DESIGN_KEYS.bgParchment], DEFAULT_PARCHMENT_BG);


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
