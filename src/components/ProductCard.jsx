import { Bookmark, Sparkles, Star } from 'lucide-react'
import { money } from '../utils/money'
import { featureLabel } from '../utils/featureLabels'

const statusIcon = { confirmed: '✓', unconfirmed: '?', absent: '—' }

export default function ProductCard({ product, onOpen, isFavorite, onToggleFavorite, onToggleCompare, comparing }) {
  const matchBadges =
    product.matchResult &&
    Object.entries(product.matchResult)
      .filter(([key]) => key !== 'price')
      .map(([key, status]) => ({ key, status, label: featureLabel(key) }))
  return (
    <button className="card" onClick={() => onOpen(product)} aria-label={`View details for ${product.name}`}>
      <div className="image-wrap">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="image-fallback">
            <Sparkles />
          </div>
        )}
        <span className="type-badge">{product.type}</span>
        <button
          className={`fav ${isFavorite ? 'active' : ''}`}
          onClick={event => {
            event.stopPropagation()
            onToggleFavorite(product)
          }}
          aria-label={isFavorite ? 'Remove from saved' : 'Save product'}
        >
          <Bookmark size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          className={`compare-toggle ${comparing ? 'active' : ''}`}
          onClick={event => {
            event.stopPropagation()
            onToggleCompare(product)
          }}
          aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
          aria-pressed={comparing}
        >
          {comparing ? '✓' : '+'}
        </button>
      </div>
      <div className="card-content">
        <div className="card-heading">
          <h3>{product.name}</h3>
          <p>{money(product.price)}</p>
        </div>
        <div className="rating">
          <Star size={14} fill="currentColor" /> {product.rating || 'Not listed'} · {product.retailer}
        </div>
        <div className="badges">
          {product.specs.slice(0, 2).map(spec => (
            <span key={spec}>{spec}</span>
          ))}
        </div>
        {matchBadges?.length ? (
          <div className="match-badges" aria-label="Feature match confidence">
            {matchBadges.map(({ key, status, label }) => (
              <span key={key} className={`match-badge ${status}`} title={status}>
                {statusIcon[status]} {label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="card-why">
          <Sparkles size={15} />
          <span>{product.reason}</span>
        </div>
      </div>
    </button>
  )
}
