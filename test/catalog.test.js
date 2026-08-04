import { describe, expect, it } from 'vitest'
import { loadCatalog, parseCsv, toPrice, toStarRating } from '../server/catalog.js'
import { checkFeature } from '../server/features.js'

describe('parseCsv', () => {
  it('handles quoted fields with embedded commas and CRLF endings', () => {
    const rows = parseCsv('Name,Display\r\n"HP Laptop","15.6 inches, 1920 x 1080"\r\n"Lenovo","13 inch"\r\n')
    expect(rows).toEqual([
      ['Name', 'Display'],
      ['HP Laptop', '15.6 inches, 1920 x 1080'],
      ['Lenovo', '13 inch'],
    ])
  })

  it('supports escaped quotes inside fields', () => {
    const rows = parseCsv('a,b\n"say ""hi""",x')
    expect(rows[1][0]).toBe('say "hi"')
  })
})

describe('toPrice', () => {
  it('strips currency symbols and separators', () => {
    expect(toPrice('₹50,399')).toBe(50399)
    expect(toPrice('₹1,02,990')).toBe(102990)
    expect(toPrice('')).toBeNull()
    expect(toPrice('N/A')).toBeNull()
  })
})

describe('toStarRating', () => {
  it('converts the 0–100 scale to a 0–5 scale', () => {
    expect(toStarRating('70.0')).toBe(3.5)
    expect(toStarRating('')).toBe(0)
    expect(toStarRating('abc')).toBe(0)
  })
})

describe('loadCatalog', () => {
  it('loads a real catalog with priced products', () => {
    const catalog = loadCatalog()
    expect(catalog.length).toBeGreaterThan(800)
    const first = catalog[0]
    expect(first.type).toBe('laptop')
    expect(first.currency).toBe('INR')
    expect(first.rating).toBeGreaterThanOrEqual(0)
    expect(first.rating).toBeLessThanOrEqual(5)
    expect(first.specs.length).toBeGreaterThan(0)
    expect(first.specs_verified).toBeDefined()
    expect(first.specs_inferred).toBeDefined()
    expect(['verified', 'inferred', 'none']).toContain(first.specs_source)
    expect(first.specDetails).toBeInstanceOf(Object)
  })

  it('derives verified spec flags from the structured columns', () => {
    const catalog = loadCatalog()
    const touch = catalog.find(product => /touch screen/i.test(product.specs.join(' ')))
    expect(touch).toBeTruthy()
    expect(touch.specs_verified.touchscreen).toBe(true)
    expect(checkFeature(touch, 'touchscreen')).toBe('confirmed')
  })
})
