import { Search, Sparkles } from 'lucide-react'

export default function SearchBox({ value, onChange, onSubmit, compact = false }) {
  return (
    <form className={`search-box ${compact ? 'compact' : ''}`} onSubmit={onSubmit}>
      <Search size={compact ? 18 : 21} />
      <input
        autoFocus={!compact}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="Try: Samsung phones under 10k"
        aria-label="Describe the device you need"
      />
      <button aria-label="Find recommendations">
        <Sparkles size={18} />
      </button>
    </form>
  )
}
