import { useEffect } from "react";
import { useSiteSettings } from "@/lib/site-settings";
import { usePrefs } from "@/lib/prefs";
import { DESIGN_KEYS } from "@/lib/backgrounds";

/**
 * يطبّق ألوان التصميم العامة المحفوظة في site_settings كقيم CSS مباشرة على عنصر html،
 * متجاوزاً القيم الافتراضية في styles.css. عند غياب أي إعداد يبقى التصميم الأصلي كما هو.
 */
export function SiteThemeOverrides() {
  const { data } = useSiteSettings();
  const { theme } = usePrefs();

  useEffect(() => {
    const root = document.documentElement;
    const pick = (k: string) => (data?.[k] ?? "").trim();
    const gold = theme === "parchment" ? pick(DESIGN_KEYS.parchmentGold) : pick(DESIGN_KEYS.goldGold);
    const bg = theme === "parchment" ? pick(DESIGN_KEYS.parchmentBg) : pick(DESIGN_KEYS.goldBg);
    const fg = theme === "parchment" ? pick(DESIGN_KEYS.parchmentFg) : pick(DESIGN_KEYS.goldFg);

    const apply = (name: string, value: string) => {
      if (value) root.style.setProperty(name, value);
      else root.style.removeProperty(name);
    };

    apply("--gold", gold);
    apply("--primary", gold);
    apply("--background", bg);
    apply("--foreground", fg);
  }, [data, theme]);

  return null;
}
