import { useMemo, useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import SearchBox from './components/SearchBox'
import QuerySummary from './components/QuerySummary'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import CompareModal from './components/CompareModal'
import FavoritesDrawer from './components/FavoritesDrawer'
import ResultsToolbar from './components/ResultsToolbar'
import EmptyState from './components/EmptyState'
import { useProducts } from './hooks/useProducts'
import { useFavorites } from './hooks/useFavorites'

export default function App() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [selected, setSelected] = useState(null)
  const [compare, setCompare] = useState([])
  const [showCompare, setShowCompare] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [sortBy, setSortBy] = useState('relevance')
  const [brandFilter, setBrandFilter] = useState('all')

  const state = useProducts(submitted)
  const { favorites, toggleFavorite, isFavorite } = useFavorites()

  const brands = useMemo(
    () => [...new Set(state.products.map(product => product.brand).filter(Boolean))].sort(),
    [state.products],
  )

  const products = useMemo(() => {
    let list = state.products
    if (brandFilter !== 'all') list = list.filter(product => product.brand === brandFilter)
    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    if (sortBy === 'rating') return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return list
  }, [state.products, brandFilter, sortBy])

  const toggleCompare = product =>
    setCompare(list =>
      list.some(item => item.id === product.id) ? list.filter(item => item.id !== product.id) : [...list, product],
    )

  // Preserve the search result rank instead of click order so the comparison
  // reads in a deterministic, relevance-first order.
  const sortedCompare = useMemo(() => {
    const rank = new Map(state.products.map((product, index) => [product.id, index]))
    return [...compare].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
  }, [compare, state.products])

  const home = !submitted

  const submit = event => {
    event.preventDefault()
    if (query.trim()) {
      setSubmitted(query.trim())
      setBrandFilter('all')
    }
  }

  const goHome = event => {
    event.preventDefault()
    setSubmitted('')
    setQuery('')
    setBrandFilter('all')
  }

  return (
    <main className={home ? 'home' : 'results'}>
      <Header
        home={home}
        state={state}
        favoriteCount={favorites.length}
        onHome={goHome}
        onShowFavorites={() => setShowFavorites(true)}
      />

      {home ? (
        <Hero value={query} onChange={setQuery} onSubmit={submit} />
      ) : (
        <section className="results-shell">
          <div className="results-top">
            <div>
              <p className="eyebrow">SmartRec search</p>
              <h1>
                Best matches, <em>decoded.</em>
              </h1>
            </div>
            <SearchBox compact value={query} onChange={setQuery} onSubmit={submit} />
          </div>

          <QuerySummary
            loading={state.loading}
            error={state.error}
            products={state.products}
            submitted={submitted}
            mode={state.mode}
          />

          {state.loading ? (
            <EmptyState loading />
          ) : state.products.length ? (
            <>
              <ResultsToolbar
                sortBy={sortBy}
                onChangeSort={setSortBy}
                brands={brands}
                brandFilter={brandFilter}
                onChangeBrand={setBrandFilter}
                compareCount={compare.length}
                onCompare={() => setShowCompare(true)}
              />
              <div className="grid">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={setSelected}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={toggleFavorite}
                    onToggleCompare={toggleCompare}
                    comparing={compare.some(item => item.id === product.id)}
                  />
                ))}
              </div>
              <p className="source-note">
                {state.mode === 'live' ? 'Live results' : 'Catalog results'} ·{' '}
                {state.fetchedAt && new Date(state.fetchedAt).toLocaleString('en-IN')}
              </p>
            </>
          ) : (
            <EmptyState
              error={state.error}
              hasFavorites={favorites.length}
              onShowFavorites={() => setShowFavorites(true)}
            />
          )}
        </section>
      )}

      <ProductModal product={selected} onClose={() => setSelected(null)} />
      {showCompare && <CompareModal products={sortedCompare} onClose={() => setShowCompare(false)} />}
      {showFavorites && (
        <FavoritesDrawer
          favorites={favorites}
          onClose={() => setShowFavorites(false)}
          onOpen={setSelected}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </main>
  )
}
