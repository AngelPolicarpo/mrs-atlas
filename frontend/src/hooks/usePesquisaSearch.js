import { useState, useCallback, useRef, useEffect } from 'react'
import { pesquisaUnificada } from '../services/titulares'

/**
 * Hook para gerenciar busca, resultados e expansões
 * Responsabilidades:
 * - Realizar buscas na API
 * - Gerenciar estado de resultados
 * - Gerenciar expansão de itens
 * - Debounce para buscas
 */
function usePesquisaSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})
  const debounceRef = useRef(null)

  // Executar busca com parâmetros
  const search = useCallback(async (params, page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const searchParams = {
        page,
        page_size: pageSize,
        ...params,
      }

      const response = await pesquisaUnificada(searchParams)
      const data = response.data

      setResults(data.results || [])
      setExpandedItems({})

      return {
        results: data.results || [],
        pagination: {
          page: data.page,
          totalPages: data.total_pages,
          totalCount: data.count,
          hasNext: data.has_next,
          hasPrevious: data.has_previous,
        },
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      setResults([])
      return {
        results: [],
        pagination: {
          page: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrevious: false,
        },
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleExpand = useCallback((id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setExpandedItems({})
  }, [])

  // Cleanup debounce ao desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    results,
    loading,
    expandedItems,
    search,
    toggleExpand,
    clearResults,
  }
}

export default usePesquisaSearch
