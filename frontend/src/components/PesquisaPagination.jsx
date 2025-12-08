import React from 'react'

/**
 * Componente puro para renderizar paginação
 * Responsabilidades:
 * - Renderizar botões de navegação
 * - Renderizar números de página
 * - Delegar eventos ao pai
 */
function PesquisaPagination({ pagination, onPageChange }) {
  if (pagination.totalPages <= 1) return null

  const pages = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="pagination">
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(1)}
        disabled={pagination.page === 1}
      >
        ⏮️
      </button>
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPrevious}
      >
        ◀️ Anterior
      </button>

      <div className="pagination-pages">
        {startPage > 1 && (
          <>
            <button className="btn btn-sm btn-outline" onClick={() => onPageChange(1)}>
              1
            </button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
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

        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && <span className="pagination-ellipsis">...</span>}
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
      >
        Próxima ▶️
      </button>
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(pagination.totalPages)}
        disabled={pagination.page === pagination.totalPages}
      >
        ⏭️
      </button>
    </div>
  )
}

export default PesquisaPagination
