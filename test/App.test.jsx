// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App.jsx'
import { findProducts } from '../src/data.js'

vi.mock('../src/data.js', () => ({ findProducts: vi.fn() }))

function createStorage() {
  const store = new Map()
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear(),
    key: index => [...store.keys()][index] ?? null,
    get length() {
      return store.size
    },
  }
}

const payload = {
  products: [
    {
      id: 'live-1',
      name: 'Samsung Galaxy M14',
      brand: 'Samsung',
      type: 'phone',
      price: 9499,
      currency: 'INR',
      rating: 4.2,
      image: '',
      retailer: 'Flipkart',
      buyUrl: '#',
      specs: ['6000mAh battery'],
      reason: 'Great battery for long days.',
      source: 'live',
    },
  ],
  parsed: { type: 'phone', maxPrice: 10000, intent: [], brand: 'samsung' },
  fetchedAt: '2026-08-03T12:00:00Z',
  mode: 'catalog',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('localStorage', createStorage())
})

describe('App', () => {
  it('renders the landing hero', () => {
    render(<App />)
    expect(screen.getByText('Find tech that fits')).toBeInTheDocument()
  })

  it('renders product cards after a search', async () => {
    findProducts.mockResolvedValue(payload)
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Describe the device you need'), 'samsung phones under 10k')
    await user.click(screen.getByLabelText('Find recommendations'))

    expect(await screen.findByText('Samsung Galaxy M14')).toBeInTheDocument()
    expect(screen.getByText(/Found 1 catalog matches/)).toBeInTheDocument()
  })

  it('saves a product to favorites and shows the saved chip', async () => {
    findProducts.mockResolvedValue(payload)
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Describe the device you need'), 'samsung phones under 10k')
    await user.click(screen.getByLabelText('Find recommendations'))

    const saveButton = await screen.findByLabelText('Save product')
    await user.click(saveButton)
    expect(screen.getByLabelText('Show 1 saved products')).toBeInTheDocument()
  })

  it('shows an empty state when there are no matches', async () => {
    findProducts.mockResolvedValue({ ...payload, products: [] })
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Describe the device you need'), 'alien phones')
    await user.click(screen.getByLabelText('Find recommendations'))

    expect(await screen.findByText('No exact match yet')).toBeInTheDocument()
  })
})
