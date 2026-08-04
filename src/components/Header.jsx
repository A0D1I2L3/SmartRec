import { Bookmark, Sparkles } from 'lucide-react'

function modeLabel(state) {
  if (state.mode === 'live') return { text: 'live India listings', tone: 'live' }
  if (state.mode === 'catalog' && state.quota?.exhausted)
    return { text: 'offline catalog · quota reached', tone: 'catalog' }
  if (state.mode === 'catalog' && state.quota?.unconfigured) return { text: 'offline catalog', tone: 'catalog' }
  if (state.fallback) return { text: 'catalog fallback', tone: 'catalog' }
  return { text: 'offline catalog', tone: 'catalog' }
}

export default function Header({ home, state, favoriteCount, onHome, onShowFavorites }) {
  const label = modeLabel(state)
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
          <span className={`status ${label.tone}`}>
            <i /> {label.text}
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
