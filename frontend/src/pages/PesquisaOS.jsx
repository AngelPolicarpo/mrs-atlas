import React, { useCallback } from 'react'
import { Link } from 'react-router-dom'
import useOSPesquisaFilters from '../hooks/useOSPesquisaFilters'
import usePagination from '../hooks/usePagination'
import useOSPesquisaSearch from '../hooks/useOSPesquisaSearch'
import useOSPesquisaExport from '../hooks/useOSPesquisaExport'
import useAutoComplete from '../hooks/useAutoComplete'
import { getEmpresas } from '../services/empresas'
import { searchContratos } from '../services/contratos'
import { searchTitulares, searchDependentes } from '../services/titulares'
import { searchEmpresasPrestadoras } from '../services/ordemServico'
import {
  buildOSSearchParams,
  formatDate,
  formatCurrency,
  getStatusBadgeClass,
  getRowClass,
  getDiasAbertosBadgeClass,
  formatDiasAbertos,
} from '../utils/osPesquisaHelpers'
import OSPesquisaFilters from '../components/OSPesquisaFilters'
import OSPesquisaTable from '../components/OSPesquisaTable'
import Pagination from '../components/Pagination'

/**
 * Página de Pesquisa Avançada de Ordens de Serviço
 * Componente que orquestra múltiplos hooks
 * Responsabilidades:
 * - Coordenar hooks (filtros, paginação, busca, exportação)
 * - Integrar com autocompletes
 * - Renderizar componentes de tabela, filtros e paginação
 */
function PesquisaOS() {
  const filters = useOSPesquisaFilters()
  const { pagination, setPage, setPageSize, updateFromResponse } = usePagination({ initialPageSize: 10 })
  const search = useOSPesquisaSearch()
  const exportFunctions = useOSPesquisaExport()

  // Autocomplete hooks
  const empresasAutocomplete = useAutoComplete(
    (searchText) => getEmpresas({ search: searchText, status: true, page_size: 15 })
  )

  const contratosAutocomplete = useAutoComplete(
    (searchText) => searchContratos(searchText)
  )

  const centroCustosAutocomplete = useAutoComplete(
    (searchText) => searchEmpresasPrestadoras(searchText)
  )

  const titularesAutocomplete = useAutoComplete(
    (searchText) => searchTitulares(searchText)
  )

  const dependentesAutocomplete = useAutoComplete(
    (searchText) => searchDependentes(searchText)
  )

  // Handler para buscar
  const handleSearch = useCallback(
    async (page = 1, customPageSize = null) => {
      const effectivePageSize = customPageSize || pagination.pageSize
      const params = buildOSSearchParams(filters.filters, page, effectivePageSize)
      const result = await search.search(params, page, effectivePageSize)
      updateFromResponse(
        { 
          count: result.pagination.totalCount, 
          next: result.pagination.hasNext, 
          previous: result.pagination.hasPrevious 
        }, 
        page, 
        effectivePageSize
      )
    },
    [filters.filters, pagination.pageSize, search, updateFromResponse]
  )

  // Handler para mudar página
  const handlePageChange = useCallback(
    (page) => {
      setPage(page)
      handleSearch(page)
    },
    [handleSearch, setPage]
  )

  // Handler para mudar tamanho da página
  const handlePageSizeChange = useCallback(
    (newSize) => {
      setPageSize(newSize)
      handleSearch(1, newSize)
    },
    [setPageSize, handleSearch]
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
        await exportFunctions.exportToCSV(dataToExport, 'ordens_servico')
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
        await exportFunctions.exportToXLSX(dataToExport, 'ordens_servico')
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
        await exportFunctions.exportToPDF(dataToExport, 'ordens_servico')
      } catch (error) {
        alert('Erro ao exportar. Tente novamente.')
      }
    },
    [search.results, exportFunctions, filters.filters]
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔍 Pesquisa de Ordens de Serviço</h1>
        <Link to="/ordens-servico/new" className="btn btn-primary">
          + Nova OS
        </Link>
      </div>

      {/* Filtros */}
      <OSPesquisaFilters
        filters={filters}
        empresasAutocomplete={empresasAutocomplete}
        contratosAutocomplete={contratosAutocomplete}
        centroCustosAutocomplete={centroCustosAutocomplete}
        titularesAutocomplete={titularesAutocomplete}
        dependentesAutocomplete={dependentesAutocomplete}
        onSearch={handleSearch}
        onKeyPress={handleKeyPress}
      />

      {/* Resultados */}
      <div className="card">
        <div className="results-header">
          <span className="results-count">
            <strong>{search.results.length}</strong> registro(s) encontrado(s)
            {pagination.totalPages > 1 && (
              <span className="text-muted">
                {' '}
                — Página {pagination.page} de {pagination.totalPages}
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
                    Todos ({pagination.totalCount})
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
                    Todos ({pagination.totalCount})
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
                    Todos ({pagination.totalCount})
                  </button>
                </div>
              </div>
            </div>
            <label className="form-label-inline">
              Itens por página:
              <select
                className="form-select form-select-sm"
                value={pagination.pageSize}
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
            <OSPesquisaTable
              results={search.results}
              expandedItems={search.expandedItems}
              onToggleExpand={search.toggleExpand}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              getStatusBadgeClass={getStatusBadgeClass}
              getRowClass={getRowClass}
              getDiasAbertosBadgeClass={getDiasAbertosBadgeClass}
              formatDiasAbertos={formatDiasAbertos}
            />

            {/* Paginação */}
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Legenda */}
      <div className="results-legend">
        <span className="legend-item">
          <span className="badge badge-info">Aberta</span>
        </span>
        <span className="legend-item">
          <span className="badge badge-success">Finalizada</span>
        </span>
        <span className="legend-item">
          <span className="badge badge-danger">Cancelada</span>
        </span>
      </div>
    </div>
  )
}

export default PesquisaOS
