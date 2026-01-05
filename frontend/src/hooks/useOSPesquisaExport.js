import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { getOrdensServico } from '../services/ordemServico'
import { prepareOSExportData, formatDate, formatCurrency, buildOSSearchParams } from '../utils/osPesquisaHelpers'
import { formatLocalDate } from '../utils/dateUtils'

// Configurações de exportação
const EXPORT_CONFIG = {
  PAGE_SIZE: 100,           // Registros por página na busca (limite do backend)
  MAX_RECORDS: 50000,       // Limite máximo de registros
  WARNING_THRESHOLD: 10000, // Aviso a partir deste número
  BATCH_DELAY: 50,          // Delay entre batches (ms) - reduzido para compensar mais requisições
}

// Exportar constantes para uso externo
export const LARGE_EXPORT_WARNING = EXPORT_CONFIG.WARNING_THRESHOLD
export const MAX_EXPORT_LIMIT = EXPORT_CONFIG.MAX_RECORDS

/**
 * Hook para gerenciar exportações de OS (CSV, XLSX, PDF)
 * Responsabilidades:
 * - Buscar dados com paginação completa
 * - Formatar dados para cada tipo de exportação
 * - Executar downloads
 * - Gerenciar estado de carregamento e progresso
 */
function useOSPesquisaExport() {
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, message: '' })

  /**
   * Buscar todos os resultados para exportação COM PAGINAÇÃO
   * Itera sobre todas as páginas da API até obter todos os registros
   */
  const fetchAllResults = useCallback(async (filters, onProgress = null) => {
    const allResults = []
    let currentPage = 1
    let totalCount = 0
    let totalPages = 1
    let hasNext = true

    try {
      // Primeira requisição para obter o total
      const params = buildOSSearchParams(filters, currentPage, EXPORT_CONFIG.PAGE_SIZE)
      const firstResponse = await getOrdensServico(params)
      
      totalCount = firstResponse.data.count || 0
      totalPages = Math.ceil(totalCount / EXPORT_CONFIG.PAGE_SIZE)
      hasNext = firstResponse.data.next !== null
      const firstResults = firstResponse.data.results || []
      allResults.push(...firstResults)

      // Verificar limites
      if (totalCount > EXPORT_CONFIG.MAX_RECORDS) {
        throw new Error(`A exportação está limitada a ${EXPORT_CONFIG.MAX_RECORDS.toLocaleString()} registros. Sua busca retornou ${totalCount.toLocaleString()} registros. Por favor, refine seus filtros.`)
      }
      
      console.log(`[Export OS] Iniciando: ${totalCount} registros em ${totalPages} páginas`)

      // Atualizar progresso
      if (onProgress) {
        onProgress({
          current: currentPage,
          total: totalPages,
          records: allResults.length,
          message: `Carregando página ${currentPage}/${totalPages}...`
        })
      }

      // Buscar páginas restantes usando has_next como controle
      while (hasNext && currentPage < totalPages) {
        currentPage++
        
        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, EXPORT_CONFIG.BATCH_DELAY))
        
        try {
          const pageParams = buildOSSearchParams(filters, currentPage, EXPORT_CONFIG.PAGE_SIZE)
          const response = await getOrdensServico(pageParams)
          const results = response.data.results || []
          hasNext = response.data.next !== null
          
          if (results.length > 0) {
            allResults.push(...results)
          }
          
          // Atualizar progresso
          if (onProgress) {
            onProgress({
              current: currentPage,
              total: totalPages,
              records: allResults.length,
              message: `Carregando página ${currentPage}/${totalPages}...`
            })
          }
          
          // Log a cada 10% do progresso
          if (currentPage % Math.ceil(totalPages / 10) === 0) {
            console.log(`[Export OS] Progresso: ${Math.round(currentPage/totalPages*100)}% (${allResults.length.toLocaleString()}/${totalCount.toLocaleString()})`)
          }
        } catch (pageError) {
          console.error(`[Export OS] Erro na página ${currentPage}:`, pageError)
        }
      }
      
      console.log(`[Export OS] Finalizado: ${allResults.length} registros de ${totalCount} esperados`)
      return allResults
    } catch (error) {
      console.error('Erro ao buscar dados para exportação:', error)
      throw error
    }
  }, [])

  /**
   * Obtém contagem total de registros para validação prévia
   */
  const getExportCount = useCallback(async (filters) => {
    try {
      const params = buildOSSearchParams(filters, 1, EXPORT_CONFIG.PAGE_SIZE)
      const response = await getOrdensServico(params)
      const count = response.data.count || 0
      const totalPages = Math.ceil(count / EXPORT_CONFIG.PAGE_SIZE)
      return { count, totalPages, titulares: count, recordsEstimate: count }
    } catch (error) {
      console.error('Erro ao obter contagem:', error)
      return { count: 0, totalPages: 0, titulares: 0, recordsEstimate: 0 }
    }
  }, [])

  // Exportar para CSV
  const exportToCSV = useCallback(async (data, filename = 'ordens_servico') => {
    setExporting(true)
    try {
      const exportData = prepareOSExportData(data)
      const headers = Object.keys(exportData[0])

      let csvContent = '\uFEFF' // BOM para Excel reconhecer UTF-8
      csvContent += headers.join(';') + '\n'

      exportData.forEach(row => {
        const values = headers.map(header => {
          let value = row[header] || ''
          value = String(value).replace(/"/g, '""')
          if (value.includes(';') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`
          }
          return value
        })
        csvContent += values.join(';') + '\n'
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const timestamp = formatLocalDate()
      saveAs(blob, `${filename}_${timestamp}.csv`)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }, [])

  // Exportar para XLSX
  const exportToXLSX = useCallback(async (data, filename = 'ordens_servico') => {
    setExporting(true)
    try {
      const exportData = prepareOSExportData(data)

      const ws = XLSX.utils.json_to_sheet(exportData)

      const colWidths = Object.keys(exportData[0]).map(key => ({
        wch: Math.max(key.length, ...exportData.map(row => String(row[key] || '').length).slice(0, 50)) + 2,
      }))
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Ordens de Serviço')

      const timestamp = formatLocalDate()
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)
    } catch (error) {
      console.error('Erro ao exportar XLSX:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }, [])

  // Exportar para PDF
  const exportToPDF = useCallback(async (data, filename = 'ordens_servico') => {
    setExporting(true)
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')

      // Título
      doc.setFontSize(16)
      doc.text('Ordens de Serviço - Atlas', 14, 15)

      // Data de geração e total
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22)
      doc.text(`Total de registros: ${data.length.toLocaleString()}`, 14, 27)

      // Preparar dados para tabela com truncamento
      const exportData = prepareOSExportData(data)
      const headers = Object.keys(exportData[0])
      const rows = exportData.map(row => headers.map(h => {
        const val = row[h] || ''
        // Truncar valores muito longos
        return String(val).length > 30 ? String(val).substring(0, 30) + '...' : val
      }))

      // Gerar tabela com configurações otimizadas
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 32,
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          overflow: 'ellipsize',
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
      })

      // Rodapé com paginação
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      const timestamp = formatLocalDate()
      doc.save(`${filename}_${timestamp}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }, [])

  return {
    exporting,
    exportProgress,
    fetchAllResults,
    getExportCount,
    exportToCSV,
    exportToXLSX,
    exportToPDF,
    EXPORT_CONFIG,
  }
}

export default useOSPesquisaExport
