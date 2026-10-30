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
  source_url?: string | null;
  is_pinned?: boolean;
};

export const GAZETTE_FIELDS =
  "id,title,slug,excerpt,content,media_url,category,views,is_featured,is_published,created_at,source_name,source_url,is_pinned";

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

/** أقسام الجريدة. */
export const GAZETTE_CATEGORIES = [
  "عاجل",
  "سياسة",
  "اقتصاد وتجارة",
  "رياضة",
  "تقنية",
  "علوم وصحة",
  "ثقافة وكتب",
  "التاريخ",
  "منوعات",
] as const;
export type GazetteCategory = (typeof GAZETTE_CATEGORIES)[number];

export const DEFAULT_CATEGORY: GazetteCategory = "ثقافة وكتب";

const LEGACY_MAP: Record<string, GazetteCategory> = {
  "الثقافة": "ثقافة وكتب",
  "ثقافة": "ثقافة وكتب",
  "أدب": "ثقافة وكتب",
  "كتب": "ثقافة وكتب",
  "أعلام": "ثقافة وكتب",
  "اعلام": "ثقافة وكتب",
  "التراث": "التاريخ",
  "تراث": "التاريخ",
  "تاريخ": "التاريخ",
  "أخبار": "عاجل",
  "اخبار": "عاجل",
  "سياسية": "سياسة",
  "اقتصاد": "اقتصاد وتجارة",
  "تجارة": "اقتصاد وتجارة",
  "رياضية": "رياضة",
  "تكنولوجيا": "تقنية",
  "علوم": "علوم وصحة",
  "صحة": "علوم وصحة",
};

/** Maps any stored category onto a supported Gazette section. */
export function normalizeCategory(value?: string | null): GazetteCategory {
  const v = (value ?? "").trim();
  if ((GAZETTE_CATEGORIES as readonly string[]).includes(v)) return v as GazetteCategory;
  return LEGACY_MAP[v] ?? DEFAULT_CATEGORY;
}

export function isGazetteCategory(v: unknown): v is GazetteCategory {
  return typeof v === "string" && (GAZETTE_CATEGORIES as readonly string[]).includes(v);
}

/** وقت نسبي عربي قصير. */
export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `منذ ${Math.max(1, Math.round(diff / 60))} دقيقة`;
  if (diff < 86400) return `منذ ${Math.round(diff / 3600)} ساعة`;
  if (diff < 86400 * 7) return `منذ ${Math.round(diff / 86400)} يوم`;
  return new Date(iso).toLocaleDateString("ar");
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

export const GAZETTE_PAGE_SIZE = 12;

/** صفحة من أخبار الجريدة مع ترشيح القسم والشهر والبحث، بدل جلب كل المقالات. */
export async function fetchGazettePage(opts: {
  category?: string | undefined;
  month?: string | undefined;
  term?: string | undefined;
  offset: number;
  excludeId?: string | undefined;
}) {
  let q = supabase
    .from("posts")
    .select(GAZETTE_FIELDS, { count: "exact" })
    .eq("section", "gazette")
    .eq("is_published", true);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.excludeId) q = q.neq("id", opts.excludeId);
  if (opts.month) {
    const [y, m] = opts.month.split("-").map(Number);
    const from = new Date(Date.UTC(y!, m! - 1, 1)).toISOString();
    const to = new Date(Date.UTC(y!, m!, 1)).toISOString();
    q = q.gte("created_at", from).lt("created_at", to);
  }
  const t = (opts.term ?? "").trim().replace(/[%,()]/g, " ");
  if (t) q = q.or(`title.ilike.%${t}%,excerpt.ilike.%${t}%`);
  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range(opts.offset, opts.offset + GAZETTE_PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: data as GazettePost[], count: count ?? 0 };
}

/** الخبر الرئيسي: الأحدث من المثبّت أو المميز، وإلا الأحدث. */
export async function fetchGazetteLead(category?: string) {
  let q = supabase
    .from("posts")
    .select(GAZETTE_FIELDS)
    .eq("section", "gazette")
    .eq("is_published", true);
  if (category) q = q.eq("category", category);
  const { data, error } = await q
    .order("is_pinned", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as GazettePost | undefined) ?? null;
}

export async function fetchGazetteMostRead() {
  const { data, error } = await supabase
    .from("posts")
    .select("id,title,slug,views,category")
    .eq("section", "gazette")
    .eq("is_published", true)
    .gt("views", 0)
    .order("views", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data as Pick<GazettePost, "id" | "title" | "slug" | "views" | "category">[];
}

export async function fetchGazetteBreaking() {
  const { data, error } = await supabase
    .from("posts")
    .select("id,title,slug")
    .eq("section", "gazette")
    .eq("is_published", true)
    .eq("category", "عاجل")
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data as Pick<GazettePost, "id" | "title" | "slug">[];
}

export async function fetchGazetteMonths() {
  const { data, error } = await supabase
    .from("posts")
    .select("created_at")
    .eq("section", "gazette")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((r) => archiveKey(r.created_at))));
}
