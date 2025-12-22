import { useState, useEffect, useCallback } from 'react'
import { getOrdensServico, deleteOrdemServico } from '../services/ordemServico'
import { useDebounce } from './useDebounce'
import usePagination from './usePagination'

/**
 * Hook gerencia toda a lógica da lista de Ordens de Serviço
 * Responsabilidades:
 * - Carregar lista de OS (com busca, filtros e paginação)
 * - Deletar OS
 * - Gerenciar estado de carregamento e erros
 */
function useOrdemServicoList() {
  const [ordensServico, setOrdensServico] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')
  
  // Debounce de 300ms para evitar requisições excessivas durante digitação
  const debouncedSearch = useDebounce(search, 300)
  
  // Hook de paginação reutilizável
  const paginationHook = usePagination({ initialPageSize: 20 })
  const { pagination, updateFromResponse } = paginationHook

  const loadOrdensServico = useCallback(async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true)
      const params = { page, page_size: pageSize }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter
      
      const response = await getOrdensServico(params)
      const data = response.data
      
      setOrdensServico(data.results || data)
      updateFromResponse(data, page, pageSize)
    } catch (err) {
      setError('Erro ao carregar ordens de serviço')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, pagination.page, pagination.pageSize, updateFromResponse])

  useEffect(() => {
    loadOrdensServico(1, pagination.pageSize)
  }, [debouncedSearch, statusFilter])

  const handleDelete = useCallback(async (id, numero) => {
    if (!window.confirm(`Deseja realmente excluir a OS #${numero}?`)) {
      return
    }

    try {
      await deleteOrdemServico(id)
      loadOrdensServico(pagination.page, pagination.pageSize)
    } catch (err) {
      setError('Erro ao excluir ordem de serviço')
      console.error(err)
    }
  }, [pagination.page, pagination.pageSize, loadOrdensServico])

  // Handler para mudança de página
  const goToPage = useCallback((page) => {
    paginationHook.setPage(page)
    loadOrdensServico(page, pagination.pageSize)
  }, [paginationHook, pagination.pageSize, loadOrdensServico])

  // Handler para mudança de tamanho da página
  const handlePageSizeChange = useCallback((newSize) => {
    paginationHook.setPageSize(newSize)
    loadOrdensServico(1, newSize)
  }, [paginationHook, loadOrdensServico])

  // Status disponíveis para filtro
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'ABERTA', label: 'Aberta' },
    { value: 'FINALIZADA', label: 'Concluída' },
    { value: 'CANCELADA', label: 'Cancelada' },
  ]

  return {
    ordensServico,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusOptions,
    error,
    handleDelete,
    // Paginação
    pagination: paginationHook.pagination,
    pageSizeOptions: paginationHook.pageSizeOptions,
    goToPage,
    handlePageSizeChange,
    refresh: () => loadOrdensServico(pagination.page, pagination.pageSize),
  }
}

export default useOrdemServicoList
