import api from './api'

// =============================================================================
// CONTRATOS
// =============================================================================

export const getContratos = (params) => api.get('/api/v1/contratos/', { params })
export const getContrato = (id) => api.get(`/api/v1/contratos/${id}/`)
export const createContrato = (data) => api.post('/api/v1/contratos/', data)
export const updateContrato = (id, data) => api.patch(`/api/v1/contratos/${id}/`, data)
export const deleteContrato = (id) => api.delete(`/api/v1/contratos/${id}/`)

// Search para autocomplete (busca por número ou empresa contratante)
export const searchContratos = (search) => api.get('/api/v1/contratos/ativos/', { params: { search } })

// Actions do contrato
export const getContratoServicos = (id) => api.get(`/api/v1/contratos/${id}/servicos/`)
export const getContratoServicosDisponiveis = (id) => api.get(`/api/v1/contratos/${id}/servicos-disponiveis/`)
export const getContratoOrdensServico = (id) => api.get(`/api/v1/contratos/${id}/ordens-servico/`)
export const getContratosAtivos = () => api.get('/api/v1/contratos/ativos/')
export const ativarContrato = (id) => api.post(`/api/v1/contratos/${id}/ativar/`)
export const finalizarContrato = (id) => api.post(`/api/v1/contratos/${id}/finalizar/`)
export const cancelarContrato = (id) => api.post(`/api/v1/contratos/${id}/cancelar/`)

// =============================================================================
// SERVIÇOS DO CONTRATO
// =============================================================================

export const getContratoServicosAll = (params) => api.get('/api/v1/contrato-servicos/', { params })
export const getContratoServico = (id) => api.get(`/api/v1/contrato-servicos/${id}/`)
export const createContratoServico = (data) => api.post('/api/v1/contrato-servicos/', data)
export const updateContratoServico = (id, data) => api.patch(`/api/v1/contrato-servicos/${id}/`, data)
export const deleteContratoServico = (id) => api.delete(`/api/v1/contrato-servicos/${id}/`)
