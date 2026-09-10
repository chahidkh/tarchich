/**
 * Very small client-side rate limiter (per device) to stop rapid repeated
 * submissions of forms such as contact messages and book reviews.
 */
export function checkRateLimit(key: string, max: number, windowMs = 60_000): { allowed: boolean; retryInSec: number } {
  if (typeof window === "undefined") return { allowed: true, retryInSec: 0 };
  const storageKey = `rl:${key}`;
  const now = Date.now();
  let hits: number[] = [];
  try {
    hits = (JSON.parse(localStorage.getItem(storageKey) ?? "[]") as number[]).filter((t) => now - t < windowMs);
  } catch {
    hits = [];
  }
  if (hits.length >= max) {
    const oldest = hits[0] ?? now;
    return { allowed: false, retryInSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)) };
  }
  hits.push(now);
  try {
    localStorage.setItem(storageKey, JSON.stringify(hits));
  } catch {
    /* ignore */
  }
  return { allowed: true, retryInSec: 0 };
}
