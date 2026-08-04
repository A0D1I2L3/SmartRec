const intentProfiles = {
  coding: {
    blurb: 'Its RAM and processor are a strong fit for development tools and multitasking.',
    checks: [
      { re: /\b(16|24|32)\s*gb/i, weight: 3, label: 'RAM' },
      { re: /\bi[5-9]\b|ryzen\s*[5-9]|\bm[1-4]\b|\bsnapdragon\b/i, weight: 2, label: 'processor' },
      { re: /\bi7|ryzen\s*7|\bm[3-4]\b/i, weight: 1, label: 'high-end CPU' },
      { re: /\b512\s*gb|1\s*tb|\bssd\b/i, weight: 1, label: 'storage' },
      { re: /\bi3\b|ryzen\s*3|celeron|pentium/i, weight: -1, label: 'entry-level CPU' },
    ],
  },
  gaming: {
    blurb: 'Its graphics and display features are built for smooth gaming.',
    checks: [
      { re: /\brtx\b|radeon\s*rx|\bgtx\b|graphics/i, weight: 3, label: 'dedicated GPU' },
      { re: /\b(?:4|6|8)\s*gb\b(?:\s*(?:gddr|graphics))?/i, weight: 2, label: 'video memory' },
      { re: /(?:120|144|165|240)\s*hz/i, weight: 2, label: 'high-refresh display' },
      { re: /\b(16|32)\s*gb\b/i, weight: 1, label: 'RAM' },
    ],
  },
  photography: {
    blurb: 'Its camera hardware is well suited to your photography query.',
    checks: [
      { re: /(?:200|108|64|50|48)\s*mp/i, weight: 3, label: 'camera sensor' },
      { re: /\b(ois|periscope|ultra|wide|4k\s*video)\b/i, weight: 2, label: 'camera features' },
      { re: /(?:dual|triple|quad)\s*camera/i, weight: 1, label: 'multi-camera' },
    ],
  },
  teaching: {
    blurb: 'Its battery and video-call friendly hardware suit teaching and online classes.',
    checks: [
      { re: /\b(webcam|front\s*camera|camera|zoom)\b/i, weight: 2, label: 'video calling' },
      { re: /\b(battery|mah)\b/i, weight: 2, label: 'battery' },
    ],
  },
  battery: {
    blurb: 'Its battery capacity and charging keep you going through the day.',
    checks: [
      { re: /(\d{4,5})\s*mah/i, weight: 1, label: 'mAh battery' },
      { re: /\b(?:60|67|80|90|120|150)\s*w\b/i, weight: 1, label: 'fast charging' },
    ],
  },
  student: {
    blurb: 'It balances price, performance, and portability for everyday study.',
    checks: [
      { re: /\b(8|16)\s*gb\b/i, weight: 1, label: 'RAM' },
      { re: /\bi[3-5]\b|ryzen\s*[3-5]|\bm[1-3]\b/i, weight: 1, label: 'balanced processor' },
      { re: /\b512\s*gb|1\s*tb\b/i, weight: 1, label: 'storage' },
    ],
  },
  travel: {
    blurb: 'Its slim, portable build makes it easy to carry anywhere.',
    checks: [
      { re: /\b(light|lightweight|slim|portable|ultrabook)\b/i, weight: 2, label: 'portability' },
      { re: /\b(battery|mah)\b/i, weight: 1, label: 'battery' },
    ],
  },
}

const DEFAULT_INTENT = 'student'

function featuresText(product) {
  return [
    product.name,
    ...(product.specs || []),
    product.ram,
    product.cpu,
    product.gpu,
    product.display,
    product.battery,
    product.camera,
  ]
    .filter(Boolean)
    .join(' ')
}

/** Continuous bonus for battery capacity so "long lasting" scales with mAh. */
function batteryScore(text) {
  const match = text.match(/(\d{4,5})\s*mah/i)
  if (!match) return 0
  const mah = Number(match[1])
  return mah >= 6000 ? 5 : mah >= 5000 ? 4 : mah >= 4000 ? 3 : 1
}

export function scoreProduct(product, parsed) {
  const text = featuresText(product)
  const intents = parsed.intent?.length ? parsed.intent : [DEFAULT_INTENT]
  let score = 0
  const hits = []

  for (const intent of intents) {
    const profile = intentProfiles[intent]
    if (!profile) continue
    for (const check of profile.checks) {
      if (!check.re.test(text)) continue
      if (intent === 'battery' && check.label === 'mAh battery') {
        score += batteryScore(text)
      } else {
        score += check.weight
      }
      hits.push(check.label)
    }
  }

  if (product.rating) score += Math.max(0, product.rating - 3.5) * 2
  return { score, hits: [...new Set(hits)] }
}

export function reasonFor(product, parsed) {
  const { hits, score } = scoreProduct(product, parsed)
  if (score > 0 && hits.length) {
    const intents = parsed.intent?.length ? parsed.intent : [DEFAULT_INTENT]
    const primary = intents.find(intent => intentProfiles[intent]) || DEFAULT_INTENT
    return `${intentProfiles[primary].blurb} ${hits.slice(0, 3).join(' · ')}`
  }
  return 'Matches your requested device, brand, and budget filters.'
}

export function sortProducts(products, parsed, extraScore = () => 0) {
  return products
    .map(product => ({ product, ...scoreProduct(product, parsed), extra: extraScore(product) }))
    .sort(
      (a, b) =>
        b.score + b.extra - (a.score + a.extra) ||
        (b.product.rating || 0) - (a.product.rating || 0) ||
        a.product.price - b.product.price,
    )
    .map(({ product }) => product)
}
