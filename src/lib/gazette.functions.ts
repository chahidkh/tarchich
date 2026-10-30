import { createServerFn } from "@tanstack/react-start";

/** Increments the read counter for a published Gazette article. */
export const bumpGazetteViews = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.id)) throw new Error("Invalid id");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("posts")
      .select("views")
      .eq("id", data.id)
      .eq("section", "gazette")
      .maybeSingle();
    if (!row) return { ok: false };
    await supabaseAdmin
      .from("posts")
      .update({ views: (row.views ?? 0) + 1 })
      .eq("id", data.id);
    return { ok: true };
  });

export type GazetteMeta = { title: string; excerpt: string | null; media_url: string | null; created_at: string } | null;

/** بيانات وسوم SEO/Open Graph لمقال منشور (قراءة عامة عبر المفتاح العام). */
export const getGazetteMeta = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 200) }))
  .handler(async ({ data }): Promise<GazetteMeta> => {
    const base = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!base || !key) return null;
    const isUuid = /^[0-9a-f-]{36}$/i.test(data.slug);
    const params = new URLSearchParams({
      select: "title,excerpt,media_url,created_at",
      section: "eq.gazette",
      is_published: "eq.true",
      [isUuid ? "id" : "slug"]: `eq.${data.slug}`,
      limit: "1",
    });
    try {
      const res = await fetch(`${base}/rest/v1/posts?${params}`, { headers: { apikey: key } });
      if (!res.ok) return null;
      const rows = (await res.json()) as NonNullable<GazetteMeta>[];
      return rows[0] ?? null;
    } catch {
      return null;
    }
  });
