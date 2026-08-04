/**
 * In-memory TTL cache for search results. There is no external API quota to
 * track anymore — the catalog is served directly from memory on every
 * request — so this only exists to avoid re-running the scoring/matching
 * pipeline for a repeated identical query within a short window.
 */
export function createCache({ ttlMs, now = () => Date.now() } = {}) {
  const cache = new Map()

  return {
    getCache(key) {
      const hit = cache.get(key)
      if (hit && hit.expires > now()) return hit.data
      cache.delete(key)
      return null
    },

    setCache(key, data) {
      cache.set(key, { data, expires: now() + ttlMs })
    },

    cacheEntries: () => cache.size,

    stats: () => ({ cacheEntries: cache.size, ttlMinutes: ttlMs / 60000 }),
  }
}
