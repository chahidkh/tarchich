import { beforeEach, describe, expect, it, vi } from "vitest";

/** Minimal chainable stub of the supabase-js query builder used by orders.server. */
type State = { eventInsertFails: boolean; existingOrder: unknown; inserted: Record<string, unknown>[] };
const state: State = { eventInsertFails: false, existingOrder: null, inserted: [] };

vi.mock("@/integrations/supabase/client.server", () => {
  const supabaseAdmin = {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      Object.assign(builder, {
        select: chain,
        eq: chain,
        contains: chain,
        maybeSingle: async () => ({ data: table === "orders" ? state.existingOrder : null, error: null }),
        insert: async (row: Record<string, unknown>) => {
          if (table === "stripe_events") {
            return state.eventInsertFails ? { error: { message: "duplicate key" } } : { error: null };
          }
          state.inserted.push(row);
          return { error: null };
        },
      });
      return builder;
    },
  };
  return { supabaseAdmin };
});

const { recordPaidSession } = await import("@/lib/orders.server");

const session = {
  id: "cs_test_1",
  payment_status: "paid",
  amount_total: 5000,
  metadata: { user_id: "user-1", items: "[]" },
};

describe("recordPaidSession idempotency", () => {
  beforeEach(() => {
    state.eventInsertFails = false;
    state.existingOrder = null;
    state.inserted = [];
  });

  it("records a new paid session once", async () => {
    const result = await recordPaidSession(session, "evt_1");
    expect(result).toEqual({ recorded: true, existed: false, total: 50 });
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0]).toMatchObject({ user_id: "user-1", status: "paid", total_amount: 50 });
  });

  it("ignores a replayed Stripe event id", async () => {
    state.eventInsertFails = true;
    const result = await recordPaidSession(session, "evt_1");
    expect(result).toEqual({ recorded: false, existed: true, total: 50 });
    expect(state.inserted).toHaveLength(0);
  });

  it("does not create a second order for the same checkout session", async () => {
    state.existingOrder = { id: "order-1" };
    const result = await recordPaidSession(session, "evt_2");
    expect(result).toEqual({ recorded: false, existed: true, total: 50 });
    expect(state.inserted).toHaveLength(0);
  });

  it("skips ordering when the session carries no user", async () => {
    const result = await recordPaidSession({ ...session, metadata: {} }, "evt_3");
    expect(result).toEqual({ recorded: false, existed: false, total: 50 });
    expect(state.inserted).toHaveLength(0);
  });
});
