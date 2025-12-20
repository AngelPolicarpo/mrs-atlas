import api from './api'

// =============================================================================
// ORDENS DE SERVIÇO
// =============================================================================

export const getOrdensServico = (params) => api.get('/api/v1/ordens-servico/', { params })
export const getOrdemServico = (id) => api.get(`/api/v1/ordens-servico/${id}/`)
export const createOrdemServico = (data) => api.post('/api/v1/ordens-servico/', data)
export const updateOrdemServico = (id, data) => api.patch(`/api/v1/ordens-servico/${id}/`, data)
export const deleteOrdemServico = (id) => api.delete(`/api/v1/ordens-servico/${id}/`)

// Actions customizadas
export const getOrdemServicoTitulares = (id) => api.get(`/api/v1/ordens-servico/${id}/titulares/`)
export const getOrdemServicoDependentes = (id) => api.get(`/api/v1/ordens-servico/${id}/dependentes/`)
export const getOrdemServicoItens = (id) => api.get(`/api/v1/ordens-servico/${id}/itens/`)
export const getOrdemServicoDespesas = (id) => api.get(`/api/v1/ordens-servico/${id}/despesas/`)
export const getServicosDisponiveis = (id) => api.get(`/api/v1/ordens-servico/${id}/servicos-disponiveis/`)
export const recalcularOrdemServico = (id) => api.post(`/api/v1/ordens-servico/${id}/recalcular/`)
export const finalizarOrdemServico = (id) => api.post(`/api/v1/ordens-servico/${id}/finalizar/`)
export const cancelarOrdemServico = (id) => api.post(`/api/v1/ordens-servico/${id}/cancelar/`)
export const getEstatisticasOS = () => api.get('/api/v1/ordens-servico/estatisticas/')

// =============================================================================
// EMPRESAS PRESTADORAS (Centro de Custos)
// =============================================================================

export const getEmpresasPrestadoras = (params) => api.get('/api/v1/empresas-prestadoras/', { params })
export const getEmpresaPrestadora = (id) => api.get(`/api/v1/empresas-prestadoras/${id}/`)
export const createEmpresaPrestadora = (data) => api.post('/api/v1/empresas-prestadoras/', data)
export const updateEmpresaPrestadora = (id, data) => api.patch(`/api/v1/empresas-prestadoras/${id}/`, data)
export const deleteEmpresaPrestadora = (id) => api.delete(`/api/v1/empresas-prestadoras/${id}/`)

// Search para autocomplete
export const searchEmpresasPrestadoras = (search) => api.get('/api/v1/empresas-prestadoras/', { params: { search, ativo: true, page_size: 20 } })

// =============================================================================
// CATÁLOGO DE SERVIÇOS
// =============================================================================

export const getServicos = (params) => api.get('/api/v1/servicos/', { params })
export const getServico = (id) => api.get(`/api/v1/servicos/${id}/`)
export const createServico = (data) => api.post('/api/v1/servicos/', data)
export const updateServico = (id, data) => api.patch(`/api/v1/servicos/${id}/`, data)
export const deleteServico = (id) => api.delete(`/api/v1/servicos/${id}/`)
export const getServicosAtivos = () => api.get('/api/v1/servicos/ativos/')

// Search para autocomplete
export const searchServicos = (search) => api.get('/api/v1/servicos/', { params: { search, ativo: true, page_size: 20 } })

// =============================================================================
// CATÁLOGO DE TIPOS DE DESPESA
// =============================================================================

export const getTiposDespesa = (params) => api.get('/api/v1/tipos-despesa/', { params })
export const getTipoDespesa = (id) => api.get(`/api/v1/tipos-despesa/${id}/`)
export const createTipoDespesa = (data) => api.post('/api/v1/tipos-despesa/', data)
export const updateTipoDespesa = (id, data) => api.patch(`/api/v1/tipos-despesa/${id}/`, data)
export const deleteTipoDespesa = (id) => api.delete(`/api/v1/tipos-despesa/${id}/`)
export const getTiposDespesaAtivos = () => api.get('/api/v1/tipos-despesa/ativos/')

// Search para autocomplete
export const searchTiposDespesa = (search) => api.get('/api/v1/tipos-despesa/', { params: { search, ativo: true, page_size: 20 } })

// =============================================================================
// ITENS DA OS (serviços do contrato)
// =============================================================================

export const getOSItens = (params) => api.get('/api/v1/os-itens/', { params })
export const getOSItem = (id) => api.get(`/api/v1/os-itens/${id}/`)
export const createOSItem = (data) => api.post('/api/v1/os-itens/', data)
export const updateOSItem = (id, data) => api.patch(`/api/v1/os-itens/${id}/`, data)
export const deleteOSItem = (id) => api.delete(`/api/v1/os-itens/${id}/`)

// =============================================================================
// DESPESAS DA OS
// =============================================================================

export const getDespesasOS = (params) => api.get('/api/v1/despesas-os/', { params })
export const getDespesaOS = (id) => api.get(`/api/v1/despesas-os/${id}/`)
export const createDespesaOS = (data) => api.post('/api/v1/despesas-os/', data)
export const updateDespesaOS = (id, data) => api.patch(`/api/v1/despesas-os/${id}/`, data)
export const deleteDespesaOS = (id) => api.delete(`/api/v1/despesas-os/${id}/`)

// =============================================================================
// VINCULAÇÃO DE TITULARES À OS
// =============================================================================

export const getOSTitulares = (params) => api.get('/api/v1/os-titulares/', { params })
export const getOSTitular = (id) => api.get(`/api/v1/os-titulares/${id}/`)
export const createOSTitular = (data) => api.post('/api/v1/os-titulares/', data)
export const updateOSTitular = (id, data) => api.patch(`/api/v1/os-titulares/${id}/`, data)
export const deleteOSTitular = (id) => api.delete(`/api/v1/os-titulares/${id}/`)

// =============================================================================
// VINCULAÇÃO DE DEPENDENTES À OS
// =============================================================================

export const getOSDependentes = (params) => api.get('/api/v1/os-dependentes/', { params })
export const getOSDependente = (id) => api.get(`/api/v1/os-dependentes/${id}/`)
export const createOSDependente = (data) => api.post('/api/v1/os-dependentes/', data)
export const updateOSDependente = (id, data) => api.patch(`/api/v1/os-dependentes/${id}/`, data)
export const deleteOSDependente = (id) => api.delete(`/api/v1/os-dependentes/${id}/`)
