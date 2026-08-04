import { createApp } from './app.js'
import { config, validateConfig } from './config.js'
import { logger } from './logger.js'

const problems = validateConfig()
if (problems.length) {
  logger.error('Invalid configuration', { problems })
  process.exit(1)
}

const app = createApp()

app.listen(config.port, () => {
  logger.info(`SmartRec API listening on http://localhost:${config.port}`, { env: config.env })
  logger.info('Serving the offline catalog only — live search has been removed')
})
