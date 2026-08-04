import { describe, expect, it } from 'vitest'
import { createCache } from '../server/cache.js'

describe('createCache', () => {
  const now = () => new Date('2026-08-03T12:00:00Z').getTime()

  it('caches entries for the TTL and evicts after expiry', () => {
    let current = now()
    const cache = createCache({ ttlMs: 5000, now: () => current })
    cache.setCache('key', { products: [1] })
    expect(cache.getCache('key')).toEqual({ products: [1] })
    current = now() + 6000
    expect(cache.getCache('key')).toBeNull()
  })

  it('reports cache size via stats', () => {
    const cache = createCache({ ttlMs: 1000, now })
    cache.setCache('a', {})
    cache.setCache('b', {})
    expect(cache.stats().cacheEntries).toBe(2)
  })
})
