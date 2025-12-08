import React, { useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import usePesquisaFilters from '../hooks/usePesquisaFilters'
import usePesquisaPagination from '../hooks/usePesquisaPagination'
import usePesquisaSearch from '../hooks/usePesquisaSearch'
import usePesquisaExport from '../hooks/usePesquisaExport'
import useAutoComplete from '../hooks/useAutoComplete'
import { getEmpresas } from '../services/empresas'
import { getNacionalidades, getConsulados } from '../services/core'
import {
  buildSearchParams,
  calcularDiasRestantes,
  formatDate,
  getRowClass,
  getBadgeClass,
  formatDiasRestantes,
  getStatusText,
  getStatusBadgeClass,
  getTypeText,
  getTypeBadgeClass,
} from '../utils/pesquisaHelpers'
import PesquisaFilters from '../components/PesquisaFilters'
import PesquisaTable from '../components/PesquisaTable'
import PesquisaPagination from '../components/PesquisaPagination'

/**
 * Página de Pesquisa Avançada
 * Componente puro que orquestra múltiplos hooks
 * Responsabilidades:
 * - Coordenar hooks (filtros, paginação, busca, exportação)
 * - Integrar com autocompletes
 * - Renderizar componentes de tabela, filtros e paginação
 */
function Pesquisa() {
  const filters = usePesquisaFilters()
  const pagination = usePesquisaPagination()
  const search = usePesquisaSearch()
  const exportFunctions = usePesquisaExport()

  // Autocomplete hooks
  const empresasAutocomplete = useAutoComplete(
    (searchText) => getEmpresas({ search: searchText, status: true, page_size: 15 })
  )
  const nacionalidadesAutocomplete = useAutoComplete(
    (searchText) => getNacionalidades({ search: searchText, ativo: true, page_size: 15 })
  )
  const consuladosAutocomplete = useAutoComplete(
    (searchText) => getConsulados({ search: searchText, ativo: true, page_size: 15 })
  )

  // Handler para buscar
  const handleSearch = useCallback(
    async (page = 1, customPageSize = null) => {
      const effectivePageSize = customPageSize || pagination.pagination.pageSize
      const params = buildSearchParams(filters.filters, page, effectivePageSize)
      const result = await search.search(params, page, effectivePageSize)
      pagination.updatePagination(result.pagination)
    },
    [filters.filters, pagination, search]
  )

  // Handler para mudar página
  const handlePageChange = useCallback(
    (page) => {
      handleSearch(page)
    },
    [handleSearch]
  )

  // Handler para mudar tamanho da página
  const handlePageSizeChange = useCallback(
    (newSize) => {
      pagination.setPageSize(newSize)
      handleSearch(1, newSize) // Passa o novo tamanho diretamente
    },
    [pagination, handleSearch]
  )

  // Handler para tecla Enter
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSearch(1)
      }
    },
    [handleSearch]
  )

  // Handler para exportar CSV
  const handleExportCSV = useCallback(
    async (exportAll = false) => {
      if (search.results.length === 0) {
        alert('Não há dados para exportar.')
        return
      }

      try {
        let dataToExport = search.results
        if (exportAll) {
          dataToExport = await exportFunctions.fetchAllResults(filters.filters)
        }
        await exportFunctions.exportToCSV(dataToExport, 'pesquisa_atlas')
      } catch (error) {
        alert('Erro ao exportar. Tente novamente.')
      }
    },
    [search.results, exportFunctions, filters.filters]
  )

  // Handler para exportar XLSX
  const handleExportXLSX = useCallback(
    async (exportAll = false) => {
      if (search.results.length === 0) {
        alert('Não há dados para exportar.')
        return
      }

      try {
        let dataToExport = search.results
        if (exportAll) {
          dataToExport = await exportFunctions.fetchAllResults(filters.filters)
        }
        await exportFunctions.exportToXLSX(dataToExport, 'pesquisa_atlas')
      } catch (error) {
        alert('Erro ao exportar. Tente novamente.')
      }
    },
    [search.results, exportFunctions, filters.filters]
  )

  // Handler para exportar PDF
  const handleExportPDF = useCallback(
    async (exportAll = false) => {
      if (search.results.length === 0) {
        alert('Não há dados para exportar.')
        return
      }

      try {
        let dataToExport = search.results
        if (exportAll) {
          dataToExport = await exportFunctions.fetchAllResults(filters.filters)
        }
        await exportFunctions.exportToPDF(dataToExport, 'pesquisa_atlas')
      } catch (error) {
        alert('Erro ao exportar. Tente novamente.')
      }
    },
    [search.results, exportFunctions, filters.filters]
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔍 Pesquisa Avançada</h1>
      </div>

      {/* Filtros */}
      <PesquisaFilters
        filters={filters}
        empresasAutocomplete={empresasAutocomplete}
        nacionalidadesAutocomplete={nacionalidadesAutocomplete}
        consuladosAutocomplete={consuladosAutocomplete}
        onSearch={handleSearch}
        onKeyPress={handleKeyPress}
      />

      {/* Resultados */}
      <div className="card">
        <div className="results-header">
          <span className="results-count">
            <strong>{search.results.length}</strong> registro(s) encontrado(s)
            {pagination.pagination.totalPages > 1 && (
              <span className="text-muted">
                {' '}
                — Página {pagination.pagination.page} de {pagination.pagination.totalPages}
              </span>
            )}
          </span>
          <div className="results-options">
            {/* Botões de Exportação */}
            <div className="export-buttons">
              <div className="export-dropdown">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={search.results.length === 0 || exportFunctions.exporting}
                  title="Exportar para CSV"
                >
                  {exportFunctions.exporting ? '⏳' : '📄'} CSV ▾
                </button>
                <div className="export-dropdown-content">
                  <button onClick={() => handleExportCSV(false)} disabled={exportFunctions.exporting}>
                    Página atual ({search.results.length})
                  </button>
                  <button onClick={() => handleExportCSV(true)} disabled={exportFunctions.exporting}>
                    Todos ({pagination.pagination.totalCount})
                  </button>
                </div>
              </div>
              <div className="export-dropdown">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={search.results.length === 0 || exportFunctions.exporting}
                  title="Exportar para Excel"
                >
                  {exportFunctions.exporting ? '⏳' : '📊'} XLSX ▾
                </button>
                <div className="export-dropdown-content">
                  <button onClick={() => handleExportXLSX(false)} disabled={exportFunctions.exporting}>
                    Página atual ({search.results.length})
                  </button>
                  <button onClick={() => handleExportXLSX(true)} disabled={exportFunctions.exporting}>
                    Todos ({pagination.pagination.totalCount})
                  </button>
                </div>
              </div>
              <div className="export-dropdown">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={search.results.length === 0 || exportFunctions.exporting}
                  title="Exportar para PDF"
                >
                  {exportFunctions.exporting ? '⏳' : '📑'} PDF ▾
                </button>
                <div className="export-dropdown-content">
                  <button onClick={() => handleExportPDF(false)} disabled={exportFunctions.exporting}>
                    Página atual ({search.results.length})
                  </button>
                  <button onClick={() => handleExportPDF(true)} disabled={exportFunctions.exporting}>
                    Todos ({pagination.pagination.totalCount})
                  </button>
                </div>
              </div>
            </div>
            <label className="form-label-inline">
              Itens por página:
              <select
                className="form-select form-select-sm"
                value={pagination.pagination.pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                style={{ width: '80px', marginLeft: '0.5rem' }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>
        </div>

        {search.loading ? (
          <div className="loading-inline">Carregando...</div>
        ) : search.results.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum resultado encontrado.</p>
            <p>Tente ajustar os filtros de busca.</p>
          </div>
        ) : (
          <>
            <PesquisaTable
              results={search.results}
              expandedItems={search.expandedItems}
              onToggleExpand={search.toggleExpand}
              getRowClass={getRowClass}
              formatDate={formatDate}
              calcularDiasRestantes={calcularDiasRestantes}
              getBadgeClass={getBadgeClass}
              formatDiasRestantes={formatDiasRestantes}
              getStatusText={getStatusText}
              getStatusBadgeClass={getStatusBadgeClass}
              getTypeText={getTypeText}
              getTypeBadgeClass={getTypeBadgeClass}
            />

            {/* Paginação */}
            <PesquisaPagination
              pagination={pagination.pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Legenda */}
      <div className="results-legend">
        <span className="legend-item">
          <span className="legend-color legend-expired"></span>
          Vencido
        </span>
        <span className="legend-item">
          <span className="legend-color legend-warning"></span>
          Vence em até 60 dias
        </span>
        <span className="legend-item">
          <span className="tipo-badge tipo-titular">Titular</span>
        </span>
        <span className="legend-item">
          <span className="tipo-badge tipo-dependente">Dependente</span>
        </span>
      </div>
    </div>
  )
}

export default Pesquisa
