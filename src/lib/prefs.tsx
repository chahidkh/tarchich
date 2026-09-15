import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nProvider, LANGUAGES, type LangCode } from "@/lib/i18n";


export type ThemeMode = "gold" | "parchment";
export type FontFamilyMode = "naskh" | "kufi";

export type Prefs = {
  lang: LangCode;
  theme: ThemeMode;
  fontScale: number;
  fontFamily: FontFamilyMode;
  zen: boolean;
  lowData: boolean;
  currency: string;
};

const DEFAULTS: Prefs = {
  lang: "ar",
  theme: "gold",
  fontScale: 1,
  fontFamily: "naskh",
  zen: false,
  lowData: false,
  currency: "SAR",
};

type Ctx = Prefs & {
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  dir: "rtl" | "ltr";
  reset: () => void;
  hasStored: (k: keyof Prefs) => boolean;
};

const PrefsCtx = createContext<Ctx | null>(null);
const KEY = "tarshish-prefs";

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [stored, setStored] = useState<Partial<Prefs>>({});


  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        setStored(parsed);
        const hour = new Date().getHours();
        const automaticTheme: ThemeMode = hour >= 19 || hour < 6 ? "gold" : "parchment";
        setPrefs({ ...DEFAULTS, theme: parsed.theme ?? automaticTheme, ...parsed });
      } else {
        const hour = new Date().getHours();
        setPrefs((current) => ({ ...current, theme: hour >= 19 || hour < 6 ? "gold" : "parchment" }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  /** true إذا كان المستخدم قد اختار هذا التفضيل بنفسه (يتجاوز إعداد الموقع العام). */
  const hasStored = (k: keyof Prefs) => stored[k] !== undefined;



  const dir = (LANGUAGES.find((l) => l.code === prefs.lang)?.dir ?? "rtl") as "rtl" | "ltr";

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(stored));
    } catch {
      /* ignore */
    }
  }, [stored]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", prefs.lang);
    root.setAttribute("dir", dir);
    root.dataset["theme"] = prefs.theme;
    root.dataset["font"] = prefs.fontFamily;
    root.dataset["lowdata"] = String(prefs.lowData);
    root.classList.toggle("zen", prefs.zen);
    root.style.setProperty("--font-scale", String(prefs.fontScale));
  }, [prefs, dir]);

  const value = useMemo<Ctx>(
    () => ({
      ...prefs,
      dir,
      set: (key, val) => {
        setPrefs((p) => ({ ...p, [key]: val }));
        setStored((s) => ({ ...s, [key]: val }));
      },
      reset: () => {
        setPrefs(DEFAULTS);
        setStored({});
      },
      hasStored,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefs, dir, stored],
  );

  return (
    <PrefsCtx.Provider value={value}>
      <I18nProvider lang={prefs.lang}>{children}</I18nProvider>
    </PrefsCtx.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsCtx);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
