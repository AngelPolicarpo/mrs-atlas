import api from './api'

// Amparos Legais
export const getAmparosLegais = (params) => api.get('/api/v1/amparos-legais/', { params })
export const getAmparoLegal = (id) => api.get(`/api/v1/amparos-legais/${id}/`)
export const createAmparoLegal = (data) => api.post('/api/v1/amparos-legais/', data)
export const updateAmparoLegal = (id, data) => api.patch(`/api/v1/amparos-legais/${id}/`, data)
export const deleteAmparoLegal = (id) => api.delete(`/api/v1/amparos-legais/${id}/`)

// Tipos de Atualização
export const getTiposAtualizacao = (params) => api.get('/api/v1/tipos-atualizacao/', { params })
export const getTipoAtualizacao = (id) => api.get(`/api/v1/tipos-atualizacao/${id}/`)
export const createTipoAtualizacao = (data) => api.post('/api/v1/tipos-atualizacao/', data)
export const updateTipoAtualizacao = (id, data) => api.patch(`/api/v1/tipos-atualizacao/${id}/`, data)
export const deleteTipoAtualizacao = (id) => api.delete(`/api/v1/tipos-atualizacao/${id}/`)
