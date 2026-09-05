import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SettingsMap = Record<string, string>;

export async function fetchSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  const map: SettingsMap = {};
  for (const row of data ?? []) {
    const v = row.value as unknown;
    map[row.key] = typeof v === "string" ? v : ((v as { text?: string })?.text ?? "");
  }
  return map;
}

export function useSiteSettings() {
  return useQuery({ queryKey: ["site-settings"], queryFn: fetchSettings, staleTime: 60_000 });
}

export async function saveSetting(key: string, value: string) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: { text: value } as never }, { onConflict: "key" });
  if (error) throw error;
}

/** Uploads a file to a private bucket and returns a stable public URL served by the app. */
export async function uploadAsset(bucket: "book-assets" | "site-assets", file: File, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    ...(file.type ? { contentType: file.type } : {}),
  });
  if (error) throw error;
  return `/api/public/asset/${bucket}/${path}`;
}
