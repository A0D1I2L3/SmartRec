import { X } from 'lucide-react'
import ProductCard from './ProductCard'

export default function FavoritesDrawer({ favorites, onClose, onOpen, isFavorite, onToggleFavorite }) {
  if (!favorites.length) return null
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-label="Saved products"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="drawer-head">
          <h2>
            Saved products <span>{favorites.length}</span>
          </h2>
          <button className="close" onClick={onClose} aria-label="Close saved products">
            <X />
          </button>
        </div>
        <div className="drawer-list">
          {favorites.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={onOpen}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={onToggleFavorite}
              onToggleCompare={() => {}}
              comparing={false}
            />
          ))}
        </div>
      </aside>
    </div>
  )
}
