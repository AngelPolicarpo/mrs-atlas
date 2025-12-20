import { useState, useEffect, useCallback } from 'react'
import { getContratos, deleteContrato } from '../services/contratos'
import { useDebounce } from './useDebounce'
import usePagination from './usePagination'

/**
 * Hook gerencia toda a lógica da lista de Contratos
 */
function useContratoList() {
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')
  
  const debouncedSearch = useDebounce(search, 300)
  const paginationHook = usePagination({ initialPageSize: 20 })
  const { pagination, updateFromResponse } = paginationHook

  const loadContratos = useCallback(async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true)
      const params = { page, page_size: pageSize }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter
      
      const response = await getContratos(params)
      const data = response.data
      
      setContratos(data.results || data)
      updateFromResponse(data, page, pageSize)
    } catch (err) {
      setError('Erro ao carregar contratos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, pagination.page, pagination.pageSize, updateFromResponse])

  useEffect(() => {
    loadContratos(1, pagination.pageSize)
  }, [debouncedSearch, statusFilter])

  const handleDelete = useCallback(async (id, numero) => {
    if (!window.confirm(`Deseja realmente excluir o contrato "${numero}"?`)) {
      return
    }

    try {
      await deleteContrato(id)
      loadContratos(pagination.page, pagination.pageSize)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erro ao excluir contrato'
      setError(msg)
      console.error(err)
    }
  }, [pagination.page, pagination.pageSize, loadContratos])

  const goToPage = useCallback((page) => {
    paginationHook.setPage(page)
    loadContratos(page, pagination.pageSize)
  }, [paginationHook, pagination.pageSize, loadContratos])

  const handlePageSizeChange = useCallback((newSize) => {
    paginationHook.setPageSize(newSize)
    loadContratos(1, newSize)
  }, [paginationHook, loadContratos])

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'RASCUNHO', label: 'Rascunho' },
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'SUSPENSO', label: 'Suspenso' },
    { value: 'ENCERRADO', label: 'Encerrado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ]

  return {
    contratos,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusOptions,
    error,
    handleDelete,
    pagination: paginationHook.pagination,
    pageSizeOptions: paginationHook.pageSizeOptions,
    goToPage,
    handlePageSizeChange,
    refresh: () => loadContratos(pagination.page, pagination.pageSize),
  }
}

export default useContratoList
