import { describe, expect, it } from "vitest";
import { assertAdmin } from "@/lib/admin-guard";

function ctx(result: { data: unknown; error: unknown }) {
  return { supabase: { rpc: async () => result }, userId: "user-1" };
}

describe("assertAdmin", () => {
  it("passes when has_role returns true", async () => {
    await expect(assertAdmin(ctx({ data: true, error: null }))).resolves.toBeUndefined();
  });

  it("rejects a non-admin", async () => {
    await expect(assertAdmin(ctx({ data: false, error: null }))).rejects.toThrow("Forbidden");
  });

  it("rejects when the role check errors", async () => {
    await expect(assertAdmin(ctx({ data: true, error: new Error("boom") }))).rejects.toThrow("Forbidden");
  });

  it("sends the admin role and caller id to has_role", async () => {
    const calls: unknown[] = [];
    await assertAdmin({
      userId: "abc",
      supabase: {
        rpc: async (fn, args) => {
          calls.push([fn, args]);
          return { data: true, error: null };
        },
      },
    });
    expect(calls).toEqual([["has_role", { _user_id: "abc", _role: "admin" }]]);
  });
});
