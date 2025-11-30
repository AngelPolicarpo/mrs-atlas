import api from './api'

// Nacionalidades
export const getNacionalidades = (params) => api.get('/api/v1/nacionalidades/', { params })
export const getNacionalidade = (id) => api.get(`/api/v1/nacionalidades/${id}/`)
export const createNacionalidade = (data) => api.post('/api/v1/nacionalidades/', data)
export const updateNacionalidade = (id, data) => api.patch(`/api/v1/nacionalidades/${id}/`, data)
export const deleteNacionalidade = (id) => api.delete(`/api/v1/nacionalidades/${id}/`)

// Amparos Legais
export const getAmparosLegais = (params) => api.get('/api/v1/amparos-legais/', { params })
export const getAmparoLegal = (id) => api.get(`/api/v1/amparos-legais/${id}/`)
export const createAmparoLegal = (data) => api.post('/api/v1/amparos-legais/', data)
export const updateAmparoLegal = (id, data) => api.patch(`/api/v1/amparos-legais/${id}/`, data)
export const deleteAmparoLegal = (id) => api.delete(`/api/v1/amparos-legais/${id}/`)

// Consulados
export const getConsulados = (params) => api.get('/api/v1/consulados/', { params })
export const getConsulado = (id) => api.get(`/api/v1/consulados/${id}/`)
export const createConsulado = (data) => api.post('/api/v1/consulados/', data)
export const updateConsulado = (id, data) => api.patch(`/api/v1/consulados/${id}/`, data)
export const deleteConsulado = (id) => api.delete(`/api/v1/consulados/${id}/`)

// Tipos de Atualização
export const getTiposAtualizacao = (params) => api.get('/api/v1/tipos-atualizacao/', { params })
export const getTipoAtualizacao = (id) => api.get(`/api/v1/tipos-atualizacao/${id}/`)
export const createTipoAtualizacao = (data) => api.post('/api/v1/tipos-atualizacao/', data)
export const updateTipoAtualizacao = (id, data) => api.patch(`/api/v1/tipos-atualizacao/${id}/`, data)
export const deleteTipoAtualizacao = (id) => api.delete(`/api/v1/tipos-atualizacao/${id}/`)
