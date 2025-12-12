import { useCallback, useState } from 'react'
import { useDebouncedCallback } from './useDebounce'

/**
 * Hook genérico para buscas assíncronas com debounce usadas em autocompletes.
 * 
 * Refatorado para utilizar o hook useDebounce centralizado,
 * seguindo o princípio DRY (Don't Repeat Yourself) e SOLID.
 */
function useAutoComplete(fetchFn, options = {}) {
  const { minLength = 2, delay = 300 } = options
  const [suggestions, setSuggestions] = useState([])

  // Função de busca com debounce usando o hook centralizado
  const debouncedFetch = useDebouncedCallback(async (searchText) => {
    try {
      const response = await fetchFn(searchText)
      const data = response?.data?.results ?? response?.data ?? []
      setSuggestions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error)
      setSuggestions([])
    }
  }, delay, [fetchFn])

  const search = useCallback((searchText) => {
    if (!searchText || searchText.length < minLength) {
      setSuggestions([])
      return
    }
    debouncedFetch(searchText)
  }, [minLength, debouncedFetch])

  const clear = useCallback(() => {
    setSuggestions([])
  }, [])

  return { suggestions, search, clear }
}

export default useAutoComplete
