import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logger } from './logger.js'

const defaultStateFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data', 'quota.json')

/**
 * In-memory result cache + a monthly quota counter persisted to disk so the
 * 250-search free-tier budget survives server restarts.
 */
export function createLimits({ ttlMs, monthlyLimit, stateFile = defaultStateFile, now = () => Date.now() }) {
  const cache = new Map()

  let monthly = {}
  try {
    monthly = JSON.parse(readFileSync(stateFile, 'utf8'))
  } catch {
    // first run — no state yet
  }

  function persist() {
    try {
      mkdirSync(path.dirname(stateFile), { recursive: true })
      writeFileSync(stateFile, JSON.stringify(monthly, null, 2))
    } catch (error) {
      logger.warn('Could not persist quota state', { message: error.message })
    }
  }

  const monthKey = () => new Date(now()).toISOString().slice(0, 7)

  return {
    monthKey,

    getCache(key) {
      const hit = cache.get(key)
      if (hit && hit.expires > now()) return hit.data
      cache.delete(key)
      return null
    },

    setCache(key, data) {
      cache.set(key, { data, expires: now() + ttlMs })
    },

    usesThisMonth: () => monthly[monthKey()] || 0,

    remainingThisMonth: () => Math.max(0, monthlyLimit - (monthly[monthKey()] || 0)),

    recordUse() {
      const key = monthKey()
      monthly[key] = (monthly[key] || 0) + 1
      persist()
      return monthly[key]
    },

    cacheEntries: () => cache.size,

    stats: () => ({
      month: monthKey(),
      usedThisMonth: monthly[monthKey()] || 0,
      monthlyLimit,
      remaining: Math.max(0, monthlyLimit - (monthly[monthKey()] || 0)),
      cacheEntries: cache.size,
    }),
  }
}
