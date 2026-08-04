import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app.js'
import { createCache } from '../server/cache.js'

const makeApp = (overrides = {}) => {
  const cache = createCache({ ttlMs: 60000, ...overrides })
  return { app: createApp({ cache }), cache }
}

describe('GET /api/products', () => {
  it('rejects an empty query', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns ranked catalog results', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/products').query({ q: 'laptop under 60000' })
    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('catalog')
    expect(res.body.cached).toBe(false)
    expect(res.body.products.length).toBeGreaterThan(0)
    expect(res.body.products[0].reason).toBeTruthy()
    expect(res.body.products[0].matchResult.price).toBe('confirmed')
  })

  it('hard-excludes over-budget catalog results', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/products').query({ q: 'laptop under 1' })
    expect(res.status).toBe(200)
    expect(res.body.products).toHaveLength(0)
  })

  it('serves cached results for a repeated identical query', async () => {
    const { app } = makeApp()
    await request(app).get('/api/products').query({ q: 'laptop under 60000' })
    const res = await request(app).get('/api/products').query({ q: 'laptop under 60000' })
    expect(res.status).toBe(200)
    expect(res.body.cached).toBe(true)
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

  it('reports catalog and cache stats', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/health/status')
    expect(res.status).toBe(200)
    expect(res.body.catalogSize).toBeGreaterThan(0)
    expect(res.body.cache.cacheEntries).toBeGreaterThanOrEqual(0)
  })
})
