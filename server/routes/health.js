import { Router } from 'express'
import { config } from '../config.js'

export function createHealthRouter({ cache, catalogSize }) {
  const router = Router()

  router.get('/', (req, res) => {
    res.json({
      status: 'ok',
      service: 'smartrec',
      time: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    })
  })

  router.get('/status', (req, res) => {
    res.json({
      status: 'ok',
      env: config.env,
      catalogSize,
      cache: cache.stats(),
    })
  })

  return router
}
