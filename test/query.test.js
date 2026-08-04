import { describe, expect, it } from 'vitest'
import { classify, matchProduct, parseQuery } from '../server/query.js'

const samsung = { name: 'Samsung Galaxy M14 phone', type: 'phone', price: 9499, specs: ['6000mAh battery'] }
const xiaomiTablet = { name: 'Xiaomi Pad 6 tablet', type: 'tablet', price: 26999, specs: ['8GB RAM'] }
const laptop = { name: 'Lenovo laptop', type: 'laptop', price: 38999, specs: ['16GB RAM Ryzen 5'] }

describe('parseQuery', () => {
  it('parses strict no-space budget and brand', () => {
    const parsed = parseQuery('samsung phones under10k')
    expect(parsed.type).toBe('phone')
    expect(parsed.maxPrice).toBe(10000)
    expect(parsed.brand).toBe('samsung')
    expect(matchProduct(samsung, parsed)).toBe(true)
  })

  it('parses brand and tablet type', () => {
    const parsed = parseQuery('xiaomi tablets for me')
    expect(parsed.type).toBe('tablet')
    expect(parsed.brand).toBe('xiaomi')
    expect(matchProduct(xiaomiTablet, parsed)).toBe(true)
  })

  it('keeps coding laptop under 40k', () => {
    const parsed = parseQuery('laptop for coding under 40k')
    expect(parsed.maxPrice).toBe(40000)
    expect(parsed.intent).toContain('coding')
    expect(matchProduct(laptop, parsed)).toBe(true)
  })

  it('supports lakh amounts', () => {
    const parsed = parseQuery('apple laptop under 1 lakh')
    expect(parsed.maxPrice).toBe(100000)
    expect(parsed.brand).toBe('apple')
  })

  it('supports rupee-symbol amounts', () => {
    const parsed = parseQuery('₹45,000 gaming laptop')
    expect(parsed.maxPrice).toBe(45000)
    expect(parsed.intent).toContain('gaming')
  })

  it('marks "around" budgets as soft but still enforces the ceiling strictly', () => {
    const parsed = parseQuery('laptop around 40k')
    expect(parsed.maxPrice).toBe(40000)
    expect(parsed.softBudget).toBe(true)
    expect(matchProduct({ name: 'Laptop', type: 'laptop', price: 39000, specs: [] }, parsed)).toBe(true)
    expect(matchProduct({ name: 'Laptop', type: 'laptop', price: 43000, specs: [] }, parsed)).toBe(false)
    expect(matchProduct({ name: 'Laptop', type: 'laptop', price: 50000, specs: [] }, parsed)).toBe(false)
  })

  it('detects multiple intents', () => {
    const parsed = parseQuery('gaming laptop for programming students')
    expect(parsed.intent).toEqual(expect.arrayContaining(['gaming', 'coding', 'student']))
  })

  it('normalizes search text by stripping budget phrases and stopwords', () => {
    const parsed = parseQuery('best laptop for me under 40k')
    expect(parsed.search).toBe('laptop')
  })

  it('rejects out-of-budget products', () => {
    const parsed = parseQuery('samsung phones under10k')
    expect(matchProduct({ name: 'Samsung S24', type: 'phone', price: 70000, specs: [] }, parsed)).toBe(false)
  })

  it('rejects wrong brand', () => {
    const parsed = parseQuery('samsung phones under10k')
    expect(matchProduct({ name: 'Xiaomi Redmi phone', type: 'phone', price: 9000, specs: [] }, parsed)).toBe(false)
  })

  it('extracts requested features into canonical keys', () => {
    const parsed = parseQuery('rgb gaming controller under 1200')
    expect(parsed.features).toContain('rgb')
    expect(parsed.maxPrice).toBe(1200)
  })

  it('rejects wrong device type', () => {
    const parsed = parseQuery('samsung phones under10k')
    expect(matchProduct({ name: 'Samsung TV', type: 'laptop', price: 9000, specs: [] }, parsed)).toBe(false)
  })

  it('classifies products from titles', () => {
    expect(classify('Apple iPad Pro 11')).toBe('tablet')
    expect(classify('Dell Inspiron 15 laptop')).toBe('laptop')
    expect(classify('Samsung Galaxy M14')).toBe('phone')
  })
})
