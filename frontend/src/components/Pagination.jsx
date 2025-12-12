import React from 'react'

/**
 * Componente genérico e reutilizável de Paginação
 * 
 * Princípios SOLID/DRY aplicados:
 * - Single Responsibility: Apenas renderiza navegação de páginas
 * - Open/Closed: Extensível via props, fechado para modificação
 * - DRY: Um único componente para todas as páginas
 * 
 * @param {Object} pagination - Estado da paginação do hook usePagination
 * @param {Function} onPageChange - Callback quando página muda
 */
function Pagination({ pagination, onPageChange }) {
  // Não renderiza se houver apenas 1 página ou menos
  if (!pagination || pagination.totalPages <= 1) return null

  // Calcula páginas visíveis
  const getVisiblePages = () => {
    const maxVisiblePages = 5
    const { page, totalPages } = pagination
    const pages = []
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
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
  }

  const { pages, showFirstEllipsis, showLastEllipsis, showFirstPage, showLastPage } = getVisiblePages()
  const isFirstPage = pagination.page === 1
  const isLastPage = pagination.page === pagination.totalPages

  return (
    <div className="pagination">
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(1)}
        disabled={isFirstPage}
        title="Primeira página"
      >
        ⏮️
      </button>
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPrevious}
        title="Página anterior"
      >
        ◀️
      </button>

      <div className="pagination__pages">
        {showFirstPage && (
          <>
            <button className="btn btn-sm btn-outline" onClick={() => onPageChange(1)}>
              1
            </button>
            {showFirstEllipsis && <span className="pagination__ellipsis">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            className={`btn btn-sm ${page === pagination.page ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {showLastPage && (
          <>
            {showLastEllipsis && <span className="pagination__ellipsis">...</span>}
            <button className="btn btn-sm btn-outline" onClick={() => onPageChange(pagination.totalPages)}>
              {pagination.totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={!pagination.hasNext}
        title="Próxima página"
      >
        ▶️
      </button>
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(pagination.totalPages)}
        disabled={isLastPage}
        title="Última página"
      >
        ⏭️
      </button>
    </div>
  )
}

export default Pagination
