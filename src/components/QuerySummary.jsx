import { Bot } from 'lucide-react'

export default function QuerySummary({ loading, error, products, submitted }) {
  let text
  if (loading) text = `Searching the catalog for "${submitted}"…`
  else if (error) text = error
  else if (products.length) text = `Found ${products.length} catalog matches for "${submitted}".`
  else text = `No catalog items meet "${submitted}".`
  return (
    <div className="query-summary">
      <Bot size={19} />
      <p>
        <strong>AI read:</strong> {text}
      </p>
    </div>
  )
}
