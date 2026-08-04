import { ArrowUpRight, Star, X } from 'lucide-react'
import { money } from '../utils/money'

/**
 * Derive comparison columns fresh per request: fixed commerce fields plus the
 * intersection of structured spec keys across the selected products. Products
 * without structured specs (e.g. live listings) degrade gracefully to the
 * commerce fields only.
 */
function deriveComparisonSchema(products) {
  const keySets = products.map(product => Object.keys(product.specDetails || {}))
  const common = keySets.length ? keySets.reduce((a, b) => a.filter(key => b.includes(key))) : []
  return ['price', 'rating', 'retailer', ...common]
}

const rowLabel = (row, product) =>
  row === 'price' ? 'Price' : row === 'rating' ? 'Rating' : row === 'retailer' ? 'Retailer' : product.specDetails[row]?.label || row

export default function CompareModal({ products, onClose }) {
  if (!products.length) return null
  const rows = deriveComparisonSchema(products)
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="modal compare"
        role="dialog"
        aria-modal="true"
        aria-label="Compare products"
        onMouseDown={event => event.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Close comparison">
          <X />
        </button>
        <div className="compare-table">
          <div className="compare-row head">
            <div className="cell label" />
            {products.map(product => (
              <div className="cell" key={product.id}>
                {product.image ? <img src={product.image} alt="" /> : null}
                <strong>{product.name}</strong>
                <p>{money(product.price)}</p>
              </div>
            ))}
          </div>
          {rows.map(row => (
            <div className="compare-row" key={row}>
              <div className="cell label">{rowLabel(row, products[0])}</div>
              {products.map(product => (
                <div className="cell" key={`${product.id}-${row}`}>
                  {row === 'price' ? (
                    money(product.price)
                  ) : row === 'rating' ? (
                    <span>
                      <Star size={13} fill="currentColor" /> {product.rating || 'Not listed'}
                    </span>
                  ) : row === 'retailer' ? (
                    product.retailer
                  ) : (
                    product.specDetails[row]?.value || '—'
                  )}
                </div>
              ))}
            </div>
          ))}
          <div className="compare-row">
            <div className="cell label" />
            {products.map(product => (
              <div className="cell" key={`${product.id}-buy`}>
                <a className="buy" href={product.buyUrl} target="_blank" rel="noreferrer">
                  Buy now <ArrowUpRight size={16} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
