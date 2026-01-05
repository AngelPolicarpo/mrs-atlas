import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import usePesquisaFilters from '../hooks/usePesquisaFilters'
import usePagination from '../hooks/usePagination'
import usePesquisaSearch from '../hooks/usePesquisaSearch'
import usePesquisaExport from '../hooks/usePesquisaExport'
import useAutoComplete from '../hooks/useAutoComplete'
import { getEmpresas } from '../services/empresas'
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
import Pagination from '../components/Pagination'

/**
 * Verifica se há ao menos um filtro preenchido
 */
function hasActiveFilters(filters) {
  const { searchTerm, nacionalidade, consulado, empresa, tipoVinculo, status, tipoEvento, periodo, dataDe, dataAte } = filters
  return !!(
    searchTerm?.trim() ||
    nacionalidade ||
    consulado ||
    empresa ||
    tipoVinculo ||
    status ||
    tipoEvento ||
    periodo ||
    dataDe ||
    dataAte
  )
}

/**
 * Página de Pesquisa Avançada
 * Componente puro que orquestra múltiplos hooks
 */
function Pesquisa() {
  const filters = usePesquisaFilters()
  const { pagination, pageSizeOptions, setPage, setPageSize, updateFromResponse } = usePagination({ initialPageSize: 10 })
  const search = usePesquisaSearch()
  const exportFunctions = usePesquisaExport()
  
  // Estado para progresso de exportação
  const [exportProgress, setExportProgress] = useState(null)
  const [validationError, setValidationError] = useState('')

  // Autocomplete hooks
  const empresasAutocomplete = useAutoComplete(
    (searchText) => getEmpresas({ search: searchText, status: true, page_size: 15 })
  )

  // Validação antes de buscar
  const validateSearch = useCallback(() => {
    if (!hasActiveFilters(filters.filters)) {
      setValidationError('Selecione ao menos um filtro para realizar a busca.')
      return false
    }
    setValidationError('')
    return true
  }, [filters.filters])

  // Handler para buscar
  const handleSearch = useCallback(
    async (page = 1, customPageSize = null) => {
      if (!validateSearch()) return
      
      const effectivePageSize = customPageSize || pagination.pageSize
      const params = buildSearchParams(filters.filters, page, effectivePageSize)
      const result = await search.search(params, page, effectivePageSize)
      updateFromResponse({ count: result.pagination.totalCount, next: result.pagination.hasNext, previous: result.pagination.hasPrevious }, page, effectivePageSize)
    },
    [filters.filters, pagination.pageSize, search, updateFromResponse, validateSearch]
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

  // Handler genérico de exportação com validações e progresso
  const handleExport = useCallback(
    async (exportAll, exportFunction, filename) => {
      if (search.results.length === 0) {
        alert('Não há dados para exportar.')
        return
      }

      try {
        let dataToExport = search.results
        
        if (exportAll) {
          // Obter informações de contagem (titulares + estimativa de registros)
          const countInfo = await exportFunctions.getExportCount(filters.filters)
          const { titulares, totalPages, recordsEstimate } = countInfo
          
          // Verificar limite máximo baseado em titulares (que controla a paginação)
          if (titulares > exportFunctions.EXPORT_CONFIG.MAX_RECORDS) {
            alert(
              `A exportação está limitada a ${exportFunctions.EXPORT_CONFIG.MAX_RECORDS.toLocaleString()} titulares.\n\n` +
              `Sua busca retornou ${titulares.toLocaleString()} titulares.\n\n` +
              `Por favor, refine seus filtros para reduzir o número de resultados.`
            )
            return
          }
          
          // Aviso para grandes volumes
          if (titulares > exportFunctions.EXPORT_CONFIG.WARNING_THRESHOLD) {
            const confirmar = window.confirm(
              `Você está prestes a exportar ${titulares.toLocaleString()} titulares ` +
              `(estimativa de ~${recordsEstimate.toLocaleString()} registros incluindo dependentes).\n\n` +
              `São ${totalPages} páginas para carregar. Isso pode demorar alguns minutos.\n\n` +
              `Deseja continuar?`
            )
            if (!confirmar) return
          }
          
          // Mostrar progresso
          setExportProgress({ 
            current: 0, 
            total: totalPages, 
            records: 0,
            message: 'Iniciando exportação...' 
          })
          
          // Aguardar busca de TODOS os dados
          dataToExport = await exportFunctions.fetchAllResults(filters.filters, (progress) => {
            setExportProgress({
              current: progress.current,
              total: progress.total,
              records: progress.records,
              message: progress.message
            })
          })
          
          console.log(`[Pesquisa] Exportação completa: ${dataToExport.length.toLocaleString()} registros de ${totalPages} páginas`)
          
          setExportProgress({ 
            current: totalPages, 
            total: totalPages, 
            records: dataToExport.length,
            message: 'Gerando arquivo...' 
          })
        }
        
        // Aguardar geração do arquivo
        await exportFunction(dataToExport, filename)
        setExportProgress(null)
      } catch (error) {
        setExportProgress(null)
        alert(error.message || 'Erro ao exportar. Tente novamente.')
      }
    },
    [search.results, exportFunctions, filters.filters, pagination.totalCount]
  )

  // Handlers específicos de exportação
  const handleExportCSV = useCallback(
    (exportAll = false) => handleExport(exportAll, exportFunctions.exportToCSV, 'pesquisa_atlas'),
    [handleExport, exportFunctions.exportToCSV]
  )

  const handleExportXLSX = useCallback(
    (exportAll = false) => handleExport(exportAll, exportFunctions.exportToXLSX, 'pesquisa_atlas'),
    [handleExport, exportFunctions.exportToXLSX]
  )

  const handleExportPDF = useCallback(
    (exportAll = false) => handleExport(exportAll, exportFunctions.exportToPDF, 'pesquisa_atlas'),
    [handleExport, exportFunctions.exportToPDF]
  )

  const isExporting = exportFunctions.exporting || exportProgress !== null

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔍 Pesquisa Avançada</h1>
      </div>

      {/* Filtros */}
      <PesquisaFilters
        filters={filters}
        empresasAutocomplete={empresasAutocomplete}
        onSearch={handleSearch}
        onKeyPress={handleKeyPress}
      />
      
      {/* Mensagem de validação */}
      {validationError && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          ⚠️ {validationError}
        </div>
      )}
      
      {/* Barra de progresso de exportação */}
      {exportProgress && (
        <div className="export-progress-bar" style={{
          background: '#e0f2fe',
          border: '1px solid #7dd3fc',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>📦 {exportProgress.message}</span>
            <span>
              Página {exportProgress.current}/{exportProgress.total}
              {exportProgress.records > 0 && ` (${exportProgress.records.toLocaleString()} registros)`}
            </span>
          </div>
          <div style={{ 
            background: '#bae6fd', 
            borderRadius: '0.25rem', 
            height: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#0284c7',
              height: '100%',
              width: `${(exportProgress.current / exportProgress.total) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
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
                — Página {pagination.page} de {pagination.totalPages} ({pagination.totalCount.toLocaleString()} titulares)
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
                    Todos
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
                    Todos
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
                    Todos
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
