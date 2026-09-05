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
