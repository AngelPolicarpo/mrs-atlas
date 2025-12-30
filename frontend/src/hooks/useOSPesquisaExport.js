import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { getOrdensServico } from '../services/ordemServico'
import { prepareOSExportData, formatDate, formatCurrency, buildOSSearchParams } from '../utils/osPesquisaHelpers'
import { formatLocalDate } from '../utils/dateUtils'

/**
 * Hook para gerenciar exportações de OS (CSV, XLSX, PDF)
 * Responsabilidades:
 * - Buscar dados para exportação
 * - Formatar dados para cada tipo de exportação
 * - Executar downloads
 * - Gerenciar estado de carregamento
 */
function useOSPesquisaExport() {
  const [exporting, setExporting] = useState(false)

  // Buscar todos os resultados para exportação
  const fetchAllResults = useCallback(async (filters) => {
    try {
      const params = buildOSSearchParams(filters, 1, 10000) // Limite alto para pegar todos
      const response = await getOrdensServico(params)
      return response.data.results || []
    } catch (error) {
      console.error('Erro ao buscar dados para exportação:', error)
      throw error
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

      // Data de geração
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22)

      // Preparar dados para tabela
      const exportData = prepareOSExportData(data)
      const headers = Object.keys(exportData[0])
      const rows = exportData.map(row => headers.map(h => row[h] || ''))

      // Gerar tabela
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 28 },
      })

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
    fetchAllResults,
    exportToCSV,
    exportToXLSX,
    exportToPDF,
  }
}

export default useOSPesquisaExport
