import { GitCompare, SlidersHorizontal } from 'lucide-react'

export default function ResultsToolbar({
  sortBy,
  onChangeSort,
  brands,
  brandFilter,
  onChangeBrand,
  compareCount,
  onCompare,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <SlidersHorizontal size={16} />
        <label className="visually-hidden" htmlFor="brand-filter">
          Filter by brand
        </label>
        <select id="brand-filter" value={brandFilter} onChange={event => onChangeBrand(event.target.value)}>
          <option value="all">All brands</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
        <label className="visually-hidden" htmlFor="sort-by">
          Sort results
        </label>
        <select id="sort-by" value={sortBy} onChange={event => onChangeSort(event.target.value)}>
          <option value="relevance">Best match</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Highest rated</option>
        </select>
      </div>
      {compareCount >= 2 && (
        <button className="compare-cta" onClick={onCompare}>
          <GitCompare size={16} /> Compare ({compareCount})
        </button>
      )}
    </div>
  )
}
