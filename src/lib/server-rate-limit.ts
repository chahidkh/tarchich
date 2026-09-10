/**
 * Small in-memory rate limiter for server functions and API routes.
 * Keyed by caller IP (falls back to a shared bucket when the IP is unknown).
 * Best-effort only: each worker instance keeps its own counters, which is
 * enough to blunt abusive bursts against public endpoints.
 */

type Bucket = { hits: number[]; };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5_000;

export function clientIpFrom(request: Request | undefined): string {
  if (!request) return "unknown";
  const h = request.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
    "unknown"
  ) || "unknown";
}

export function checkServerRateLimit(
  key: string,
  max: number,
  windowMs = 60_000,
): { allowed: boolean; retryInSec: number } {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) buckets.clear();

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= max) {
    const oldest = bucket.hits[0] ?? now;
    buckets.set(key, bucket);
    return { allowed: false, retryInSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryInSec: 0 };
}

/** Throws a localized error when the caller exceeded the allowance. */
export function enforceRateLimit(scope: string, request: Request | undefined, max: number, windowMs = 60_000) {
  const { allowed, retryInSec } = checkServerRateLimit(`${scope}:${clientIpFrom(request)}`, max, windowMs);
  if (!allowed) throw new Error(`طلبات كثيرة جداً، حاول بعد ${retryInSec} ثانية.`);
}
