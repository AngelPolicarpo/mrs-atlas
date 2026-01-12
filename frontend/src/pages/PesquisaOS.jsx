import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import useOSPesquisaFilters from '../hooks/useOSPesquisaFilters'
import usePagination from '../hooks/usePagination'
import useOSPesquisaSearch from '../hooks/useOSPesquisaSearch'
import useOSPesquisaExport, { LARGE_EXPORT_WARNING, MAX_EXPORT_LIMIT } from '../hooks/useOSPesquisaExport'
import useAutoComplete from '../hooks/useAutoComplete'
import { getEmpresas } from '../services/empresas'
import { searchContratos } from '../services/contratos'
import { searchTitulares, searchDependentes } from '../services/titulares'
import { searchEmpresasPrestadoras } from '../services/ordemServico'
import { searchUsers } from '../services/users'
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

  // Estados locais para validação e exportação
  const [searchError, setSearchError] = useState('')
  const [isExporting, setIsExporting] = useState(false)

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

  const solicitanteAutocomplete = useAutoComplete(
    (searchText) => searchUsers(searchText)
  )

  const colaboradorAutocomplete = useAutoComplete(
    (searchText) => searchUsers(searchText)
  )

  // Validação de filtros
  const validateFilters = useCallback(() => {
    const { 
      searchTerm, 
      empresa, 
      contrato, 
      centroCusto, 
      titular, 
      dependente,
      status, 
      tipoEvento, 
      dataInicio, 
      dataFim 
    } = filters.filters
    
    const hasSearchTerm = searchTerm && searchTerm.trim().length > 0
    const hasFilter = empresa || contrato || centroCusto || titular || dependente || 
                      status || tipoEvento || dataInicio || dataFim
    
    if (!hasSearchTerm && !hasFilter) {
      setSearchError('Digite um termo de busca ou selecione ao menos um filtro.')
      return false
    }
    
    setSearchError('')
    return true
  }, [filters.filters])

  // Handler para buscar
  const handleSearch = useCallback(
    async (page = 1, customPageSize = null) => {
      if (!validateFilters()) return
      
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
    [filters.filters, pagination.pageSize, search, updateFromResponse, validateFilters]
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

  // Handler para exportação com confirmação e progresso
  const handleExportWithConfirmation = useCallback(
    async (exportFunc, exportAll) => {
      if (!validateFilters()) return
      
      if (search.results.length === 0) {
        alert('Não há dados para exportar.')
        return
      }

      try {
        let dataToExport = search.results
        let totalCount = pagination.totalCount

        if (exportAll) {
          // Verificar quantidade total antes de exportar
          const count = await exportFunctions.getExportCount(filters.filters)
          totalCount = count
          
          if (count > MAX_EXPORT_LIMIT) {
            alert(`A exportação está limitada a ${MAX_EXPORT_LIMIT.toLocaleString()} registros. Refine os filtros para reduzir o volume.`)
            return
          }
          
          if (count > LARGE_EXPORT_WARNING) {
            const confirmed = window.confirm(
              `Você está prestes a exportar ${count.toLocaleString()} registros. ` +
              `Esta operação pode demorar alguns minutos.\n\nDeseja continuar?`
            )
            if (!confirmed) return
          }

          setIsExporting(true)
          
          // Aguardar busca de TODOS os dados antes de continuar
          dataToExport = await exportFunctions.fetchAllResults(
            filters.filters,
            (progress) => {
              // Progress callback - atualiza o estado de progresso
              console.log(`[PesquisaOS] Exportando: ${progress.current}/${progress.total}`)
            }
          )
          
          console.log(`[PesquisaOS] Dados carregados: ${dataToExport.length} de ${totalCount}`)
          
          // Verificar se obteve todos os dados
          if (dataToExport.length < totalCount * 0.95) {
            const continuar = window.confirm(
              `Atenção: Foram carregados ${dataToExport.length.toLocaleString()} de ${totalCount.toLocaleString()} registros (${Math.round(dataToExport.length/totalCount*100)}%).\n\n` +
              `Alguns registros podem ter falhado ao carregar.\n\nDeseja exportar os dados carregados mesmo assim?`
            )
            if (!continuar) {
              setIsExporting(false)
              return
            }
          }
        }

        // Aguardar geração do arquivo
        await exportFunc(dataToExport, 'ordens_servico')
      } catch (error) {
        console.error('Erro na exportação:', error)
        alert(error.message || 'Erro ao exportar. Tente novamente.')
      } finally {
        setIsExporting(false)
      }
    },
    [search.results, exportFunctions, filters.filters, validateFilters, pagination.totalCount]
  )

  // Handler para exportar CSV
  const handleExportCSV = useCallback(
    (exportAll = false) => {
      handleExportWithConfirmation(exportFunctions.exportToCSV, exportAll)
    },
    [handleExportWithConfirmation, exportFunctions.exportToCSV]
  )

  // Handler para exportar XLSX
  const handleExportXLSX = useCallback(
    (exportAll = false) => {
      handleExportWithConfirmation(exportFunctions.exportToXLSX, exportAll)
    },
    [handleExportWithConfirmation, exportFunctions.exportToXLSX]
  )

  // Handler para exportar PDF
  const handleExportPDF = useCallback(
    (exportAll = false) => {
      handleExportWithConfirmation(exportFunctions.exportToPDF, exportAll)
    },
    [handleExportWithConfirmation, exportFunctions.exportToPDF]
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
        solicitanteAutocomplete={solicitanteAutocomplete}
        colaboradorAutocomplete={colaboradorAutocomplete}
        onSearch={handleSearch}
        onKeyPress={handleKeyPress}
      />

      {/* Mensagem de erro de validação */}
      {searchError && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          ⚠️ {searchError}
        </div>
      )}

      {/* Modal de progresso de exportação */}
      {isExporting && (
        <div className="export-progress-overlay">
          <div className="export-progress-modal">
            <h3>⏳ Exportando dados...</h3>
            <p>Processando {exportFunctions.exportProgress.current.toLocaleString()} de {exportFunctions.exportProgress.total.toLocaleString()} registros</p>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${exportFunctions.exportProgress.percent}%` }}
              />
            </div>
            <p className="progress-percent">{exportFunctions.exportProgress.percent}%</p>
          </div>
        </div>
      )}

      {/* Resultados */}
      <div className="card">
        <div className="results-header">
          <span className="results-count">
            <strong>{search.results.length}</strong> registro(s) nesta página
            {pagination.totalPages > 1 && (
              <span className="text-muted">
                {' '}
                — Página {pagination.page} de {pagination.totalPages} (Total: {pagination.totalCount.toLocaleString()} OS)
              </span>
            )}
          </span>
          <div className="results-options">
            {/* Botões de Exportação */}
            <div className="export-buttons">
              <div className="export-dropdown">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={search.results.length === 0 || isExporting}
                  title="Exportar para CSV"
                >
                  {isExporting ? '⏳' : '📄'} CSV ▾
                </button>
                <div className="export-dropdown-content">
                  <button onClick={() => handleExportCSV(false)} disabled={isExporting}>
                    Página atual ({search.results.length})
                  </button>
                  <button onClick={() => handleExportCSV(true)} disabled={isExporting}>
                    Todos ({pagination.totalCount.toLocaleString()})
                  </button>
                </div>
              </div>
              <div className="export-dropdown">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={search.results.length === 0 || isExporting}
                  title="Exportar para Excel"
                >
                  {isExporting ? '⏳' : '📊'} XLSX ▾
                </button>
                <div className="export-dropdown-content">
                  <button onClick={() => handleExportXLSX(false)} disabled={isExporting}>
                    Página atual ({search.results.length})
                  </button>
                  <button onClick={() => handleExportXLSX(true)} disabled={isExporting}>
                    Todos ({pagination.totalCount.toLocaleString()})
                  </button>
                </div>
              </div>
              <div className="export-dropdown">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={search.results.length === 0 || isExporting}
                  title="Exportar para PDF"
                >
                  {isExporting ? '⏳' : '📑'} PDF ▾
                </button>
                <div className="export-dropdown-content">
                  <button onClick={() => handleExportPDF(false)} disabled={isExporting}>
                    Página atual ({search.results.length})
                  </button>
                  <button onClick={() => handleExportPDF(true)} disabled={isExporting}>
                    Todos ({pagination.totalCount.toLocaleString()})
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
