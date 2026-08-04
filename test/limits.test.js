import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createLimits } from '../server/limits.js'

const stateFile = () => path.join(os.tmpdir(), `smartrec-limits-${process.pid}-${Math.random()}.json`)

describe('createLimits', () => {
  const now = () => new Date('2026-08-03T12:00:00Z').getTime()

  it('caches entries for the TTL and evicts after expiry', () => {
    let current = now()
    const limits = createLimits({ ttlMs: 5000, monthlyLimit: 250, stateFile: stateFile(), now: () => current })
    limits.setCache('key', { products: [1] })
    expect(limits.getCache('key')).toEqual({ products: [1] })
    current = now() + 6000
    expect(limits.getCache('key')).toBeNull()
  })

  it('tracks monthly usage against the limit', () => {
    const limits = createLimits({ ttlMs: 1000, monthlyLimit: 3, stateFile: stateFile(), now })
    expect(limits.remainingThisMonth()).toBe(3)
    limits.recordUse()
    limits.recordUse()
    expect(limits.remainingThisMonth()).toBe(1)
    limits.recordUse()
    expect(limits.remainingThisMonth()).toBe(0)
  })

  it('persists usage across instances so restarts keep quota', () => {
    const file = stateFile()
    const first = createLimits({ ttlMs: 1000, monthlyLimit: 10, stateFile: file, now })
    first.recordUse()
    const second = createLimits({ ttlMs: 1000, monthlyLimit: 10, stateFile: file, now })
    expect(second.remainingThisMonth()).toBe(9)
  })
})
