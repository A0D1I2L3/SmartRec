import { describe, expect, it } from 'vitest'
import {
  checkFeature,
  constraintScore,
  evaluateConstraints,
  extractFeatures,
  inferSpecs,
} from '../server/features.js'

describe('extractFeatures', () => {
  it('maps query tokens to canonical feature keys', () => {
    expect(extractFeatures('rgb controller')).toContain('rgb')
    expect(extractFeatures('touch screen laptop')).toContain('touchscreen')
    expect(extractFeatures('gaming laptop under 1 lakh')).toEqual([])
  })

  it('matches multi-word synonyms', () => {
    expect(extractFeatures('backlit keyboard')).toContain('backlit')
  })
})

describe('checkFeature', () => {
  const base = { name: 'Controller', specs: [] }

  it('confirms features present in verified specs', () => {
    expect(checkFeature({ ...base, specs_verified: { rgb: true } }, 'rgb')).toBe('confirmed')
  })

  it('fails features absent from verified specs', () => {
    expect(checkFeature({ ...base, specs_verified: { rgb: false } }, 'rgb')).toBe('failed')
  })

  it('caps inferred specs at unconfirmed even on a hit', () => {
    expect(checkFeature({ ...base, specs_inferred: { rgb: true } }, 'rgb')).toBe('unconfirmed')
  })

  it('reports unconfirmed when only prose mentions the feature', () => {
    expect(checkFeature({ ...base, name: 'RGB gaming controller' }, 'rgb')).toBe('unconfirmed')
  })

  it('reports absent when there is no evidence', () => {
    expect(checkFeature(base, 'rgb')).toBe('absent')
  })

  it('prefers verified over inferred over prose', () => {
    const product = { ...base, name: 'RGB controller', specs_verified: { rgb: false }, specs_inferred: { rgb: true } }
    expect(checkFeature(product, 'rgb')).toBe('failed')
  })
})

describe('inferSpecs', () => {
  it('extracts features from prose text only', () => {
    expect(inferSpecs('RGB backlit keyboard')).toEqual({ rgb: true, backlit: true })
  })

  it('does not overwrite verified entries', () => {
    expect(inferSpecs('touch screen RGB', { touchscreen: true })).toEqual({ rgb: true })
  })
})

describe('evaluateConstraints', () => {
  it('flags over-budget products as failed', () => {
    const result = evaluateConstraints({ name: 'X', specs: [] }, ['rgb'], 1200)
    expect(result.price).toBe('failed')
    expect(result.rgb).toBe('absent')
  })

  it('skips price when no budget is given', () => {
    const result = evaluateConstraints({ name: 'X', specs: [] }, ['rgb'], null)
    expect(result.price).toBeUndefined()
  })
})

describe('constraintScore', () => {
  it('weights confirmed above unconfirmed above absent', () => {
    const confirmed = constraintScore({ rgb: 'confirmed', price: 'confirmed' })
    const unconfirmed = constraintScore({ rgb: 'unconfirmed', price: 'confirmed' })
    const absent = constraintScore({ rgb: 'absent', price: 'confirmed' })
    expect(confirmed).toBeGreaterThan(unconfirmed)
    expect(unconfirmed).toBeGreaterThan(absent)
  })

  it('hard-excludes failed constraints', () => {
    expect(constraintScore({ rgb: 'failed' })).toBe(-Infinity)
  })
})
