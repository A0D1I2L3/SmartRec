import { Router } from 'express'
import { logger } from '../logger.js'
import { parseQuery, matchProduct } from '../query.js'
import { reasonFor, sortProducts } from '../scoring.js'
import { constraintScore, evaluateConstraints } from '../features.js'

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

export function createProductsRouter({ cache, catalog }) {
  const router = Router()

  router.get('/', async (req, res) => {
    const query = String(req.query.q || '').trim()
    if (!query) return res.status(400).json({ error: 'A search query is required.' })

    const parsed = parseQuery(query)
    const key = parsed.text

    const cached = cache.getCache(key)
    if (cached) return res.json({ ...cached, cached: true })

    logger.debug('Serving offline catalog', { query })
    const data = searchCatalog(catalog, parsed)
    cache.setCache(key, data)
    return res.json({ ...data, cached: false })
  })

  return router
}
