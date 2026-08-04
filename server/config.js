import 'dotenv/config'

const env = process.env.NODE_ENV || 'development'
const port = Number(process.env.PORT || 3001)

export const config = {
  env,
  isProd: env === 'production',
  port,
  cacheTtlMs: 5 * 60 * 1000,
  catalogFile: process.env.CATALOG_FILE || 'laptop.csv',
  dataDir: process.env.DATA_DIR || '.data',
}

export function validateConfig() {
  const problems = []
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    problems.push(`PORT must be a valid port number, got "${process.env.PORT}"`)
  if (!['development', 'production', 'test'].includes(env))
    problems.push(`NODE_ENV must be development, production or test, got "${env}"`)
  return problems
}
