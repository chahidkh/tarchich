/**
 * Server-only helpers that turn a paid Stripe Checkout Session into an order row.
 * Safe to call several times for the same session: the insert is idempotent.
 */

export type PaidSession = {
  id: string;
  payment_status?: string;
  amount_total?: number;
  metadata?: Record<string, string>;
};

export type RecordResult = { recorded: boolean; existed: boolean; total: number };

export async function recordPaidSession(session: PaidSession, eventId?: string): Promise<RecordResult> {
  const total = Number(session.amount_total ?? 0) / 100;
  const meta = session.metadata ?? {};
  const userId = meta["user_id"];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Event-level idempotency: the same Stripe event must never be processed twice.
  if (eventId) {
    const { error } = await supabaseAdmin
      .from("stripe_events")
      .insert({ id: eventId, session_id: session.id });
    if (error) return { recorded: false, existed: true, total };
  }

  if (!userId) return { recorded: false, existed: false, total };

  const { data: existing } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .contains("items", { session_id: session.id })
    .maybeSingle();

  if (existing) return { recorded: false, existed: true, total };

  let books: unknown = [];
  try {
    books = JSON.parse(meta["items"] ?? "[]");
  } catch {
    books = [];
  }

  const { error } = await supabaseAdmin.from("orders").insert({
    user_id: userId,
    total_amount: total,
    status: "paid",
    referrer_code: meta["referrer_code"] ?? null,
    items: { session_id: session.id, books } as never,
  });
  if (error) throw new Error(error.message);

  return { recorded: true, existed: false, total };
}

export async function findOrderBySession(sessionId: string, userId?: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let q = supabaseAdmin
    .from("orders")
    .select("id,total_amount,status,created_at")
    .contains("items", { session_id: sessionId });
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q.maybeSingle();
  return data ?? null;
}

/** Constant-time hex comparison for webhook signatures. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
