import { useState, useCallback } from 'react'

const initialPagination = {
  page: 1,
  pageSize: 20,
  totalPages: 1,
  totalCount: 0,
  hasNext: false,
  hasPrevious: false,
}

/**
 * Hook para gerenciar estado de paginação
 * Responsabilidades:
 * - Estado da paginação
 * - Handlers para navegação entre páginas
 * - Mudança de tamanho da página
 */
function usePesquisaPagination() {
  const [pagination, setPagination] = useState(initialPagination)

  const updatePagination = useCallback((data) => {
    setPagination({
      page: data.page,
      pageSize: pagination.pageSize,
      totalPages: data.total_pages,
      totalCount: data.count,
      hasNext: data.has_next,
      hasPrevious: data.has_previous,
    })
  }, [pagination.pageSize])

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      return page
    }
    return pagination.page
  }, [pagination.totalPages, pagination.page])

  const goToNextPage = useCallback(() => {
    if (pagination.hasNext) {
      return pagination.page + 1
    }
    return pagination.page
  }, [pagination.hasNext, pagination.page])

  const goToPreviousPage = useCallback(() => {
    if (pagination.hasPrevious) {
      return pagination.page - 1
    }
    return pagination.page
  }, [pagination.hasPrevious, pagination.page])

  const setPageSize = useCallback((newSize) => {
    setPagination(prev => ({ ...prev, pageSize: newSize }))
  }, [])

  const reset = useCallback(() => {
    setPagination(initialPagination)
  }, [])

  return {
    pagination,
    updatePagination,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    reset,
  }
}

export default usePesquisaPagination
