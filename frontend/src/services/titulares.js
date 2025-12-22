import api from './api'

// Titulares
export const getTitulares = (params) => api.get('/api/v1/titulares/', { params })
export const getTitular = (id) => api.get(`/api/v1/titulares/${id}/`)
export const createTitular = (data) => api.post('/api/v1/titulares/', data)
export const updateTitular = (id, data) => api.patch(`/api/v1/titulares/${id}/`, data)
export const deleteTitular = (id) => api.delete(`/api/v1/titulares/${id}/`)
export const getTitularVinculos = (id) => api.get(`/api/v1/titulares/${id}/vinculos/`)
export const getTitularDependentes = (id) => api.get(`/api/v1/titulares/${id}/dependentes/`)

// Busca de titulares para AutoComplete
export const searchTitulares = async (query) => {
  const res = await api.get('/api/v1/titulares/', { 
    params: { search: query, page_size: 20 } 
  })
  const results = res.data.results || res.data || []
  return {
    data: results.map(t => ({
      id: t.id,
      label: `${t.nome} - ${t.cpf || 'Sem CPF'}`,
      nome: t.nome,
      cpf: t.cpf
    }))
  }
}

export const importarTitulares = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/v1/titulares/importar/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Vínculos de Titular (vinculo_titular)
export const getVinculosTitular = (params) => api.get('/api/v1/vinculos-titular/', { params })
export const getVinculoTitular = (id) => api.get(`/api/v1/vinculos-titular/${id}/`)
export const createVinculoTitular = (data) => api.post('/api/v1/vinculos-titular/', data)
export const updateVinculoTitular = (id, data) => api.patch(`/api/v1/vinculos-titular/${id}/`, data)
export const deleteVinculoTitular = (id) => api.delete(`/api/v1/vinculos-titular/${id}/`)

// Dependentes
export const getDependentes = (params) => api.get('/api/v1/dependentes/', { params })
export const getDependente = (id) => api.get(`/api/v1/dependentes/${id}/`)
export const createDependente = (data) => api.post('/api/v1/dependentes/', data)
export const updateDependente = (id, data) => api.patch(`/api/v1/dependentes/${id}/`, data)
export const deleteDependente = (id) => api.delete(`/api/v1/dependentes/${id}/`)

// Busca de dependentes para AutoComplete
export const searchDependentes = async (query) => {
  const res = await api.get('/api/v1/dependentes/', { 
    params: { search: query, page_size: 20 } 
  })
  const results = res.data.results || res.data || []
  return {
    data: results.map(d => ({
      id: d.id,
      label: `${d.nome} - ${d.cpf || 'Sem CPF'}`,
      nome: d.nome,
      cpf: d.cpf,
      titular_nome: d.titular_nome
    }))
  }
}

// Vínculos de Dependentes
export const getVinculosDependentes = (params) => api.get('/api/v1/vinculos-dependentes/', { params })
export const getVinculoDependente = (id) => api.get(`/api/v1/vinculos-dependentes/${id}/`)
export const createVinculoDependente = (data) => api.post('/api/v1/vinculos-dependentes/', data)
export const updateVinculoDependente = (id, data) => api.patch(`/api/v1/vinculos-dependentes/${id}/`, data)
export const deleteVinculoDependente = (id) => api.delete(`/api/v1/vinculos-dependentes/${id}/`)

// Pesquisa Unificada (paginada)
export const pesquisaUnificada = (params) => api.get('/api/v1/pesquisa/', { params })
