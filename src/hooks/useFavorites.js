import { useEffect, useState } from 'react'

const STORAGE_KEY = 'smartrec:favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // storage unavailable — favorites just won't persist
    }
  }, [favorites])

  const toggleFavorite = product =>
    setFavorites(list =>
      list.some(item => item.id === product.id) ? list.filter(item => item.id !== product.id) : [...list, product],
    )

  const isFavorite = id => favorites.some(item => item.id === id)

  return { favorites, toggleFavorite, isFavorite }
}
