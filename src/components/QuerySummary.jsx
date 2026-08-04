import { Bot } from 'lucide-react'

export default function QuerySummary({ loading, error, products, submitted, mode }) {
  let text
  const source = mode === 'live' ? 'live' : 'catalog'
  if (loading) text = `Searching ${source} India listings for “${submitted}”…`
  else if (error) text = error
  else if (products.length) text = `Found ${products.length} ${source} matches for “${submitted}”.`
  else text = `No catalog items meet “${submitted}”.`
  return (
    <div className="query-summary">
      <Bot size={19} />
      <p>
        <strong>AI read:</strong> {text}
      </p>
    </div>
  )
}
