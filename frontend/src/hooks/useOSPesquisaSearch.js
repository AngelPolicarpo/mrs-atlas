import { useState, useCallback, useRef, useEffect } from 'react'
import { getOrdensServico } from '../services/ordemServico'

/**
 * Hook para gerenciar busca, resultados e expansões de OS
 * Responsabilidades:
 * - Realizar buscas na API de OS
 * - Gerenciar estado de resultados
 * - Gerenciar expansão de itens para ver detalhes
 */
function useOSPesquisaSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})
  const debounceRef = useRef(null)

  // Executar busca com parâmetros
  const search = useCallback(async (params, page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const searchParams = {
        page,
        page_size: pageSize,
        ...params,
      }

      const response = await getOrdensServico(searchParams)
      const data = response.data

      setResults(data.results || [])
      setExpandedItems({})

      const paginationData = {
        page: data.page || page,
        totalPages: data.total_pages || Math.ceil((data.count || 0) / pageSize),
        totalCount: data.count || 0,
        hasNext: !!data.next,
        hasPrevious: !!data.previous,
      }

      return {
        results: data.results || [],
        pagination: paginationData,
      }
    } catch (error) {
      console.error('Erro na busca de OS:', error)
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

export default useOSPesquisaSearch
