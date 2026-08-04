import { extractFeatures } from './features.js'

const aliases = {
  mobile: 'phone',
  smartphone: 'phone',
  notebook: 'laptop',
  macbook: 'laptop',
  tab: 'tablet',
  ipad: 'tablet',
}

export const intentWords = {
  teaching: ['teacher', 'teaching', 'tutor', 'zoom', 'online class'],
  coding: ['coding', 'code', 'developer', 'programmer', 'programming'],
  gaming: ['gaming', 'game', 'games'],
  photography: ['photography', 'photo', 'camera', 'video', 'editing'],
  student: ['student', 'college', 'study', 'school'],
  battery: ['battery', 'long lasting', 'all day'],
  travel: ['travel', 'portable', 'light', 'lightweight', 'slim'],
}

export const brands = [
  'samsung',
  'xiaomi',
  'redmi',
  'oneplus',
  'apple',
  'iphone',
  'google',
  'pixel',
  'motorola',
  'moto',
  'realme',
  'vivo',
  'oppo',
  'asus',
  'lenovo',
  'dell',
  'hp',
  'acer',
  'msi',
  'gigabyte',
  'tecno',
  'nothing',
  'infinix',
  'nokia',
  'lg',
  'wings',
  'zebronics',
  'avita',
  'huawei',
  'honor',
  'iqoo',
  'poco',
  'nord',
].sort((a, b) => b.length - a.length)

const amount = `(\\d+(?:\\.\\d+)?(?:,\\d{3})*)\\s*(lakh|k|thousand)?`

const budgetPatterns = [
  { re: new RegExp(`(?:under|below|less than|within|upto?|up to)\\s*(?:₹|rs\\.?\\s*)?${amount}`, 'i'), soft: false },
  { re: new RegExp(`\\baround\\s*(?:₹|rs\\.?\\s*)?${amount}`, 'i'), soft: true },
  { re: new RegExp(`(?:₹|rs\\.?\\s*)\\s*${amount}\\b`, 'i'), soft: false },
]

const budgetStrip =
  /(?:under|below|less than|within|upto?|up to|around)\s*(?:₹|rs\.?\s*)?\d+(?:\.\d+)?(?:,\d{3})*\s*(?:lakh|k|thousand)?|(?:₹|rs\.?\s*)\s*\d+(?:\.\d+)?(?:,\d{3})*(?:\s*(?:lakh|k|thousand))?\b/gi

function extractBudget(text) {
  for (const { re, soft } of budgetPatterns) {
    const match = text.match(re)
    if (!match) continue
    const unit = (match[2] || '').toLowerCase()
    const multiplier = unit.startsWith('l') ? 100000 : /k|thousand/.test(unit) ? 1000 : 1
    return { maxPrice: Number(match[1].replace(/,/g, '')) * multiplier, soft }
  }
  return { maxPrice: null, soft: false }
}

export function extractBrand(text = '') {
  return brands.find(brand => text.includes(brand)) || null
}

export function parseQuery(query) {
  const text = String(query || '')
    .toLowerCase()
    .trim()
  const { maxPrice, soft } = extractBudget(text)
  const typeToken =
    Object.keys(aliases).find(word => text.includes(word)) ||
    ['phone', 'laptop', 'tablet'].find(word => text.includes(word))
  const intent = Object.entries(intentWords)
    .filter(([, words]) => words.some(word => text.includes(word)))
    .map(([name]) => name)
  const clean = text
    .replace(budgetStrip, ' ')
    .replace(/\b(for|me|a|an|the|best|i|want|need|my|to|please|recommend|recommendation|some|good|around)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return {
    text,
    search: clean || text,
    type: aliases[typeToken] || typeToken || null,
    maxPrice,
    softBudget: Boolean(maxPrice) && soft,
    intent,
    brand: extractBrand(text),
    features: extractFeatures(text),
  }
}

export function classify(title = '') {
  const value = title.toLowerCase()
  return /tablet|\btab\b|ipad/.test(value)
    ? 'tablet'
    : /laptop|notebook|macbook|chromebook/.test(value)
      ? 'laptop'
      : 'phone'
}

export function matchProduct(product, parsed) {
  const content = `${product.name} ${product.specs.join(' ')}`.toLowerCase()
  if (parsed.type && product.type !== parsed.type) return false
  // Price is a hard, binary constraint — never soft.
  if (parsed.maxPrice != null && !(product.price <= parsed.maxPrice)) return false
  if (parsed.brand && !content.includes(parsed.brand)) return false
  return true
}
