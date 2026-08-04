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
  if (!config.serpApiKey) logger.warn('PRODUCT_SEARCH_API_KEY is not set — serving the offline laptop catalog only')
})
