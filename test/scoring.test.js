import { describe, expect, it } from 'vitest'
import { reasonFor, scoreProduct, sortProducts } from '../server/scoring.js'

const base = { parsed: { intent: [], maxPrice: null, softBudget: false, type: null, brand: null } }

describe('scoreProduct', () => {
  it('scores coding laptops higher with more RAM and a strong CPU', () => {
    const parsed = { ...base.parsed, intent: ['coding'] }
    const light = scoreProduct(
      { name: 'HP Laptop', type: 'laptop', price: 25000, rating: 0, specs: ['8GB RAM', 'Core i3', '256GB SSD'] },
      parsed,
    )
    const strong = scoreProduct(
      {
        name: 'Lenovo Laptop',
        type: 'laptop',
        price: 55000,
        rating: 0,
        specs: ['16GB RAM', 'Intel Core i7', '512GB SSD'],
      },
      parsed,
    )
    expect(strong.score).toBeGreaterThan(light.score)
  })

  it('scores gaming laptops for dedicated GPUs', () => {
    const parsed = { ...base.parsed, intent: ['gaming'] }
    const gaming = scoreProduct(
      { name: 'Victus Laptop', type: 'laptop', price: 60000, rating: 0, specs: ['RTX 3050', '144Hz'] },
      parsed,
    )
    const office = scoreProduct(
      { name: 'Office Laptop', type: 'laptop', price: 60000, rating: 0, specs: ['Intel UHD Graphics'] },
      parsed,
    )
    expect(gaming.score).toBeGreaterThan(office.score)
  })

  it('scales battery score with capacity', () => {
    const parsed = { ...base.parsed, intent: ['battery'] }
    const big = scoreProduct(
      { name: 'Phone', type: 'phone', price: 15000, rating: 0, specs: ['6000mAh battery'] },
      parsed,
    )
    const small = scoreProduct(
      { name: 'Phone', type: 'phone', price: 15000, rating: 0, specs: ['3500mAh battery'] },
      parsed,
    )
    expect(big.score).toBeGreaterThan(small.score)
  })

  it('falls back to a generic student intent when no intent is given', () => {
    const result = scoreProduct(
      { name: 'Laptop', type: 'laptop', price: 30000, rating: 0, specs: ['8GB RAM', 'Core i5'] },
      base.parsed,
    )
    expect(result.score).toBeGreaterThan(0)
  })
})

describe('reasonFor', () => {
  it('explains matched intent features', () => {
    const parsed = { ...base.parsed, intent: ['coding'] }
    const reason = reasonFor(
      { name: 'Dell Laptop', type: 'laptop', price: 50000, rating: 0, specs: ['16GB RAM', 'Core i7'] },
      parsed,
    )
    expect(reason).toMatch(/RAM|processor/i)
  })

  it('gives a fallback explanation when nothing matches', () => {
    const reason = reasonFor({ name: 'Widget', type: 'phone', price: 5000, rating: 0, specs: [] }, base.parsed)
    expect(reason).toContain('budget')
  })
})

describe('sortProducts', () => {
  it('ranks higher-scoring products first', () => {
    const parsed = { ...base.parsed, intent: ['coding'] }
    const good = { name: 'Good', type: 'laptop', price: 50000, rating: 0, specs: ['16GB RAM', 'Core i7'] }
    const basic = { name: 'Basic', type: 'laptop', price: 25000, rating: 0, specs: ['4GB RAM', 'Celeron'] }
    const sorted = sortProducts([basic, good], parsed)
    expect(sorted[0]).toBe(good)
  })
})
