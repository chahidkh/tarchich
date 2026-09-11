import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-guard";
import { enforceRateLimit } from "@/lib/server-rate-limit";

export type ErrorLogRow = {
  id: string;
  message: string;
  source: string;
  detail: string | null;
  path: string | null;
  created_at: string;
};

const logSchema = z.object({
  message: z.string().trim().min(1).max(500),
  source: z.string().trim().min(1).max(80).default("client"),
  detail: z.string().trim().max(4000).optional(),
  path: z.string().trim().max(300).optional(),
});

/** Public endpoint: records an application error. Rate limited per IP. */
export const logError = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => logSchema.parse(data))
  .handler(async ({ data }) => {
    let request: Request | undefined;
    try {
      request = getRequest();
    } catch {
      request = undefined;
    }
    enforceRateLimit("error-log", request, 20, 60_000);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("error_logs").insert({
      message: data.message,
      source: data.source,
      detail: data.detail ?? null,
      path: data.path ?? null,
    });

    // Opportunistic housekeeping: drop anything older than 30 days.
    if (Math.random() < 0.05) await supabaseAdmin.rpc("purge_old_error_logs");

    return { ok: true };
  });


export const adminListErrors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ErrorLogRow[]> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("error_logs")
      .select("id,message,source,detail,path,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as ErrorLogRow[];
  });

export const adminDeleteError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("error_logs").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminPurgeErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { all?: boolean }) => z.object({ all: z.boolean().optional() }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.all) {
      const { error } = await supabaseAdmin.from("error_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    } else {
      await supabaseAdmin.rpc("purge_old_error_logs");
    }
    return { ok: true };
  });
