/**
 * Utilitários para cálculos e formatação de dados exibidos na UI
 */

/**
 * Formata data para formato pt-BR
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

/**
 * Calcula quantos dias restam até uma data final
 */
export function calcularDiasRestantes(dataFim) {
  if (!dataFim) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(dataFim)
  fim.setHours(0, 0, 0, 0)
  const diff = fim - hoje
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Retorna a classe CSS do badge baseado em dias restantes
 */
export function getBadgeClass(dataFim) {
  const dias = calcularDiasRestantes(dataFim)
  if (dias === null) return ''
  if (dias < 0) return 'badge-danger'
  if (dias <= 60) return 'badge-warning'
  return 'badge-success'
}

/**
 * Formata texto de exibição de dias restantes
 */
export function formatDiasRestantes(dataFim) {
  const dias = calcularDiasRestantes(dataFim)
  if (dias === null) return ''
  return dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`
}

/**
 * Gera título de vínculo para exibição compacta
 */
export function getTituloVinculo(vinculo) {
  if (vinculo.tipo_vinculo === 'EMPRESA' && vinculo.empresa_nome) {
    return vinculo.empresa_nome
  }
  if (vinculo.tipo_vinculo === 'PARTICULAR') {
    return 'Particular (Autônomo)'
  }
  return 'Novo Vínculo'
}
