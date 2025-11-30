import api from './api'

export const clientService = {
  async list(params = {}) {
    const response = await api.get('/api/v1/clients/', { params })
    return response.data
  },
  
  async get(id) {
    const response = await api.get(`/api/v1/clients/${id}/`)
    return response.data
  },
  
  async create(data) {
    const response = await api.post('/api/v1/clients/', data)
    return response.data
  },
  
  async update(id, data) {
    const response = await api.patch(`/api/v1/clients/${id}/`, data)
    return response.data
  },
  
  async delete(id) {
    await api.delete(`/api/v1/clients/${id}/`)
  },
  
  async anonymize(id) {
    const response = await api.post(`/api/v1/clients/${id}/anonymize/`)
    return response.data
  },
  
  async export(id) {
    const response = await api.get(`/api/v1/clients/${id}/export/`)
    return response.data
  },
}

export default clientService
