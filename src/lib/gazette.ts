import { supabase } from "@/integrations/supabase/client";

export type GazettePost = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string;
  media_url: string | null;
  category: string | null;
  views: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  source_name?: string | null;
};

export const GAZETTE_FIELDS =
  "id,title,slug,excerpt,content,media_url,category,views,is_featured,is_published,created_at,source_name";

/** Formats a post date as an Arabic "الشهر السنة" archive key. */
export function archiveKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function archiveLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("ar", { month: "long", year: "numeric" });
}

/** The publisher attributed on every Gazette article. */
export const PUBLISHER = "مكتبة ترشيش";

/** The only categories the Gazette uses. */
export const GAZETTE_CATEGORIES = ["عاجل", "سياسة", "التاريخ", "الثقافة"] as const;
export type GazetteCategory = (typeof GAZETTE_CATEGORIES)[number];

const LEGACY_MAP: Record<string, GazetteCategory> = {
  "التراث": "التاريخ",
  "تراث": "التاريخ",
  "تاريخ": "التاريخ",
  "أعلام": "الثقافة",
  "اعلام": "الثقافة",
  "ثقافة": "الثقافة",
  "أدب": "الثقافة",
  "أخبار": "عاجل",
  "اخبار": "عاجل",
  "سياسية": "سياسة",
};

/** Maps any stored category onto the four supported Gazette categories. */
export function normalizeCategory(value?: string | null): GazetteCategory {
  const v = (value ?? "").trim();
  if ((GAZETTE_CATEGORIES as readonly string[]).includes(v)) return v as GazetteCategory;
  return LEGACY_MAP[v] ?? "الثقافة";
}

export function readingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function slugify(title: string) {
  const base = title
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "maqal"}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function fetchGazettePosts(publishedOnly = true) {
  let q = supabase.from("posts").select(GAZETTE_FIELDS).eq("section", "gazette");
  if (publishedOnly) q = q.eq("is_published", true);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data as GazettePost[];
}
