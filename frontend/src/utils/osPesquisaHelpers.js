/**
 * Funções auxiliares para Pesquisa Avançada de Ordens de Serviço
 * Responsabilidades:
 * - Formatação de datas e valores
 * - Preparação de parâmetros de busca
 * - Preparação de dados para exportação
 * - Classes de estilo baseadas em status
 */

/**
 * Formata data para exibição pt-BR
 * Usa timeZone: 'UTC' para evitar conversão que causa diferença de dia
 */
export function formatDate(dateString) {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'UTC'
    })
  } catch {
    return dateString
  }
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Retorna classe CSS baseada no status da OS
 */
export function getStatusBadgeClass(status) {
  const classes = {
    'ABERTA': 'badge-info',
    'FINALIZADA': 'badge-success',
    'CANCELADA': 'badge-danger',
  }
  return classes[status] || 'badge-secondary'
}

/**
 * Retorna texto do status
 */
export function getStatusText(status, statusDisplay) {
  return statusDisplay || status || '-'
}

/**
 * Retorna classe da linha baseada no status
 */
export function getRowClass(os) {
  if (os.status === 'CANCELADA') return 'row-cancelled'
  if (os.status === 'FINALIZADA') return 'row-completed'
  return ''
}

/**
 * Constrói parâmetros de busca a partir dos filtros
 */
export function buildOSSearchParams(filters, page = 1, pageSize = 10) {
  const params = {
    page,
    page_size: pageSize,
  }

  // Busca geral
  if (filters.searchTerm) {
    params.search = filters.searchTerm
  }

  // Status
  if (filters.status) {
    params.status = filters.status
  }

  // Contrato
  if (filters.contrato) {
    params.contrato = filters.contrato
  }

  // Empresa Solicitante
  if (filters.empresaSolicitante) {
    params.empresa_solicitante = filters.empresaSolicitante
  }

  // Empresa Pagadora
  if (filters.empresaPagadora) {
    params.empresa_pagadora = filters.empresaPagadora
  }

  // Centro de Custos
  if (filters.centroCustos) {
    params.centro_custos = filters.centroCustos
  }

  // Titular vinculado (requer endpoint customizado ou filtro no backend)
  if (filters.titular) {
    params.titular = filters.titular
  }

  // Dependente vinculado
  if (filters.dependente) {
    params.dependente = filters.dependente
  }

  // Período de abertura
  if (filters.dataAberturaDe) {
    params.data_abertura_after = filters.dataAberturaDe
  }
  if (filters.dataAberturaAte) {
    params.data_abertura_before = filters.dataAberturaAte
  }

  // Período de fechamento
  if (filters.dataFechamentoDe) {
    params.data_fechamento_after = filters.dataFechamentoDe
  }
  if (filters.dataFechamentoAte) {
    params.data_fechamento_before = filters.dataFechamentoAte
  }

  // Valores
  if (filters.valorMinimo) {
    params.valor_total_min = filters.valorMinimo
  }
  if (filters.valorMaximo) {
    params.valor_total_max = filters.valorMaximo
  }

  return params
}

/**
 * Prepara dados de OS para exportação
 */
export function prepareOSExportData(data) {
  return data.map(os => ({
    'Número': os.numero || '',
    'Data Abertura': formatDate(os.data_abertura),
    'Data Fechamento': formatDate(os.data_fechamento),
    'Status': os.status_display || os.status || '',
    'Contrato': os.contrato_numero || '',
    'Empresa Contratante': os.empresa_contratante_nome || '',
    'Empresa Solicitante': os.empresa_solicitante_nome || '',
    'Empresa Pagadora': os.empresa_pagadora_nome || '',
    'Centro de Custos': os.centro_custos_nome || '',
    'Responsável': os.responsavel_nome || '',
    'Valor Serviços': formatCurrency(os.valor_servicos),
    'Valor Despesas': formatCurrency(os.valor_despesas),
    'Valor Total': formatCurrency(os.valor_total),
    'Qtd. Titulares': os.qtd_titulares || 0,
    'Qtd. Dependentes': os.qtd_dependentes || 0,
    'Qtd. Itens': os.qtd_itens || 0,
    'Data Criação': formatDate(os.data_criacao),
  }))
}

/**
 * Calcula dias desde abertura da OS
 */
export function calcularDiasAbertos(dataAbertura) {
  if (!dataAbertura) return null
  const abertura = new Date(dataAbertura)
  const hoje = new Date()
  const diffTime = hoje - abertura
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Formata dias abertos para exibição
 */
export function formatDiasAbertos(dataAbertura) {
  const dias = calcularDiasAbertos(dataAbertura)
  if (dias === null) return ''
  if (dias === 0) return 'Hoje'
  if (dias === 1) return '1 dia'
  return `${dias} dias`
}

/**
 * Badge class para dias abertos
 */
export function getDiasAbertosBadgeClass(dataAbertura, status) {
  if (status !== 'ABERTA') return ''
  const dias = calcularDiasAbertos(dataAbertura)
  if (dias === null) return ''
  if (dias > 30) return 'badge-danger'
  if (dias > 15) return 'badge-warning'
  return 'badge-info'
}
