import { useQuery } from "@tanstack/react-query";

/** Base currency of every stored price in the database. */
export const BASE = "SAR";

export const CURRENCIES = [
  { code: "SAR", label: "ريال سعودي", symbol: "ر.س" },
  { code: "AED", label: "درهم إماراتي", symbol: "د.إ" },
  { code: "QAR", label: "ريال قطري", symbol: "ر.ق" },
  { code: "KWD", label: "دينار كويتي", symbol: "د.ك" },
  { code: "OMR", label: "ريال عماني", symbol: "ر.ع" },
  { code: "BHD", label: "دينار بحريني", symbol: "د.ب" },
  { code: "EGP", label: "جنيه مصري", symbol: "ج.م" },
  { code: "TND", label: "دينار تونسي", symbol: "د.ت" },
  { code: "DZD", label: "دينار جزائري", symbol: "د.ج" },
  { code: "MAD", label: "درهم مغربي", symbol: "د.م" },
  { code: "JOD", label: "دينار أردني", symbol: "د.أ" },
  { code: "TRY", label: "ليرة تركية", symbol: "₺" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "BRL", label: "Real brasileiro", symbol: "R$" },
  { code: "JPY", label: "日本円", symbol: "¥" },
  { code: "CNY", label: "人民币", symbol: "¥" },
  { code: "RUB", label: "Рубль", symbol: "₽" },
] as const;

/** Offline fallback rates per 1 SAR, used until live rates load. */
const FALLBACK: Record<string, number> = {
  SAR: 1, AED: 0.98, QAR: 0.97, KWD: 0.082, OMR: 0.103, BHD: 0.1,
  EGP: 13.0, TND: 0.83, DZD: 35.6, MAD: 2.65, JOD: 0.19, TRY: 9.1,
  USD: 0.2666, EUR: 0.245, GBP: 0.209, BRL: 1.45, JPY: 40.0, CNY: 1.9, RUB: 24.5,
};

export function useRates() {
  const query = useQuery({
    queryKey: ["fx-rates", BASE],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch(`https://open.er-api.com/v6/latest/${BASE}`);
      if (!res.ok) throw new Error("fx");
      const json = (await res.json()) as { rates?: Record<string, number> };
      if (!json.rates) throw new Error("fx");
      return json.rates;
    },
  });
  return { ...FALLBACK, ...(query.data ?? {}) };
}

export function convert(amount: number, rates: Record<string, number>, code: string) {
  return amount * (rates[code] ?? FALLBACK[code] ?? 1);
}

export function formatMoney(amount: number, code: string) {
  const meta = CURRENCIES.find((c) => c.code === code);
  const decimals = ["KWD", "OMR", "BHD"].includes(code) ? 3 : code === "JPY" ? 0 : 2;
  return `${amount.toFixed(decimals)} ${meta?.symbol ?? code}`;
}
