import api from './api'

export const authService = {
  async login(email, password) {
    const response = await api.post('/api/auth/login/', { email, password })
    const { access, refresh, user } = response.data
    
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    
    // Os dados do usuário já vêm completos na resposta de login
    // incluindo permissões_django e permissoes_lista
    return user
  },
  
  async register(data) {
    const response = await api.post('/api/auth/register/', {
      nome: data.nome || `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      password: data.password,
    })
    
    const { access, refresh, user } = response.data
    
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    
    return user
  },
  
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await api.post('/api/auth/logout/', { refresh: refreshToken })
      }
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },
  
  async getCurrentUser() {
    const response = await api.get('/api/v1/users/me/')
    return response.data
  },
  
  async updateProfile(data) {
    const response = await api.patch('/api/v1/users/me/', data)
    return response.data
  },
  
  async changePassword(oldPassword, newPassword) {
    const response = await api.post('/api/auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
    })
    return response.data
  },
  
  async exportData() {
    const response = await api.get('/api/v1/users/me/export/')
    return response.data
  },
  
  async deleteAccount() {
    const response = await api.delete('/api/v1/users/me/delete/')
    return response.data
  },
  
  /**
   * Verifica se o usuário tem uma permissão específica.
   * @param {string} permission - Permissão no formato 'app.action_model' (ex: 'titulares.delete_titular')
   * @returns {Promise<{has_permission: boolean, message?: string}>}
   */
  async checkPermission(permission) {
    const response = await api.post('/api/v1/check-permission/', { permission })
    return response.data
  },
}

export default authService
