import type { RequestHandler } from 'express';

/**
 * A small fixed-window rate limiter.
 *
 * Deliberately dependency-free and in-process, which is the right shape for a
 * single free-tier instance. Two consequences to know about:
 *   * counters reset on restart or deploy;
 *   * with more than one instance the effective limit multiplies.
 * Move to a shared store (Redis) before scaling out.
 */

interface Window {
  count: number;
  resetAt: number;
}

interface LimitOptions {
  /** Requests allowed per window, per key. */
  max: number;
  windowMs: number;
  /** Distinguishes buckets so two limiters cannot share counters. */
  name: string;
  message?: string;
}

const buckets = new Map<string, Window>();

/** Drops expired windows so the map cannot grow without bound. */
function sweep(now: number): void {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Identifies the caller. Prefers the authenticated user, because that is the
 * thing we actually want to limit — an IP is shared by everyone behind a NAT,
 * and on Render every request arrives via a proxy anyway.
 */
function identify(req: Parameters<RequestHandler>[0]): string {
  if (req.userId) return `u:${req.userId}`;
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim() || req.ip || 'unknown';
  return `ip:${ip}`;
}

export function rateLimit({ max, windowMs, name, message }: LimitOptions): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();

    if (now - lastSweep > SWEEP_INTERVAL_MS) {
      sweep(now);
      lastSweep = now;
    }

    const key = `${name}:${identify(req)}`;
    const window = buckets.get(key);

    if (!window || window.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    window.count += 1;

    if (window.count > max) {
      const retryAfter = Math.ceil((window.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        message: message ?? `Too many requests. Try again in ${retryAfter}s.`,
      });
      return;
    }

    next();
  };
}

/** Exposed for tests, which need a clean slate between cases. */
export function resetRateLimits(): void {
  buckets.clear();
}
