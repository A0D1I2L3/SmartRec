import os from 'node:os'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app.js'
import { createLimits } from '../server/limits.js'
import { searchShopping } from '../server/serp.js'

vi.mock('../server/serp.js', async importOriginal => {
  const actual = await importOriginal()
  return { ...actual, searchShopping: vi.fn() }
})

const makeApp = (overrides = {}) => {
  const stateFile = path.join(os.tmpdir(), `smartrec-quota-${process.pid}-${Date.now()}-${Math.random()}.json`)
  const limits = createLimits({ ttlMs: 60000, monthlyLimit: 250, stateFile, ...overrides })
  return { app: createApp({ limits }), limits }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/products', () => {
  it('rejects an empty query', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns ranked live results from the provider', async () => {
    const { app } = makeApp()
    searchShopping.mockResolvedValue([
      {
        title: 'Samsung Galaxy M14 phone',
        extracted_price: 9499,
        source: 'Flipkart',
        rating: 4.2,
        snippet: '6000mAh battery',
      },
      { title: 'Samsung Galaxy S24 phone', extracted_price: 79999, source: 'Amazon', rating: 4.6 },
    ])
    const res = await request(app).get('/api/products').query({ q: 'samsung rgb phones under 10k' })
    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('live')
    expect(res.body.cached).toBe(false)
    expect(res.body.products).toHaveLength(1)
    expect(res.body.products[0].name).toContain('M14')
    expect(res.body.products[0].reason).toBeTruthy()
    expect(res.body.products[0].matchResult.price).toBe('confirmed')
    expect(res.body.products[0].matchResult.rgb).toBe('absent')
  })

  it('hard-excludes over-budget live results', async () => {
    const { app } = makeApp()
    searchShopping.mockResolvedValue([
      { title: 'Samsung Galaxy M14 phone', extracted_price: 9499, source: 'Flipkart' },
      { title: 'Samsung Galaxy S24 phone', extracted_price: 79999, source: 'Amazon' },
    ])
    const res = await request(app).get('/api/products').query({ q: 'samsung phones under 10k' })
    expect(res.body.products).toHaveLength(1)
    expect(res.body.products[0].name).toContain('M14')
  })

  it('serves cached results without hitting the provider', async () => {
    const { app } = makeApp()
    searchShopping.mockResolvedValue([{ title: 'Samsung Galaxy M14 phone', extracted_price: 9499, source: 'Flipkart' }])
    await request(app).get('/api/products').query({ q: 'samsung phones under 10k' })
    const res = await request(app).get('/api/products').query({ q: 'samsung phones under 10k' })
    expect(res.status).toBe(200)
    expect(res.body.cached).toBe(true)
    expect(searchShopping).toHaveBeenCalledTimes(1)
  })

  it('falls back to the offline catalog when the provider fails', async () => {
    const { app } = makeApp()
    searchShopping.mockRejectedValue(new Error('provider down'))
    const res = await request(app).get('/api/products').query({ q: 'laptop under 40k' })
    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('catalog')
    expect(res.body.fallback).toBe(true)
    expect(res.body.products.length).toBeGreaterThan(0)
  })

  it('serves the catalog when the monthly quota is exhausted', async () => {
    const { app: broke } = makeApp({ monthlyLimit: 0 })
    const res = await request(broke).get('/api/products').query({ q: 'laptop under 40k' })
    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('catalog')
    expect(res.body.quota.exhausted).toBe(true)
    expect(searchShopping).not.toHaveBeenCalled()
  })
})

describe('GET /api/health', () => {
  it('reports service status', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.service).toBe('smartrec')
  })

  it('reports quota and catalog stats', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/health/status')
    expect(res.status).toBe(200)
    expect(res.body.catalogSize).toBeGreaterThan(0)
    expect(res.body.limits.monthlyLimit).toBeGreaterThan(0)
  })
})
