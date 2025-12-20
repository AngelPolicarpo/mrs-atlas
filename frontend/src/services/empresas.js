import api from './api'

export const getEmpresas = (params) => api.get('/api/v1/empresas/', { params })
export const getEmpresa = (id) => api.get(`/api/v1/empresas/${id}/`)
export const createEmpresa = (data) => api.post('/api/v1/empresas/', data)
export const updateEmpresa = (id, data) => api.patch(`/api/v1/empresas/${id}/`, data)
export const deleteEmpresa = (id) => api.delete(`/api/v1/empresas/${id}/`)

// Search para autocomplete (busca por nome ou CNPJ)
export const searchEmpresas = (search) => api.get('/api/v1/empresas/', { params: { search, status: true, page_size: 20 } })
