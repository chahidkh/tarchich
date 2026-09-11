import { describe, expect, it } from "vitest";
import { hmacSha256Hex, timingSafeEqualHex, verifyStripeSignature } from "@/lib/orders.server";

const SECRET = "whsec_test_secret";
const BODY = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

async function header(timestampSec: number, secret = SECRET, body = BODY) {
  const sig = await hmacSha256Hex(secret, `${timestampSec}.${body}`);
  return `t=${timestampSec},v1=${sig}`;
}

describe("verifyStripeSignature", () => {
  const now = 1_700_000_000_000;
  const t = Math.floor(now / 1000);

  it("accepts a valid signature", async () => {
    expect(await verifyStripeSignature(SECRET, await header(t), BODY, now)).toEqual({ ok: true });
  });

  it("rejects a signature made with the wrong secret", async () => {
    const bad = await header(t, "whsec_wrong");
    expect(await verifyStripeSignature(SECRET, bad, BODY, now)).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects a tampered body", async () => {
    const h = await header(t);
    expect(await verifyStripeSignature(SECRET, h, BODY + " ", now)).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects a replayed old event", async () => {
    const old = await header(t - 3600);
    expect(await verifyStripeSignature(SECRET, old, BODY, now)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a malformed header", async () => {
    expect(await verifyStripeSignature(SECRET, "garbage", BODY, now)).toMatchObject({ ok: false, status: 400 });
  });
});

describe("timingSafeEqualHex", () => {
  it("compares equal and unequal values", () => {
    expect(timingSafeEqualHex("abcd", "abcd")).toBe(true);
    expect(timingSafeEqualHex("abcd", "abce")).toBe(false);
    expect(timingSafeEqualHex("abcd", "abc")).toBe(false);
  });
});
