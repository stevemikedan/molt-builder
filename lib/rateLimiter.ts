/**
 * Simple in-memory rate limiter.
 *
 * Good enough for development and low-traffic production.
 * For high-traffic production, replace with Vercel KV (Upstash):
 *   https://vercel.com/docs/storage/vercel-kv
 *
 * Note: in-memory state is per-instance and resets on cold starts.
 * Each Vercel serverless function invocation may be a fresh instance.
 */

interface Entry {
  count: number;
  windowStart: number;
}

const store = new Map<string, Entry>();

/**
 * Check whether a key is within its rate limit window.
 *
 * @param key         Unique key (e.g. "check-name:1.2.3.4")
 * @param maxRequests Max allowed requests within the window
 * @param windowMs    Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}
