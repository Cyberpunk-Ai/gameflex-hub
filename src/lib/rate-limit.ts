// @ts-nocheck
const buckets = new Map<string, number[]>();

function pruneOldBuckets(now: number) {
  if (buckets.size < 200) return;
  for (const [key, timestamps] of buckets.entries()) {
    const valid = timestamps.filter((t) => now - t < 60000);
    if (valid.length === 0) {
      buckets.delete(key);
    } else {
      buckets.set(key, valid);
    }
  }
}

export function isRateLimited(key: string, maxCalls: number, windowMs: number): boolean {
  const now = Date.now();
  pruneOldBuckets(now);
  const calls = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (calls.length >= maxCalls) return true;
  calls.push(now);
  buckets.set(key, calls);
  return false;
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
