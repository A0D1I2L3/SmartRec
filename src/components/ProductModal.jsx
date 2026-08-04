import { useEffect } from 'react'
import { ArrowUpRight, Bot, Star, X } from 'lucide-react'
import { money } from '../utils/money'

export default function ProductModal({ product, onClose }) {
  useEffect(() => {
    const close = event => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  if (!product) return null
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Close details">
          <X />
        </button>
        {product.image && <img src={product.image} alt={product.name} />}
        <div className="modal-content">
          <p className="eyebrow">
            {product.type} · {product.retailer}
          </p>
          <h2 id="product-title">{product.name}</h2>
          <p className="price">{money(product.price)}</p>
          <div className="spec-list">
            {product.specs.map(spec => (
              <span key={spec}>{spec}</span>
            ))}
            <span>
              <Star size={15} fill="currentColor" /> {product.rating || 'Not listed'} user rating
            </span>
          </div>
          <div className="why">
            <Bot size={18} />
            <div>
              <strong>Why SmartRec picked this</strong>
              <p>{product.reason}</p>
            </div>
          </div>
          <a className="buy" href={product.buyUrl} target="_blank" rel="noreferrer">
            Buy now <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
    </div>
  )
}
