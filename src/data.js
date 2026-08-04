export async function findProducts(query, signal) {
  const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`, { signal })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Live product search is unavailable.')
  return payload
}
