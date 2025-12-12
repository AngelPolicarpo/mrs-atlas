import { useCallback, useEffect, useState } from 'react'
import { deleteDependente, getDependentes, getTitulares } from '../services/titulares'
import { useDebounce } from './useDebounce'
import usePagination from './usePagination'

function useDependenteList(initialTitularId) {
  const [dependentes, setDependentes] = useState([])
  const [titulares, setTitulares] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [titularFilter, setTitularFilter] = useState(initialTitularId || '')
  const [error, setError] = useState('')
  
  // Debounce de 300ms para evitar requisições excessivas durante digitação
  const debouncedSearch = useDebounce(search, 300)
  
  // Hook de paginação reutilizável
  const paginationHook = usePagination({ initialPageSize: 20 })
  const { pagination, updateFromResponse } = paginationHook

  const loadTitulares = useCallback(async () => {
    try {
      const response = await getTitulares()
      setTitulares(response.data.results || response.data || [])
    } catch (err) {
      console.error('Erro ao carregar titulares:', err)
    }
  }, [])

  const loadDependentes = useCallback(async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true)
      const params = { page, page_size: pageSize }
      if (debouncedSearch) params.search = debouncedSearch
      if (titularFilter) params.titular = titularFilter
      
      const response = await getDependentes(params)
      const data = response.data
      
      setDependentes(data.results || data || [])
      updateFromResponse(data, page, pageSize)
      setError('')
    } catch (err) {
      setError('Erro ao carregar dependentes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, titularFilter, pagination.page, pagination.pageSize, updateFromResponse])

  const handleDelete = useCallback(async (id, nome) => {
    const confirmado = window.confirm(`Deseja realmente excluir o dependente "${nome}"?`)
    if (!confirmado) return

    try {
      await deleteDependente(id)
      await loadDependentes(pagination.page, pagination.pageSize)
    } catch (err) {
      setError('Erro ao excluir dependente')
      console.error(err)
    }
  }, [loadDependentes, pagination.page, pagination.pageSize])

  useEffect(() => {
    loadTitulares()
  }, [loadTitulares])

  useEffect(() => {
    loadDependentes(1, pagination.pageSize)
  }, [debouncedSearch, titularFilter])

  // Handler para mudança de página
  const goToPage = useCallback((page) => {
    paginationHook.setPage(page)
    loadDependentes(page, pagination.pageSize)
  }, [paginationHook, pagination.pageSize, loadDependentes])

  // Handler para mudança de tamanho da página
  const handlePageSizeChange = useCallback((newSize) => {
    paginationHook.setPageSize(newSize)
    loadDependentes(1, newSize)
  }, [paginationHook, loadDependentes])

  return {
    dependentes,
    titulares,
    loading,
    search,
    titularFilter,
    error,
    setSearch,
    setTitularFilter,
    reload: () => loadDependentes(pagination.page, pagination.pageSize),
    handleDelete,
    // Paginação (apenas o necessário para o componente Pagination)
    pagination: paginationHook.pagination,
    pageSizeOptions: paginationHook.pageSizeOptions,
    goToPage,
    handlePageSizeChange,
  }
}

export default useDependenteList
