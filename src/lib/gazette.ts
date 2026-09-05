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
};

export const GAZETTE_FIELDS =
  "id,title,slug,excerpt,content,media_url,category,views,is_featured,is_published,created_at";

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
