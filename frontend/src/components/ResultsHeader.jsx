import React from 'react'

/**
 * Componente para exibir cabeçalho de resultados com contagem e seletor de página
 * 
 * @param {number} totalCount - Total de itens encontrados
 * @param {string} itemLabel - Label para os itens (ex: "empresa", "titular")
 * @param {number} pageSize - Tamanho atual da página
 * @param {Function} onPageSizeChange - Callback quando tamanho da página muda
 * @param {Array} pageSizeOptions - Opções de tamanho de página
 */
function ResultsHeader({
  totalCount = 0,
  itemLabel = 'item',
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) {
  return (
    <div className="results-header">
      <span className="results-header__count">
        <strong>{totalCount}</strong> {itemLabel}(s) encontrado(s)
      </span>
      
      {onPageSizeChange && (
        <label className="results-header__size-selector">
          Por página:
          <select
            className="form-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

export default ResultsHeader
