import { Bookmark, Sparkles } from 'lucide-react'

export default function Header({ home, favoriteCount, onHome, onShowFavorites }) {
  return (
    <header>
      <a href="/" className="brand" onClick={onHome}>
        <span className="brand-mark">
          <Sparkles size={16} />
        </span>{' '}
        SmartRec
      </a>
      <div className="header-actions">
        {!home && (
          <span className="status catalog">
            <i /> offline catalog
          </span>
        )}
        {favoriteCount > 0 && (
          <button
            className="favorites-chip"
            onClick={onShowFavorites}
            aria-label={`Show ${favoriteCount} saved products`}
          >
            <Bookmark size={15} fill="currentColor" /> {favoriteCount}
          </button>
        )}
      </div>
    </header>
  )
}
