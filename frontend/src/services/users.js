import api from './api'

export const userService = {
  async list(params = {}) {
    const response = await api.get('/api/v1/users/', { params })
    return response.data
  },
  
  async get(id) {
    const response = await api.get(`/api/v1/users/${id}/`)
    return response.data
  },
  
  async create(data) {
    const response = await api.post('/api/v1/users/', data)
    return response.data
  },
  
  async update(id, data) {
    const response = await api.patch(`/api/v1/users/${id}/`, data)
    return response.data
  },
  
  async delete(id) {
    await api.delete(`/api/v1/users/${id}/`)
  },
  
  async resetPassword(id, newPassword) {
    const response = await api.post(`/api/v1/users/${id}/reset-password/`, {
      new_password: newPassword
    })
    return response.data
  },
}

export default userService
