// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CompareModal from '../src/components/CompareModal.jsx'

const catalogProduct = {
  id: 'catalog-0',
  name: 'Gaming Laptop',
  price: 60000,
  rating: 4.5,
  retailer: 'Offline catalog',
  image: '',
  buyUrl: '#',
  specDetails: {
    ram: { label: 'RAM', value: '16 GB DDR5' },
    gpu: { label: 'Graphics', value: 'RTX 4060' },
  },
}

const liveProduct = {
  id: 'live-1',
  name: 'Live Laptop',
  price: 59000,
  rating: 0,
  retailer: 'Flipkart',
  image: '',
  buyUrl: '#',
  specDetails: {},
}

const otherCatalogProduct = {
  ...catalogProduct,
  id: 'catalog-1',
  name: 'Other Laptop',
  price: 62000,
}

describe('CompareModal', () => {
  it('degrades to commerce fields when products share no structured specs', () => {
    render(<CompareModal products={[catalogProduct, liveProduct]} onClose={() => {}} />)
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
    expect(screen.getByText('Retailer')).toBeInTheDocument()
    expect(screen.queryByText('RAM')).not.toBeInTheDocument()
    expect(screen.queryByText('Graphics')).not.toBeInTheDocument()
  })

  it('shows only the intersection of structured spec keys', () => {
    render(<CompareModal products={[catalogProduct, otherCatalogProduct]} onClose={() => {}} />)
    expect(screen.getByText('RAM')).toBeInTheDocument()
    expect(screen.getByText('Graphics')).toBeInTheDocument()
    expect(screen.getAllByText('16 GB DDR5')).toHaveLength(2)
  })
})
