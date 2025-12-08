import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { pesquisaUnificada } from '../services/titulares'
import { prepareExportData, formatDate } from '../utils/pesquisaHelpers'

/**
 * Hook para gerenciar exportações (CSV, XLSX, PDF)
 * Responsabilidades:
 * - Buscar dados para exportação
 * - Formatar dados para cada tipo de exportação
 * - Executar downloads
 * - Gerenciar estado de carregamento
 */
function usePesquisaExport() {
  const [exporting, setExporting] = useState(false)

  // Buscar todos os resultados para exportação
  const fetchAllResults = useCallback(async (filters) => {
    try {
      const params = buildExportParams(filters)
      const response = await pesquisaUnificada(params)
      return response.data.results || []
    } catch (error) {
      console.error('Erro ao buscar dados para exportação:', error)
      throw error
    }
  }, [])

  // Exportar para CSV
  const exportToCSV = useCallback(async (data, filename = 'pesquisa_atlas') => {
    setExporting(true)
    try {
      const exportData = prepareExportData(data)
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
      const timestamp = new Date().toISOString().split('T')[0]
      saveAs(blob, `${filename}_${timestamp}.csv`)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }, [])

  // Exportar para XLSX
  const exportToXLSX = useCallback(async (data, filename = 'pesquisa_atlas') => {
    setExporting(true)
    try {
      const exportData = prepareExportData(data)

      const ws = XLSX.utils.json_to_sheet(exportData)

      const colWidths = Object.keys(exportData[0]).map(key => ({
        wch: Math.max(key.length, ...exportData.map(row => String(row[key] || '').length).slice(0, 50)) + 2,
      }))
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Pesquisa')

      const timestamp = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)
    } catch (error) {
      console.error('Erro ao exportar XLSX:', error)
      throw error
    } finally {
      setExporting(false)
    }
  }, [])

  // Exportar para PDF
  const exportToPDF = useCallback(async (data, filename = 'pesquisa_atlas') => {
    setExporting(true)
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')

      // Título
      doc.setFontSize(16)
      doc.text('Pesquisa Avançada - Atlas', 14, 15)

      // Info
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22)
      doc.text(`Total de registros: ${data.length}`, 14, 27)

      // Preparar dados para tabela
      const tableColumns = ['Nome', 'Tipo', 'Vínculo/Relação', 'Amparo', 'RNM', 'Fim Vínculo', 'Status']
      const tableData = data.map(item => [
        item.nome || '-',
        item.type === 'titular' ? 'Titular' : 'Dependente',
        item.type === 'titular'
          ? `${item.tipoVinculo || ''}${item.empresa ? ` ${item.empresa}` : ''}`.trim() || '-'
          : `${item.tipoDependente || 'Dep.'} de ${item.titularNome?.split(' ')[0] || ''}`,
        item.amparo || '-',
        item.rnm || '-',
        formatDate(item.dataFimVinculo),
        item.type === 'titular'
          ? item.status ? 'Ativo' : item.status === false ? 'Inativo' : 'Sem Vínculo'
          : 'Ativo',
      ])

      // Gerar tabela
      autoTable(doc, {
        head: [tableColumns],
        body: tableData,
        startY: 32,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20 },
          2: { cellWidth: 50 },
          3: { cellWidth: 40 },
          4: { cellWidth: 30 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
        },
      })

      // Rodapé
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

      const timestamp = new Date().toISOString().split('T')[0]
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

// Função auxiliar para construir parâmetros de exportação
function buildExportParams(filters) {
  const params = {
    page: 1,
    page_size: 1000,
  }

  if (filters.searchTerm) params.search = filters.searchTerm
  if (filters.nacionalidade) params.nacionalidade = filters.nacionalidade
  if (filters.consulado) params.consulado = filters.consulado
  if (filters.empresa) params.empresa = filters.empresa
  if (filters.tipoVinculo) params.tipo_vinculo = filters.tipoVinculo
  if (filters.status) params.vinculo_status = filters.status === 'ativo' ? 'true' : 'false'

  if (filters.tipoEvento) {
    params.tipo_evento = filters.tipoEvento
    if (filters.periodo) {
      const { dataDe, dataAte } = calculatePeriodDates(filters)
      if (dataDe) params.data_de = dataDe
      if (dataAte) params.data_ate = dataAte
    } else {
      if (filters.dataDe) params.data_de = filters.dataDe
      if (filters.dataAte) params.data_ate = filters.dataAte
    }
  }

  return params
}

function calculatePeriodDates(filters) {
  if (!filters.tipoEvento || !filters.periodo) {
    return { dataDe: null, dataAte: null }
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diasOffset = parseInt(filters.periodo) || 0

  const dataLimite = new Date(hoje)
  if (filters.periodoPosterior) {
    dataLimite.setDate(dataLimite.getDate() + diasOffset)
  } else {
    dataLimite.setDate(dataLimite.getDate() - diasOffset)
  }

  const hojeStr = hoje.toISOString().split('T')[0]
  const dataLimiteStr = dataLimite.toISOString().split('T')[0]

  if (filters.periodoPosterior) {
    return { dataDe: hojeStr, dataAte: dataLimiteStr }
  } else {
    return { dataDe: dataLimiteStr, dataAte: hojeStr }
  }
}

export default usePesquisaExport
