import express from 'express'
import helmet from 'helmet'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { logger } from './logger.js'
import { createCache } from './cache.js'
import { loadCatalog } from './catalog.js'
import { createProductsRouter } from './routes/products.js'
import { createHealthRouter } from './routes/health.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function createApp({
  cache = createCache({ ttlMs: config.cacheTtlMs }),
  catalog = loadCatalog(),
} = {}) {
  const app = express()
  app.disable('x-powered-by')

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  )

  app.use((req, res, next) => {
    const start = process.hrtime.bigint()
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6
      logger.debug('request', { method: req.method, url: req.originalUrl, status: res.statusCode, ms: Math.round(ms) })
    })
    next()
  })

  app.use('/api/products', createProductsRouter({ cache, catalog }))
  app.use('/api/health', createHealthRouter({ cache, catalogSize: catalog.length }))
  app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route.' }))

  app.use(express.static(path.join(root, 'dist')))
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(root, 'dist', 'index.html')))

  return app
}
