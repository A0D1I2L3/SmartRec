import { useEffect, useState } from 'react'
import { findProducts } from '../data'

const initialState = {
  query: null,
  products: [],
  error: '',
  fetchedAt: '',
  parsed: null,
}

export function useProducts(query) {
  const [result, setResult] = useState(initialState)

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    findProducts(query, controller.signal)
      .then(payload =>
        setResult({
          query,
          products: payload.products,
          error: '',
          fetchedAt: payload.fetchedAt,
          parsed: payload.parsed,
        }),
      )
      .catch(error => {
        if (error.name !== 'AbortError')
          setResult(current => ({ ...current, query, error: error.message, products: [] }))
      })
    return () => controller.abort()
  }, [query])

  const loading = Boolean(query) && result.query !== query
  return { ...result, loading }
}
