import { useState, useEffect, useCallback } from 'react'
import { getTitulares, deleteTitular } from '../services/titulares'
import { useDebounce } from './useDebounce'
import usePagination from './usePagination'

/**
 * Hook gerencia toda a lógica da lista de Titulares
 * Responsabilidades:
 * - Carregar lista de titulares (com busca e paginação)
 * - Deletar titular
 * - Gerenciar estado de carregamento e erros
 */
function useTitularList() {
  const [titulares, setTitulares] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  
  // Debounce de 300ms para evitar requisições excessivas durante digitação
  const debouncedSearch = useDebounce(search, 300)
  
  // Hook de paginação reutilizável
  const paginationHook = usePagination({ initialPageSize: 20 })
  const { pagination, updateFromResponse } = paginationHook

  const loadTitulares = useCallback(async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true)
      const params = { page, page_size: pageSize }
      if (debouncedSearch) params.search = debouncedSearch
      
      const response = await getTitulares(params)
      const data = response.data
      
      setTitulares(data.results || data)
      updateFromResponse(data, page, pageSize)
    } catch (err) {
      setError('Erro ao carregar titulares')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, pagination.page, pagination.pageSize, updateFromResponse])

  useEffect(() => {
    loadTitulares(1, pagination.pageSize)
  }, [debouncedSearch])

  const handleDelete = useCallback(async (id, nome) => {
    if (!window.confirm(`Deseja realmente excluir o titular "${nome}"?`)) {
      return
    }

    try {
      await deleteTitular(id)
      loadTitulares(pagination.page, pagination.pageSize)
    } catch (err) {
      setError('Erro ao excluir titular')
      console.error(err)
    }
  }, [pagination.page, pagination.pageSize, loadTitulares])

  // Handler para mudança de página
  const goToPage = useCallback((page) => {
    paginationHook.setPage(page)
    loadTitulares(page, pagination.pageSize)
  }, [paginationHook, pagination.pageSize, loadTitulares])

  // Handler para mudança de tamanho da página
  const handlePageSizeChange = useCallback((newSize) => {
    paginationHook.setPageSize(newSize)
    loadTitulares(1, newSize)
  }, [paginationHook, loadTitulares])

  return {
    titulares,
    loading,
    search,
    setSearch,
    error,
    handleDelete,
    // Paginação (apenas o necessário para o componente Pagination)
    pagination: paginationHook.pagination,
    pageSizeOptions: paginationHook.pageSizeOptions,
    goToPage,
    handlePageSizeChange,
  }
}

export default useTitularList
