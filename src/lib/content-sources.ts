import { supabase } from "@/integrations/supabase/client";

export type ContentSource = {
  id: string;
  name: string;
  url: string;
  license_note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const SOURCE_FIELDS = "id,name,url,license_note,is_active,created_at,updated_at";

export async function fetchContentSources(activeOnly = false) {
  let q = supabase.from("content_sources").select(SOURCE_FIELDS);
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q.order("created_at", { ascending: true });
  if (error) throw error;
  return data as ContentSource[];
}

/** Extracts the bare hostname of a source URL, used for the AI allowlist. */
export function sourceHost(url: string) {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url.trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? url;
  }
}
