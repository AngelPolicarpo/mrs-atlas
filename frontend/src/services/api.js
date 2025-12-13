import axios from 'axios'
import { dispatchSessionExpired } from './authEvents'

// Detecta a URL da API baseado no ambiente
function getApiUrl() {
  // Se tem variável de ambiente definida, usa ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Se está rodando via ngrok ou outro proxy, usa URL relativa
  // (requer que o backend esteja no mesmo domínio ou proxy configurado)
  if (window.location.hostname.includes('ngrok')) {
    // Para ngrok, assumimos que o backend está acessível na mesma origem
    // ou você precisa configurar VITE_API_URL para a URL do backend ngrok
    return ''
  }
  
  // Desenvolvimento local - usa URL relativa
  return ''
}

const API_URL = getApiUrl()

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Interceptor para adicionar token de autenticação e departamento ativo
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Adiciona o departamento ativo no header para validação de permissões no backend
    const activeDepartment = localStorage.getItem('active_department')
    if (activeDepartment) {
      config.headers['X-Active-Department'] = activeDepartment
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para refresh token e tratamento de 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Se recebeu 401 (não autorizado)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refresh_token')
      
      // Se não tem refresh token, dispara evento de sessão expirada
      if (!refreshToken) {
        dispatchSessionExpired()
        return Promise.reject(error)
      }
      
      try {
        // Tenta renovar o token - usa URL relativa para funcionar com proxy
        const response = await axios.post('/api/token/refresh/', {
          refresh: refreshToken,
        })
        
        const { access } = response.data
        localStorage.setItem('access_token', access)
        
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh falhou - dispara evento de sessão expirada
        dispatchSessionExpired()
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
