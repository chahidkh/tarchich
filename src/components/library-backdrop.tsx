import { useSiteSettings } from "@/lib/site-settings";
import type { CSSProperties } from "react";
import {
  DEFAULT_GOLD_BG,
  DEFAULT_PARCHMENT_BG,
  DESIGN_KEYS,
  resolveBackground,
} from "@/lib/backgrounds";
import goldMobile from "@/assets/hero-gold-mobile.webp.asset.json";
import parchmentMobile from "@/assets/hero-parchment-mobile.webp.asset.json";


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
type BackdropStyle = CSSProperties & {
  "--backdrop-image": string;
  "--backdrop-mobile-image": string;
};

function backgroundUrl(value: string) {
  return `url(${JSON.stringify(value)})`;
}

export function LibraryBackdrop({ className = "" }: Props) {
  const { data } = useSiteSettings();
  const goldImage = resolveBackground(data?.[DESIGN_KEYS.bgGold], DEFAULT_GOLD_BG);
  const parchmentImage = resolveBackground(data?.[DESIGN_KEYS.bgParchment], DEFAULT_PARCHMENT_BG);
  const goldMobileImage = goldImage === DEFAULT_GOLD_BG ? goldMobile.url : goldImage;
  const parchmentMobileImage = parchmentImage === DEFAULT_PARCHMENT_BG ? parchmentMobile.url : parchmentImage;

  return (
    <>
      <div
        className={`library-backdrop-layer theme-bg-gold ${className}`}
        style={{
          "--backdrop-image": backgroundUrl(goldImage),
          "--backdrop-mobile-image": backgroundUrl(goldMobileImage),
        } as BackdropStyle}
      />
      <div
        className={`library-backdrop-layer theme-bg-parchment ${className}`}
        style={{
          "--backdrop-image": backgroundUrl(parchmentImage),
          "--backdrop-mobile-image": backgroundUrl(parchmentMobileImage),
        } as BackdropStyle}
      />
    </>
  );
}
