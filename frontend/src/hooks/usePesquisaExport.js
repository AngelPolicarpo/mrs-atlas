import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { pesquisaUnificada } from '../services/titulares'
import { prepareExportData, formatDate } from '../utils/pesquisaHelpers'
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
 * Hook para gerenciar exportações (CSV, XLSX, PDF)
 * Responsabilidades:
 * - Buscar dados com paginação completa
 * - Formatar dados para cada tipo de exportação
 * - Executar downloads
 * - Gerenciar estado de carregamento e progresso
 */
function usePesquisaExport() {
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, message: '' })

  /**
   * Buscar todos os resultados para exportação COM PAGINAÇÃO
   * Itera sobre todas as páginas da API até obter todos os registros
   * 
   * IMPORTANTE: A API retorna `count` = total de titulares (base para paginação)
   * mas `results` inclui titulares + dependentes + múltiplos vínculos.
   * Usamos has_next para controlar quando parar.
   */
  const fetchAllResults = useCallback(async (filters, onProgress = null) => {
    const allResults = []
    let currentPage = 1
    let totalPages = 1
    let titularesCount = 0
    let hasNext = true

    try {
      // Primeira requisição para obter metadados de paginação
      const params = buildExportParams(filters, currentPage, EXPORT_CONFIG.PAGE_SIZE)
      const firstResponse = await pesquisaUnificada(params)
      
      titularesCount = firstResponse.data.count || 0
      totalPages = firstResponse.data.total_pages || 1
      hasNext = firstResponse.data.has_next || false
      const firstResults = firstResponse.data.results || []
      allResults.push(...firstResults)

      // Verificar limites baseado no count de titulares
      if (titularesCount > EXPORT_CONFIG.MAX_RECORDS) {
        throw new Error(`A exportação está limitada a ${EXPORT_CONFIG.MAX_RECORDS.toLocaleString()} registros. Sua busca retornou ${titularesCount.toLocaleString()} titulares. Por favor, refine seus filtros.`)
      }
      
      console.log(`[Export] Iniciando: ${titularesCount} titulares em ${totalPages} páginas`)

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
          const pageParams = buildExportParams(filters, currentPage, EXPORT_CONFIG.PAGE_SIZE)
          const response = await pesquisaUnificada(pageParams)
          const results = response.data.results || []
          hasNext = response.data.has_next || false
          
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
            console.log(`[Export] Progresso: ${Math.round(currentPage/totalPages*100)}% - Página ${currentPage}/${totalPages} (${allResults.length.toLocaleString()} registros)`)
          }
        } catch (pageError) {
          console.error(`[Export] Erro na página ${currentPage}:`, pageError)
        }
      }
      
      console.log(`[Export] Finalizado: ${allResults.length.toLocaleString()} registros de ${totalPages} páginas`)
      return allResults
    } catch (error) {
      console.error('Erro ao buscar dados para exportação:', error)
      throw error
    }
  }, [])

  /**
   * Obtém contagem de titulares e estimativa de registros para validação prévia
   * Retorna { titulares, totalPages, recordsEstimate }
   */
  const getExportCount = useCallback(async (filters) => {
    try {
      const params = buildExportParams(filters, 1, EXPORT_CONFIG.PAGE_SIZE)
      const response = await pesquisaUnificada(params)
      const titulares = response.data.count || 0
      const totalPages = response.data.total_pages || 1
      const recordsInFirstPage = response.data.results?.length || 0
      
      // Estimar total de registros baseado na primeira página
      // (titulares + dependentes + múltiplos vínculos)
      const recordsEstimate = recordsInFirstPage * totalPages
      
      return {
        titulares,
        totalPages,
        recordsEstimate,
        // Retornar count para compatibilidade
        count: titulares
      }
    } catch (error) {
      console.error('Erro ao obter contagem:', error)
      return { titulares: 0, totalPages: 0, recordsEstimate: 0, count: 0 }
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
  const exportToPDF = useCallback(async (data, filename = 'pesquisa_atlas') => {
    setExporting(true)
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      
      // A4 landscape = 297mm x 210mm, margem de 14mm cada lado = 269mm utilizáveis
      const pageWidth = doc.internal.pageSize.getWidth()
      const margins = 28 // 14mm cada lado
      const usableWidth = pageWidth - margins

      // Título
      doc.setFontSize(16)
      doc.text('Pesquisa Avançada - Atlas', 14, 15)

      // Info
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22)
      doc.text(`Total de registros: ${data.length.toLocaleString()}`, 14, 27)

      // Preparar dados para tabela - colunas otimizadas para caber na página
      const tableColumns = ['Nome', 'Tipo', 'Vínculo/Relação', 'Amparo', 'RNM', 'Fim Vínculo', 'Status']
      const tableData = data.map(item => [
        (item.nome || '-').substring(0, 40), // Limitar nome para caber
        item.type === 'titular' ? 'Titular' : 'Dep.',
        item.type === 'titular'
          ? (`${item.tipoVinculo || ''}${item.empresa ? ` ${item.empresa}` : ''}`.trim() || '-').substring(0, 35)
          : `${(item.tipoDependente || 'Dep.').substring(0, 10)} de ${(item.titularNome?.split(' ')[0] || '').substring(0, 15)}`,
        (item.amparo || '-').substring(0, 25),
        item.rnm || '-',
        formatDate(item.dataFimVinculo),
        item.type === 'titular'
          ? item.status ? 'Ativo' : item.status === false ? 'Inativo' : 'S/Vínc'
          : 'Ativo',
      ])

      // Gerar tabela com colunas proporcionais ao espaço disponível
      // Total: ~269mm disponíveis
      autoTable(doc, {
        head: [tableColumns],
        body: tableData,
        startY: 32,
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          overflow: 'ellipsize', // Truncar texto que não cabe
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 55 },  // Nome
          1: { cellWidth: 18 },  // Tipo
          2: { cellWidth: 55 },  // Vínculo/Relação
          3: { cellWidth: 40 },  // Amparo
          4: { cellWidth: 28 },  // RNM
          5: { cellWidth: 22 },  // Fim Vínculo
          6: { cellWidth: 18 },  // Status
          // Total: ~236mm (cabe em 269mm)
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

// Função auxiliar para construir parâmetros de exportação
function buildExportParams(filters, page = 1, pageSize = EXPORT_CONFIG.PAGE_SIZE) {
  const params = {
    page,
    page_size: pageSize,
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

  const hojeStr = formatLocalDate(hoje)
  const dataLimiteStr = formatLocalDate(dataLimite)

  if (filters.periodoPosterior) {
    return { dataDe: hojeStr, dataAte: dataLimiteStr }
  } else {
    return { dataDe: dataLimiteStr, dataAte: hojeStr }
  }
}

export default usePesquisaExport
