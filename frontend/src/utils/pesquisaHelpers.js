/**
 * Utilidades para a página Pesquisa
 * Funções puras sem estado - formatação, cálculos e processamento de dados
 */

/**
 * Formata uma data no formato ISO para formato brasileiro
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

/**
 * Calcula dias restantes até uma data
 */
export function calcularDiasRestantes(dataFim) {
  if (!dataFim) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(dataFim)
  fim.setHours(0, 0, 0, 0)
  const diffTime = fim - hoje
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Retorna classe CSS para linha baseado em vencimento
 */
export function getRowClass(dataFim, type) {
  let baseClass = type === 'dependente' ? 'row-dependente' : ''
  if (type === 'dependente-orphan') baseClass = 'row-dependente row-orphan'

  const dias = calcularDiasRestantes(dataFim)
  if (dias === null) return baseClass
  if (dias < 0) return `${baseClass} row-expired`
  if (dias <= 60) return `${baseClass} row-warning`
  return baseClass
}

/**
 * Retorna classe CSS para badge baseado em dias restantes
 */
export function getBadgeClass(dataFim) {
  const dias = calcularDiasRestantes(dataFim)
  if (dias === null) return 'badge-secondary'
  if (dias < 0) return 'badge-danger'
  if (dias <= 30) return 'badge-warning'
  if (dias <= 90) return 'badge-info'
  return 'badge-success'
}

/**
 * Retorna texto formatado para dias restantes (ex: "5d", "3d atrás")
 */
export function formatDiasRestantes(dataFim) {
  const dias = calcularDiasRestantes(dataFim)
  if (dias === null) return ''
  if (dias < 0) return `${Math.abs(dias)}d atrás`
  return `${dias}d`
}

/**
 * Calcula datas de período baseado em filtros
 */
export function calcularDatasDoPerido(filters) {
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

/**
 * Constrói parâmetros para requisição de busca
 */
export function buildSearchParams(filters, page = 1, pageSize = 20) {
  const params = {
    page,
    page_size: pageSize,
  }

  // Busca
  if (filters.searchTerm) {
    params.search = filters.searchTerm
  }

  // Campo de busca
  if (filters.searchField === 'titular') {
    params.tipo = 'titular'
  } else if (filters.searchField === 'dependente') {
    params.tipo = 'dependente'
  } else if (filters.searchField && filters.searchField !== 'todos') {
    params.search_field = filters.searchField
  }

  // Filtros
  if (filters.nacionalidade) params.nacionalidade = filters.nacionalidade
  if (filters.consulado) params.consulado = filters.consulado
  if (filters.empresa) params.empresa = filters.empresa
  if (filters.tipoVinculo) params.tipo_vinculo = filters.tipoVinculo
  if (filters.status) params.vinculo_status = filters.status === 'ativo' ? 'true' : 'false'

  // Datas
  if (filters.tipoEvento) {
    params.tipo_evento = filters.tipoEvento

    if (filters.periodo) {
      const { dataDe, dataAte } = calcularDatasDoPerido(filters)
      if (dataDe) params.data_de = dataDe
      if (dataAte) params.data_ate = dataAte
    } else {
      if (filters.dataDe) params.data_de = filters.dataDe
      if (filters.dataAte) params.data_ate = filters.dataAte
    }
  }

  return params
}

/**
 * Prepara dados para exportação em formato estruturado
 */
export function prepareExportData(data) {
  return data.map(item => ({
    'Nome': item.nome || '-',
    'Tipo': item.type === 'titular' ? 'Titular' : 'Dependente',
    'Vínculo/Relação':
      item.type === 'titular'
        ? `${item.tipoVinculo || ''}${item.empresa ? ` ${item.empresa}` : ''}`.trim() || '-'
        : `${item.tipoDependente || 'Dependente'} de ${item.titularNome}`,
    'Amparo': item.amparo || '-',
    'RNM': item.rnm || '-',
    'CPF': item.cpf || '-',
    'Passaporte': item.passaporte || '-',
    'Nacionalidade': item.nacionalidade || '-',
    'Data Nascimento': formatDate(item.dataNascimento),
    'Data Fim Vínculo': formatDate(item.dataFimVinculo),
    'Status':
      item.type === 'titular'
        ? item.status ? 'Ativo' : item.status === false ? 'Inativo' : 'Sem Vínculo'
        : 'Ativo',
    'Email': item.email || '-',
    'Telefone': item.telefone || '-',
  }))
}

/**
 * Retorna texto de status para um item
 */
export function getStatusText(item) {
  if (item.type === 'titular') {
    return item.status ? 'Ativo' : item.status === false ? 'Inativo' : 'Sem Vínculo'
  }
  return 'Ativo'
}

/**
 * Retorna classe de badge para status
 */
export function getStatusBadgeClass(item) {
  if (item.type === 'titular') {
    return item.status ? 'badge-success' : item.status === false ? 'badge-danger' : 'badge-secondary'
  }
  return 'badge-success'
}

/**
 * Retorna texto de tipo para um item
 */
export function getTypeText(item) {
  return item.type === 'titular' ? 'Titular' : 'Dependente'
}

/**
 * Retorna classe de badge para tipo
 */
export function getTypeBadgeClass(item) {
  return item.type === 'titular' ? 'tipo-titular' : 'tipo-dependente'
}
