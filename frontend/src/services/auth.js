import api from './api'

export const authService = {
  async login(email, password) {
    const response = await api.post('/api/auth/login/', { email, password })
    const { access, refresh } = response.data
    
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    
    // Busca dados completos do usuário (incluindo permissões)
    const userResponse = await api.get('/api/v1/users/me/')
    return userResponse.data
  },
  
  async register(data) {
    const response = await api.post('/api/auth/registration/', {
      email: data.email,
      password1: data.password,
      password2: data.passwordConfirm,
      first_name: data.firstName,
      last_name: data.lastName,
    })
    
    const { access, refresh, user } = response.data
    
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    
    return user
  },
  
  async logout() {
    try {
      await api.post('/api/auth/logout/')
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
  
  async exportData() {
    const response = await api.get('/api/v1/users/me/export/')
    return response.data
  },
  
  async deleteAccount() {
    const response = await api.delete('/api/v1/users/me/delete/')
    return response.data
  },
}

export default authService
