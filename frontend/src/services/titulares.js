import api from './api'

// Titulares
export const getTitulares = (params) => api.get('/api/v1/titulares/', { params })
export const getTitular = (id) => api.get(`/api/v1/titulares/${id}/`)
export const createTitular = (data) => api.post('/api/v1/titulares/', data)
export const updateTitular = (id, data) => api.patch(`/api/v1/titulares/${id}/`, data)
export const deleteTitular = (id) => api.delete(`/api/v1/titulares/${id}/`)
export const getTitularVinculos = (id) => api.get(`/api/v1/titulares/${id}/vinculos/`)
export const getTitularDependentes = (id) => api.get(`/api/v1/titulares/${id}/dependentes/`)
export const importarTitulares = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/v1/titulares/importar/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Vínculos
export const getVinculos = (params) => api.get('/api/v1/vinculos/', { params })
export const getVinculo = (id) => api.get(`/api/v1/vinculos/${id}/`)
export const createVinculo = (data) => api.post('/api/v1/vinculos/', data)
export const updateVinculo = (id, data) => api.patch(`/api/v1/vinculos/${id}/`, data)
export const deleteVinculo = (id) => api.delete(`/api/v1/vinculos/${id}/`)

// Dependentes
export const getDependentes = (params) => api.get('/api/v1/dependentes/', { params })
export const getDependente = (id) => api.get(`/api/v1/dependentes/${id}/`)
export const createDependente = (data) => api.post('/api/v1/dependentes/', data)
export const updateDependente = (id, data) => api.patch(`/api/v1/dependentes/${id}/`, data)
export const deleteDependente = (id) => api.delete(`/api/v1/dependentes/${id}/`)
