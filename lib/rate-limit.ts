// In-process sliding-window rate limiter. Used to gate paths that
// hit paid third-party APIs (OpenAI vision, OpenAI chat) so a
// single chat or user can't blow the monthly bill by spamming.
//
// Bucket lives in memory — no DB, no Redis. Each serverless region
// keeps its own counts; a stubborn attacker spread across regions
// could still get through but the realistic exposure is the same
// user from the same Telegram chat hammering the same edge node,
// which this stops cleanly.
//
// We trade theoretical correctness for zero setup cost. For a
// 10-50 person cohort that's the right call. Move to a DB-backed
// limiter (token_buckets table) once we're past 500 users.
//
// Usage:
//   const rl = checkRateLimit({ key: `tg:photo:${chatId}`, max: 10, windowMs: 60_000 });
//   if (!rl.ok) reply(`Easy — try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`);

type Bucket = number[];

// Map<key, sorted timestamps of recent hits, oldest first>.
// LRU-trimmed lazily inside checkRateLimit; never grows unbounded
// because each call expires entries outside the window.
const BUCKETS = new Map<string, Bucket>();

// Hard ceiling so a single rogue serverless instance can't grow
// the map indefinitely (each key is small but the map itself is).
// 5,000 distinct keys covers normal load; oldest get evicted when
// we exceed it.
const MAX_KEYS = 5_000;

export type RateLimitCheck = {
  ok: boolean;
  /** ms until the next call would succeed. 0 when `ok: true`. */
  retryAfterMs: number;
  /** how many hits remain in the current window after THIS call (if ok). */
  remaining: number;
};

export type RateLimitOpts = {
  key: string;
  max: number;
  windowMs: number;
};

export function checkRateLimit(opts: RateLimitOpts): RateLimitCheck {
  const now = Date.now();
  const since = now - opts.windowMs;

  let bucket = BUCKETS.get(opts.key);
  if (!bucket) {
    bucket = [];
    BUCKETS.set(opts.key, bucket);
    if (BUCKETS.size > MAX_KEYS) {
      // Drop the first key. JS Map iteration is insertion-order so
      // the oldest distinct key goes first. Cheap LRU-ish.
      const first = BUCKETS.keys().next().value;
      if (first !== undefined) BUCKETS.delete(first);
    }
  }

  // Drop any hits older than the window. Bucket stays small.
  while (bucket.length > 0 && bucket[0] < since) bucket.shift();

  if (bucket.length >= opts.max) {
    const retryAfterMs = bucket[0] + opts.windowMs - now;
    return { ok: false, retryAfterMs: Math.max(0, retryAfterMs), remaining: 0 };
  }

  bucket.push(now);
  return {
    ok: true,
    retryAfterMs: 0,
    remaining: Math.max(0, opts.max - bucket.length),
  };
}

/** For tests / dev only. */
export function _resetRateLimits() {
  BUCKETS.clear();
}
