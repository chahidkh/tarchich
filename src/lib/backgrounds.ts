import goldDefault from "@/assets/hero-library.jpg";
import gold1 from "@/assets/bg-gold-1.jpg";
import gold2 from "@/assets/bg-gold-2.jpg";
import gold3 from "@/assets/bg-gold-3.jpg";
import gold4 from "@/assets/bg-gold-4.jpg";
import gold5 from "@/assets/bg-gold-5.jpg";
import parchmentDefault from "@/assets/hero-library-parchment.jpg";
import parchment1 from "@/assets/bg-parchment-1.jpg";
import parchment2 from "@/assets/bg-parchment-2.jpg";
import parchment3 from "@/assets/bg-parchment-3.jpg";
import parchment4 from "@/assets/bg-parchment-4.jpg";
import parchment5 from "@/assets/bg-parchment-5.jpg";

export const DEFAULT_GOLD_BG = goldDefault;
export const DEFAULT_PARCHMENT_BG = parchmentDefault;

export type Preset = { id: string; url: string; label: string };

export const GOLD_BACKGROUNDS: Preset[] = [
  { id: "gold-default", url: goldDefault, label: "الافتراضية" },
  { id: "gold-1", url: gold1, label: "قاعة الأقواس" },
  { id: "gold-2", url: gold2, label: "رواق الفوانيس" },
  { id: "gold-3", url: gold3, label: "القبة المشربية" },
  { id: "gold-4", url: gold4, label: "ممر المخطوطات" },
  { id: "gold-5", url: gold5, label: "الثريا الذهبية" },
];

export const PARCHMENT_BACKGROUNDS: Preset[] = [
  { id: "parchment-default", url: parchmentDefault, label: "الافتراضية" },
  { id: "parchment-1", url: parchment1, label: "الحجر الكريمي" },
  { id: "parchment-2", url: parchment2, label: "الرواق المضيء" },
  { id: "parchment-3", url: parchment3, label: "أقواس الرمل" },
  { id: "parchment-4", url: parchment4, label: "الممر العتيق" },
  { id: "parchment-5", url: parchment5, label: "القبة العاجية" },
];

const PRESET_MAP = new Map(
  [...GOLD_BACKGROUNDS, ...PARCHMENT_BACKGROUNDS].map((p) => [p.id, p.url] as const),
);

/** يحوّل القيمة المحفوظة (معرّف صورة جاهزة أو رابط مرفوع) إلى رابط صورة فعلي. */
export function resolveBackground(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return PRESET_MAP.get(value) ?? value;
}

/** مفاتيح site_settings المستخدمة في لوحة التصميم */
export const DESIGN_KEYS = {
  bgGold: "bg_gold_url",
  bgParchment: "bg_parchment_url",
  bgGoldCustom: "bg_gold_custom_urls",
  bgParchmentCustom: "bg_parchment_custom_urls",
  goldGold: "theme_gold_gold",
  goldBg: "theme_gold_bg",
  goldFg: "theme_gold_fg",
  parchmentGold: "theme_parchment_gold",
  parchmentBg: "theme_parchment_bg",
  parchmentFg: "theme_parchment_fg",
  font: "site_default_font",
  fontScale: "site_default_font_scale",
} as const;

/** قيم افتراضية تقريبية بصيغة hex لمنتقيات الألوان فقط (لا تُطبَّق إلا بعد الحفظ) */
export const COLOR_DEFAULTS = {
  goldGold: "#e0b256",
  goldBg: "#211a12",
  goldFg: "#efe7d8",
  parchmentGold: "#5a4520",
  parchmentBg: "#efe4cd",
  parchmentFg: "#3b3227",
} as const;
