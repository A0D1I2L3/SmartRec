const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Canonical feature registry. Query tokens are mapped to canonical keys via
 * synonyms, and structured product data is keyed by the same canonical keys so
 * verified matches can produce `confirmed` while keyword hits stay `unconfirmed`.
 */
export const featureRegistry = {
  rgb: { label: 'RGB', synonyms: ['rgb', 'rgb backlit', 'rgb lighting', 'rgb backlight'] },
  backlit: { label: 'Backlit keyboard', synonyms: ['backlit keyboard', 'keyboard backlit', 'backlight', 'illuminated keyboard'] },
  touchscreen: { label: 'Touch screen', synonyms: ['touch screen', 'touchscreen', 'touch display'] },
  fingerprint: { label: 'Fingerprint sensor', synonyms: ['fingerprint', 'finger print'] },
  webcam: { label: 'Webcam', synonyms: ['webcam', 'hd webcam', 'fhd webcam', '1080p webcam'] },
  dedicated_gpu: { label: 'Dedicated GPU', synonyms: ['dedicated gpu', 'dedicated graphics', 'graphics card', 'rtx', 'gtx', 'radeon rx'] },
  high_refresh: { label: 'High-refresh display', synonyms: ['120hz', '144hz', '165hz', '240hz', 'high refresh'] },
  ssd: { label: 'SSD', synonyms: ['ssd', 'solid state'] },
  stylus: { label: 'Stylus support', synonyms: ['stylus', 'pen support', 's pen'] },
  wifi6: { label: 'Wi-Fi 6', synonyms: ['wifi 6', 'wi-fi 6', 'wifi6'] },
  thunderbolt: { label: 'Thunderbolt', synonyms: ['thunderbolt', 'usb4', 'usb 4'] },
}

function synonymsOf(key) {
  const def = featureRegistry[key]
  if (!def) return [key]
  return [...def.synonyms].sort((a, b) => b.length - a.length)
}

function hitsText(text, terms) {
  const value = String(text || '').toLowerCase()
  return terms.some(term => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(value))
}

/** Extract canonical feature keys mentioned in a free-text query. */
export function extractFeatures(text = '') {
  const found = new Set()
  for (const key of Object.keys(featureRegistry)) {
    if (hitsText(text, synonymsOf(key))) found.add(key)
  }
  return [...found]
}

/**
 * Lightweight extractor: scans prose (titles, bullet points) for feature
 * synonyms and returns `{ [key]: true }`. Output is tracked as *inferred* and
 * is never allowed to produce a `confirmed` verdict.
 */
export function inferSpecs(text = '', alreadyVerified = {}) {
  const inferred = {}
  for (const key of Object.keys(featureRegistry)) {
    if (alreadyVerified[key]) continue
    if (hitsText(text, synonymsOf(key))) inferred[key] = true
  }
  return inferred
}

/**
 * Verdict ladder, from most to least trustworthy:
 * - `confirmed`  — structured, verified data says the feature is present
 * - `failed`     — structured, verified data says the feature is absent
 * - `unconfirmed`— inferred from prose/keywords; plausible but not proven
 * - `absent`     — no evidence the feature exists
 */
export function checkFeature(product, featureKey) {
  const verified = product.specs_verified || {}
  const inferred = product.specs_inferred || {}

  if (featureKey in verified) return verified[featureKey] ? 'confirmed' : 'failed'
  if (featureKey in inferred) return inferred[featureKey] ? 'unconfirmed' : 'absent'

  const text = [product.name, product.description, ...(product.specs || [])].filter(Boolean).join(' ')
  return hitsText(text, synonymsOf(featureKey)) ? 'unconfirmed' : 'absent'
}

export function evaluateConstraints(product, featureKeys = [], maxPrice = null) {
  const matchResult = {}
  for (const key of featureKeys) matchResult[key] = checkFeature(product, key)
  if (Number.isFinite(maxPrice)) {
    matchResult.price = product.price != null && product.price <= maxPrice ? 'confirmed' : 'failed'
  }
  return matchResult
}

const weights = { confirmed: 1, unconfirmed: 0.4, absent: -1, failed: -Infinity }

/** Additive score from a verdict map. `failed` hard-excludes via -Infinity. */
export function constraintScore(matchResult = {}) {
  return Object.values(matchResult).reduce((sum, verdict) => sum + (weights[verdict] ?? 0), 0)
}
