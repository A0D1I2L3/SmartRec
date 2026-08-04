import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classify } from './query.js'
import { inferSpecs } from './features.js'
import { logger } from './logger.js'
import { config } from './config.js'

/**
 * Minimal RFC 4180 CSV parser — handles quoted fields containing commas
 * (e.g. `"15.6 inches, 1920 x 1080 pixels"`) and CRLF line endings.
 */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++
      row.push(field)
      field = ''
      if (row.some(cell => cell.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += char
    }
  }

  if (field !== '' || row.length) {
    row.push(field)
    if (row.some(cell => cell.trim() !== '')) rows.push(row)
  }
  return rows
}

export function toPrice(value) {
  const digits = String(value || '').replace(/[^\d]/g, '')
  return digits ? Number(digits) : null
}

/** Flipkart-style 0–100 rating scale → 0–5 star scale. */
export function toStarRating(rating) {
  const parsed = Number(rating)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.round((parsed / 20) * 10) / 10
}

const cleanValue = value => String(value || '').replace(/\u00a0/g, ' ').trim()

const detail = (label, value) => (value ? { label, value: cleanValue(value) } : null)

/**
 * Structured, verified specs derived from the catalog's dedicated columns
 * (a real spec table — never free-text prose). Only these can produce a
 * `confirmed` verdict.
 */
function derivedVerifiedSpecs(record) {
  const verified = {}
  if (/touch/i.test(record.Display)) verified.touchscreen = true
  if (/(120|144|165|240)\s*hz/i.test(record.Display)) verified.high_refresh = true
  if (/(rtx|gtx|radeon\s*rx)/i.test(record.Graphics)) verified.dedicated_gpu = true
  if (/ssd/i.test(record.SSD)) verified.ssd = true
  if (/backlit|backlight/i.test(record.Model)) verified.backlit = true
  return verified
}

function buildSpecDetails(record) {
  return Object.fromEntries(
    Object.entries({
      cpu: detail('Processor', record.Generation || record.Core),
      ram: detail('RAM', record.Ram),
      storage: detail('Storage', record.SSD),
      display: detail('Display', record.Display),
      gpu: detail('Graphics', record.Graphics),
      os: detail('Operating System', record.OS),
      warranty: detail('Warranty', record.Warranty),
      touchscreen: detail('Touch screen', /touch/i.test(record.Display) ? 'Yes' : null),
      high_refresh: detail('High-refresh display', /(120|144|165|240)\s*hz/i.test(record.Display) ? 'Yes' : null),
      dedicated_gpu: detail('Dedicated GPU', /(rtx|gtx|radeon\s*rx)/i.test(record.Graphics) ? 'Yes' : null),
    }).filter(([, value]) => value),
  )
}

function rowToProduct(record, index) {
  const name = (record.Model || 'Unknown product').trim()
  const price = toPrice(record.Price)
  const rating = toStarRating(record.Rating)
  const specs = [record.Generation, record.Core, record.Ram, record.SSD, record.Display, record.Graphics, record.OS, record.Warranty]
    .filter(Boolean)
    .map(cleanValue)
  const specs_verified = derivedVerifiedSpecs(record)
  const specs_inferred = inferSpecs([name, record.Generation, record.Core, record.Ram, record.SSD, record.Display, record.Graphics, record.OS].join(' '), specs_verified)
  return {
    id: `catalog-${index}`,
    name,
    brand: name.split(' ')[0],
    type: classify(name),
    price,
    currency: 'INR',
    rating,
    image: '',
    retailer: 'Offline catalog',
    buyUrl: `https://www.google.com/search?q=${encodeURIComponent(`${name} price in India`)}`,
    specs,
    specs_verified,
    specs_inferred,
    specs_source: Object.keys(specs_verified).length
      ? 'verified'
      : Object.keys(specs_inferred).length
        ? 'inferred'
        : 'none',
    specDetails: buildSpecDetails(record),
    source: 'catalog',
  }
}

export function loadCatalog(file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', config.catalogFile)) {
  try {
    const text = readFileSync(file, 'utf8')
    const rows = parseCsv(text)
    const headers = rows[0].map(header => header.trim())
    const products = rows
      .slice(1)
      .map((values, index) => {
        const record = Object.fromEntries(headers.map((header, i) => [header, (values[i] || '').trim()]))
        return rowToProduct(record, index)
      })
      .filter(product => product.price)
    logger.info('Loaded offline catalog', { file, products: products.length })
    return products
  } catch (error) {
    logger.warn('Could not load offline catalog', { file, message: error.message })
    return []
  }
}
