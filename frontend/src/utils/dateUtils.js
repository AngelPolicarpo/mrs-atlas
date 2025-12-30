/**
 * Utilitários para manipulação de datas
 * Evita problemas de timezone onde toISOString() converte para UTC
 * causando diferença de dia em fusos horários negativos (ex: UTC-3 BRT)
 */

/**
 * Formata uma data para YYYY-MM-DD usando a data LOCAL (não UTC)
 * Use esta função ao invés de date.toISOString().split('T')[0]
 * 
 * @param {Date} date - Data a ser formatada (padrão: data atual)
 * @returns {string} Data no formato YYYY-MM-DD
 * 
 * @example
 * // Se hoje é 22/12/2025 23:30 em São Paulo (UTC-3):
 * new Date().toISOString().split('T')[0]  // "2025-12-23" (ERRADO! UTC)
 * formatLocalDate()                        // "2025-12-22" (CORRETO! Local)
 */
export function formatLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD (local)
 * Wrapper conveniente para formatLocalDate()
 */
export function getTodayString() {
  return formatLocalDate(new Date())
}

/**
 * Adiciona dias a uma data e retorna no formato YYYY-MM-DD (local)
 * 
 * @param {Date} date - Data base
 * @param {number} days - Número de dias a adicionar (pode ser negativo)
 * @returns {string} Data resultante no formato YYYY-MM-DD
 */
export function addDaysFormatted(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return formatLocalDate(result)
}

/**
 * Subtrai dias de uma data e retorna no formato YYYY-MM-DD (local)
 * 
 * @param {Date} date - Data base
 * @param {number} days - Número de dias a subtrair
 * @returns {string} Data resultante no formato YYYY-MM-DD
 */
export function subtractDaysFormatted(date, days) {
  return addDaysFormatted(date, -days)
}

/**
 * Converte string YYYY-MM-DD para Date
 * Cria a data no timezone local sem conversão UTC
 * 
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {Date} Objeto Date no timezone local
 */
export function parseLocalDate(dateString) {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Formata data para exibição em pt-BR (DD/MM/YYYY)
 * Usa timeZone: 'UTC' para evitar conversão de timezone
 * que causa a data aparecer como dia anterior
 * 
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada em pt-BR ou '-' se vazio
 */
export function formatDisplayDate(dateString) {
  if (!dateString) return '-'
  try {
    // Usar timeZone: 'UTC' para interpretar a data como UTC
    // evitando conversão para timezone local que causa diferença de dia
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'UTC'
    })
  } catch {
    return dateString
  }
}
