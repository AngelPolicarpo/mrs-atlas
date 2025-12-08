import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook genérico para buscas assíncronas com debounce usadas em autocompletes.
 */
function useAutocomplete(fetchFn, options = {}) {
  const { minLength = 2, delay = 300 } = options
  const [suggestions, setSuggestions] = useState([])
  const debounceRef = useRef(null)

  const search = useCallback((searchText) => {
    if (!searchText || searchText.length < minLength) {
      setSuggestions([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetchFn(searchText)
        const data = response?.data?.results ?? response?.data ?? []
        setSuggestions(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error)
      }
    }, delay)
  }, [delay, fetchFn, minLength])

  const clear = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    setSuggestions([])
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  return { suggestions, search, clear }
}

export default useAutocomplete
