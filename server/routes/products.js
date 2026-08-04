import { Router } from 'express'
import { config } from '../config.js'
import { logger } from '../logger.js'
import { parseQuery, matchProduct } from '../query.js'
import { reasonFor, sortProducts } from '../scoring.js'
import { constraintScore, evaluateConstraints } from '../features.js'
import { normalizeLiveResult, searchShopping } from '../serp.js'

function enrich(product, parsed) {
  const matchResult = evaluateConstraints(product, parsed.features, parsed.maxPrice)
  return {
    ...product,
    matchResult,
    constraintScore: constraintScore(matchResult),
    reason: reasonFor(product, parsed),
  }
}

function searchCatalog(catalog, parsed) {
  const matched = catalog.filter(product => matchProduct(product, parsed))
  const products = sortProducts(matched.map(product => enrich(product, parsed)), parsed, p => p.constraintScore || 0)
  return { products, parsed, fetchedAt: new Date().toISOString(), mode: 'catalog' }
}

export function createProductsRouter({ limits, catalog }) {
  const router = Router()

  router.get('/', async (req, res) => {
    const query = String(req.query.q || '').trim()
    if (!query) return res.status(400).json({ error: 'A search query is required.' })

    const parsed = parseQuery(query)
    const key = parsed.text

    const cached = limits.getCache(key)
    if (cached) return res.json({ ...cached, cached: true })

    const remaining = limits.remainingThisMonth()
    if (!config.serpApiKey) {
      logger.info('No SerpApi key configured — serving offline catalog', { query })
      return res.json({ ...searchCatalog(catalog, parsed), cached: false, quota: { unconfigured: true } })
    }
    if (remaining <= 0) {
      logger.info('Monthly live-search quota exhausted — serving offline catalog', { query })
      return res.json({
        ...searchCatalog(catalog, parsed),
        cached: false,
        quota: { exhausted: true, ...limits.stats() },
      })
    }

    try {
      const results = await searchShopping(parsed.search)
      limits.recordUse()
      const products = results
        .map((item, index) => normalizeLiveResult(item, parsed, index))
        .filter(product => product.price && matchProduct(product, parsed))
      const ranked = sortProducts(products.map(product => enrich(product, parsed)), parsed, p => p.constraintScore || 0)
      const data = {
        products: ranked,
        parsed,
        fetchedAt: new Date().toISOString(),
        mode: 'live',
        quota: limits.stats(),
      }
      limits.setCache(key, data)
      return res.json({ ...data, cached: false })
    } catch (error) {
      logger.warn('Live search failed — falling back to offline catalog', { query, message: error.message })
      return res.json({ ...searchCatalog(catalog, parsed), cached: false, mode: 'catalog', fallback: true })
    }
  })

  return router
}
