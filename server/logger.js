import { config } from './config.js'

const levels = { debug: 10, info: 20, warn: 30, error: 40 }
const minLevel = config.isProd ? 'info' : 'debug'

function write(level, message, meta) {
  if (levels[level] < levels[minLevel]) return
  const entry = { level, time: new Date().toISOString(), message, ...meta }
  const line = config.isProd
    ? JSON.stringify(entry)
    : `[${entry.time}] ${level.toUpperCase().padEnd(5)} ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
  ;(level === 'error' ? console.error : console.log)(line)
}

export const logger = {
  debug: (message, meta = {}) => write('debug', message, meta),
  info: (message, meta = {}) => write('info', message, meta),
  warn: (message, meta = {}) => write('warn', message, meta),
  error: (message, meta = {}) => write('error', message, meta),
}
