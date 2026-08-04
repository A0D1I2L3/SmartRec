import { config } from './config.js'
import { classify } from './query.js'

function priceOf(result) {
  const raw = result.extracted_price ?? result.price ?? ''
  if (typeof raw === 'number') return Math.round(raw)
  const digits = String(raw).replace(/[^\d.]/g, '')
  return digits ? Math.round(Number(digits)) : null
}

export function normalizeLiveResult(result, parsed, index) {
  const name = result.title || result.name || 'Unknown product'
  const price = priceOf(result)
  const specs = [result.snippet, result.extensions?.join(' · '), result.delivery].filter(Boolean)
  const product = {
    id: result.product_id || result.position || `live-${index}`,
    name,
    brand: name.split(' ')[0],
    type: classify(name),
    price,
    currency: 'INR',
    rating: Number(result.rating || 0),
    image: result.thumbnail || result.image || '',
    retailer: result.source || result.merchant || 'Retailer',
    buyUrl: result.product_link || result.link || '#',
    specs: specs.length ? specs : ['Live listing details available at retailer'],
    // Live listings are prose, not structured specs — never eligible for `confirmed`.
    specs_verified: {},
    specs_inferred: {},
    specs_source: 'none',
    specDetails: {},
    source: 'live',
  }
  return product
}

export async function searchShopping(query) {
  const url = new URL('https://serpapi.com/search.json')
  url.search = new URLSearchParams({
    engine: 'google_shopping',
    q: `${query} India`,
    gl: 'in',
    hl: 'en',
    api_key: config.serpApiKey,
  }).toString()

  const upstream = await fetch(url, { signal: AbortSignal.timeout(config.serpApiTimeoutMs) })
  if (!upstream.ok) throw new Error(`Provider returned ${upstream.status}`)
  const payload = await upstream.json()
  if (payload.error) throw new Error(payload.error)
  return payload.shopping_results || []
}
