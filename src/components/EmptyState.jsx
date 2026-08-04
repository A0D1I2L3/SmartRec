import { Bookmark, Search, Sparkles } from 'lucide-react'

export default function EmptyState({ loading, error, hasFavorites, onShowFavorites }) {
  if (loading) {
    return (
      <div className="empty">
        <Sparkles />
        <h2>Finding live products</h2>
        <p>Ranking India listings against your budget and needs…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="empty">
        <Search />
        <h2>Live search unavailable</h2>
        <p>{error} SmartRec is running its offline catalog instead.</p>
      </div>
    )
  }
  return (
    <div className="empty">
      <Sparkles />
      <h2>No exact match yet</h2>
      <p>Your budget and filters apply strictly. Try a higher budget or a different brand.</p>
      {hasFavorites && (
        <button className="compare-cta" onClick={onShowFavorites}>
          <Bookmark size={16} /> View {hasFavorites} saved products
        </button>
      )}
    </div>
  )
}
