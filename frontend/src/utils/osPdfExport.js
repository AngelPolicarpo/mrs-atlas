/**
 * Utilitário para exportação de Ordem de Serviço em PDF
 * Formato: Orçamento de Serviços (documento formal)
 * 
 * A geração do PDF é feita no backend para garantir:
 * - Hash SHA-256 calculado sobre o arquivo PDF real
 * - Validação de integridade funcional
 * - Rastreabilidade completa
 * 
 * @module utils/osPdfExport
 */

import api from '../services/api'

/**
 * Exporta a Ordem de Serviço para PDF via backend
 * 
 * O backend gera o PDF, calcula o hash SHA-256 sobre o arquivo,
 * registra o documento e retorna o arquivo para download.
 * 
 * @param {Object} os - Dados da Ordem de Serviço (precisa ter o id)
 * @param {Object} options - Opções de exportação
 * @param {string} options.filename - Nome do arquivo (opcional)
 * @returns {Promise<Object>} Dados do documento registrado
 */
export async function exportOSToPDF(os, options = {}) {
  if (!os?.id) {
    throw new Error('ID da Ordem de Serviço é obrigatório')
  }

  try {
    // Chama o endpoint de geração de PDF no backend
    const response = await api.post(
      `/api/v1/ordens-servico/${os.id}/gerar-pdf/`,
      {},
      {
        responseType: 'blob', // Importante: receber como blob
      }
    )

    // Extrai informações dos headers customizados
    const documentoId = response.headers['x-documento-id']
    const documentoCodigo = response.headers['x-documento-codigo']
    const documentoVersao = response.headers['x-documento-versao']
    const documentoHash = response.headers['x-documento-hash']

    // Define o nome do arquivo
    const contentDisposition = response.headers['content-disposition']
    let filename = options.filename || `orcamento_os_${os.numero}`
    
    // Tenta extrair nome do header Content-Disposition
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1].replace('.pdf', '')
      }
    }

    // Cria blob e faz download
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Retorna informações do documento
    return {
      id: documentoId,
      codigo: documentoCodigo,
      versao: parseInt(documentoVersao, 10),
      hash: documentoHash,
    }
  } catch (error) {
    console.error('Erro ao exportar PDF:', error)
    
    // Tenta extrair mensagem de erro do backend
    if (error.response?.data) {
      // Se for um blob, converte para texto
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const json = JSON.parse(text)
          throw new Error(json.error || 'Erro ao gerar PDF')
        } catch {
          throw new Error('Erro ao gerar PDF')
        }
      }
      throw new Error(error.response.data.error || 'Erro ao gerar PDF')
    }
    
    throw new Error('Não foi possível gerar o PDF. Tente novamente.')
  }
}

export default exportOSToPDF
