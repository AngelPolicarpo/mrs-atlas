import { useState, useCallback, useMemo } from 'react'

/**
 * usePagination - Hook genérico e reutilizável para paginação
 * 
 * Princípios SOLID aplicados:
 * - Single Responsibility: Gerencia apenas estado e lógica de paginação
 * - Open/Closed: Extensível via options, fechado para modificação
 * - Liskov Substitution: Pode substituir qualquer implementação de paginação
 * - Interface Segregation: Retorna apenas o necessário para cada caso de uso
 * - Dependency Inversion: Não depende de implementações concretas (API, componentes)
 * 
 * @param {Object} options - Opções de configuração
 * @param {number} options.initialPage - Página inicial (padrão: 1)
 * @param {number} options.initialPageSize - Tamanho inicial da página (padrão: 10)
 * @param {number[]} options.pageSizeOptions - Opções de tamanho de página (padrão: [10, 20, 50, 100])
 * @param {number} options.maxVisiblePages - Máximo de páginas visíveis na navegação (padrão: 5)
 * 
 * @returns {Object} Estado e funções de paginação
 * 
 * @example
 * const {
 *   pagination,
 *   setPage,
 *   setPageSize,
 *   updateFromResponse,
 *   getVisiblePages,
 *   reset
 * } = usePagination({ initialPageSize: 20 })
 * 
 * // Atualizar após resposta da API
 * const response = await fetchData({ page: pagination.page, page_size: pagination.pageSize })
 * updateFromResponse({
 *   count: response.data.count,
 *   next: response.data.next,
 *   previous: response.data.previous
 * })
 */
function usePagination(options = {}) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    maxVisiblePages = 5,
  } = options

  // Estado principal da paginação
  const [pagination, setPagination] = useState({
    page: initialPage,
    pageSize: initialPageSize,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  })

  /**
   * Atualiza o estado da paginação com dados da resposta da API
   * Compatível com DRF (Django REST Framework) pagination
   * @param {Object} responseData - Dados da resposta (count, next, previous)
   * @param {number} currentPage - Página atual (opcional)
   * @param {number} currentPageSize - Tamanho da página atual (opcional, para sincronização)
   */
  const updateFromResponse = useCallback((responseData, currentPage = null, currentPageSize = null) => {
    setPagination(prev => {
      const count = responseData.count ?? responseData.totalCount ?? 0
      const pageSize = currentPageSize ?? prev.pageSize
      const totalPages = Math.ceil(count / pageSize) || 1
      const page = currentPage ?? prev.page
      
      return {
        ...prev,
        page,
        pageSize,
        totalPages,
        totalCount: count,
        hasNext: responseData.next != null || page < totalPages,
        hasPrevious: responseData.previous != null || page > 1,
      }
    })
  }, [])

  /**
   * Define a página atual
   */
  const setPage = useCallback((page) => {
    setPagination(prev => {
      const validPage = Math.max(1, Math.min(page, prev.totalPages))
      return { ...prev, page: validPage }
    })
  }, [])

  /**
   * Define o tamanho da página e reseta para página 1
   */
  const setPageSize = useCallback((newSize) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newSize,
      page: 1, // Reseta para primeira página ao mudar tamanho
      totalPages: Math.ceil(prev.totalCount / newSize) || 1,
    }))
  }, [])

  /**
   * Vai para a próxima página
   */
  const nextPage = useCallback(() => {
    setPagination(prev => {
      if (prev.hasNext && prev.page < prev.totalPages) {
        return { ...prev, page: prev.page + 1 }
      }
      return prev
    })
  }, [])

  /**
   * Vai para a página anterior
   */
  const previousPage = useCallback(() => {
    setPagination(prev => {
      if (prev.hasPrevious && prev.page > 1) {
        return { ...prev, page: prev.page - 1 }
      }
      return prev
    })
  }, [])

  /**
   * Vai para a primeira página
   */
  const firstPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  /**
   * Vai para a última página
   */
  const lastPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: prev.totalPages }))
  }, [])

  /**
   * Reseta a paginação para o estado inicial
   */
  const reset = useCallback(() => {
    setPagination({
      page: initialPage,
      pageSize: initialPageSize,
      totalPages: 1,
      totalCount: 0,
      hasNext: false,
      hasPrevious: false,
    })
  }, [initialPage, initialPageSize])

  /**
   * Calcula as páginas visíveis para navegação
   * Retorna array de números de página para renderizar
   */
  const getVisiblePages = useCallback(() => {
    const { page, totalPages } = pagination
    const pages = []
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    // Ajusta se não houver páginas suficientes no final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return {
      pages,
      showFirstEllipsis: startPage > 2,
      showLastEllipsis: endPage < totalPages - 1,
      showFirstPage: startPage > 1,
      showLastPage: endPage < totalPages,
    }
  }, [pagination, maxVisiblePages])

  /**
   * Retorna os parâmetros para a requisição da API
   */
  const getRequestParams = useCallback(() => ({
    page: pagination.page,
    page_size: pagination.pageSize,
  }), [pagination.page, pagination.pageSize])

  /**
   * Verifica se está na primeira página
   */
  const isFirstPage = useMemo(() => pagination.page === 1, [pagination.page])

  /**
   * Verifica se está na última página
   */
  const isLastPage = useMemo(
    () => pagination.page === pagination.totalPages,
    [pagination.page, pagination.totalPages]
  )

  return {
    // Estado
    pagination,
    pageSizeOptions,
    
    // Navegação
    setPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    
    // Configuração
    setPageSize,
    updateFromResponse,
    reset,
    
    // Helpers
    getVisiblePages,
    getRequestParams,
    isFirstPage,
    isLastPage,
  }
}

export default usePagination
