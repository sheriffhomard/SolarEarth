/**
 * Client-side Scientific Cache & Rate Limiting Engine.
 *
 * Implements:
 * - Differentiated TTLs by scientific data tier (climatology, hourly series, space weather).
 * - Rate limiting (Token Bucket) to protect European Commission JRC quotas.
 * - Explicit distinction between fresh, cached, stale, and offline model data.
 * - Transparent data age and expiration timestamps to prevent stale data misrepresentation.
 */

import { CacheFreshnessStatus } from '../types/scientificModel';

export interface CacheEntry<T> {
  data: T;
  source: string;
  cachedAtMs: number;
  freshUntilMs: number;
  staleAfterMs: number;
  key: string;
}

export interface CacheResolution<T> {
  data: T;
  status: CacheFreshnessStatus;
  cachedAtIso?: string;
  ageSeconds: number;
  isStale: boolean;
  provenanceNote: string;
}

// Configurable TTLs in milliseconds
export const CACHE_TTL_TIERS = {
  // Historical typical meteorological years (TMY) & 10-year climatology: 30 days
  CLIMATOLOGY_MS: 30 * 24 * 3600 * 1000,

  // Hourly solar observations & daily series: 24 hours fresh, 7 days stale grace period
  HOURLY_OBSERVATIONS_FRESH_MS: 24 * 3600 * 1000,
  HOURLY_OBSERVATIONS_MAX_STALE_MS: 7 * 24 * 3600 * 1000,

  // Short-term weather / near real-time: 3 hours
  NEAR_REAL_TIME_MS: 3 * 3600 * 1000,

  // Space weather (NOAA SWPC solar flux F10.7, Kp index): 15 minutes
  SPACE_WEATHER_MS: 15 * 60 * 1000,
};

/**
 * Client-side Token Bucket Rate Limiter
 * Ensures polite consumption of external APIs (e.g. PVGIS JRC quota: max 20 req/min, min 400ms interval).
 */
export class ClientRateLimiter {
  private capacity: number;
  private tokens: number;
  private refillRatePerMs: number;
  private lastRefillMs: number;
  private minIntervalMs: number;
  private lastRequestMs: number;

  constructor(requestsPerMinute = 20, minIntervalMs = 400) {
    this.capacity = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.refillRatePerMs = requestsPerMinute / (60 * 1000);
    this.lastRefillMs = Date.now();
    this.minIntervalMs = minIntervalMs;
    this.lastRequestMs = 0;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillMs;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRatePerMs);
    this.lastRefillMs = now;
  }

  async acquire(): Promise<void> {
    this.refill();
    const now = Date.now();
    const sinceLast = now - this.lastRequestMs;

    if (sinceLast < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - sinceLast));
    }

    if (this.tokens < 1) {
      const waitMs = Math.ceil((1 - this.tokens) / this.refillRatePerMs);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.refill();
    }

    this.tokens -= 1;
    this.lastRequestMs = Date.now();
  }
}

/**
 * Structured Scientific Cache with In-Memory + IndexedDB / LocalStorage backing.
 */
class ScientificDataCache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private rateLimiter = new ClientRateLimiter(20, 400);

  /**
   * Deterministic cache key generator.
   */
  generateKey(provider: string, operation: string, params: Record<string, string | number>): string {
    const sorted = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `solar_${provider}_${operation}_${sorted}`;
  }

  /**
   * Gets cached entry with explicit freshness classification.
   */
  get<T>(key: string): CacheResolution<T> | null {
    const now = Date.now();
    let entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;

    // Check localStorage fallback if not in memory
    if (!entry && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(`cache_${key}`);
        if (raw) {
          entry = JSON.parse(raw);
          if (entry) this.memoryCache.set(key, entry as CacheEntry<unknown>);
        }
      } catch {
        // LocalStorage quota or parse error
      }
    }

    if (!entry) return null;

    const ageSeconds = Math.round((now - entry.cachedAtMs) / 1000);
    const cachedAtIso = new Date(entry.cachedAtMs).toISOString();

    // Check if within fresh TTL
    if (now <= entry.freshUntilMs) {
      return {
        data: entry.data,
        status: 'cached',
        cachedAtIso,
        ageSeconds,
        isStale: false,
        provenanceNote: `Données en cache valide (${Math.round(ageSeconds / 60)} min)`,
      };
    }

    // Check if within stale grace period
    if (now <= entry.staleAfterMs) {
      return {
        data: entry.data,
        status: 'stale',
        cachedAtIso,
        ageSeconds,
        isStale: true,
        provenanceNote: `Données archivées expirées depuis le ${new Date(entry.freshUntilMs).toLocaleDateString()} (secours hors-ligne)`,
      };
    }

    // Truly expired beyond grace period
    this.remove(key);
    return null;
  }

  /**
   * Stores entry with configured TTLs.
   */
  set<T>(
    key: string,
    data: T,
    source: string,
    freshTtlMs: number = CACHE_TTL_TIERS.HOURLY_OBSERVATIONS_FRESH_MS,
    staleTtlMs: number = CACHE_TTL_TIERS.HOURLY_OBSERVATIONS_MAX_STALE_MS
  ): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      source,
      cachedAtMs: now,
      freshUntilMs: now + freshTtlMs,
      staleAfterMs: now + staleTtlMs,
      key,
    };

    this.memoryCache.set(key, entry as CacheEntry<unknown>);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch {
        // Quota exceeded: clean oldest
        this.pruneOldest();
      }
    }
  }

  remove(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`cache_${key}`);
      } catch {
        // Ignore
      }
    }
  }

  clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('cache_solar_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }
  }

  async acquireRateLimit(): Promise<void> {
    await this.rateLimiter.acquire();
  }

  private pruneOldest(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cache_solar_')) keys.push(k);
      }
      // Remove first 5 oldest
      keys.slice(0, 5).forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }
}

export const scientificCache = new ScientificDataCache();
