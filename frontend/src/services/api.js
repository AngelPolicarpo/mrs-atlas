import axios from 'axios'
import { dispatchSessionExpired } from './authEvents'

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

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

// =============================================================================
// MENSAGENS DE ERRO PADRONIZADAS
// =============================================================================

export const ERROR_MESSAGES = {
  // Erros de autenticação (401)
  401: {
    default: 'Sua sessão expirou. Por favor, faça login novamente.',
    invalid_token: 'Token de autenticação inválido.',
    no_active_account: 'Credenciais inválidas.',
  },
  // Erros de permissão (403)
  403: {
    default: 'Você não tem permissão para realizar esta ação.',
    view: 'Você não tem permissão para visualizar este recurso.',
    add: 'Você não tem permissão para criar novos registros.',
    change: 'Você não tem permissão para editar este registro.',
    delete: 'Você não tem permissão para excluir este registro.',
    export: 'Você não tem permissão para exportar dados.',
    admin: 'Esta ação requer permissão de administrador.',
  },
  // Erros de validação (400)
  400: {
    default: 'Dados inválidos. Verifique as informações e tente novamente.',
  },
  // Não encontrado (404)
  404: {
    default: 'O recurso solicitado não foi encontrado.',
  },
  // Erro de servidor (500)
  500: {
    default: 'Erro interno do servidor. Tente novamente mais tarde.',
  },
  // Erro de conexão
  network: 'Erro de conexão. Verifique sua internet e tente novamente.',
}

/**
 * Extrai a mensagem de erro mais apropriada da resposta.
 * @param {Error} error - Erro do axios
 * @returns {string} Mensagem de erro formatada
 */
export function getErrorMessage(error) {
  // Erro de conexão (sem resposta)
  if (!error.response) {
    return ERROR_MESSAGES.network
  }
  
  const { status, data } = error.response
  
  // Se o backend enviou uma mensagem específica, usa ela
  if (data) {
    // Formato padronizado do backend Atlas
    if (data.mensagem) {
      return data.mensagem
    }
    // DRF detail
    if (data.detail) {
      return data.detail
    }
    // Erros de campo (primeiro erro)
    const fieldErrors = Object.entries(data).find(([key, value]) => 
      Array.isArray(value) && key !== 'non_field_errors'
    )
    if (fieldErrors) {
      const [field, messages] = fieldErrors
      return `${field}: ${messages[0]}`
    }
    // non_field_errors
    if (data.non_field_errors?.length) {
      return data.non_field_errors[0]
    }
  }
  
  // Mensagem padrão baseada no status
  return ERROR_MESSAGES[status]?.default || 'Ocorreu um erro inesperado.'
}

/**
 * Evento customizado para erros de permissão (403).
 * Componentes podem escutar este evento para mostrar feedback.
 */
export function dispatchPermissionDenied(message) {
  window.dispatchEvent(new CustomEvent('atlas:permission-denied', {
    detail: { message }
  }))
}

// =============================================================================
// INSTÂNCIA DO AXIOS
// =============================================================================

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// =============================================================================
// INTERCEPTORS
// =============================================================================

// Interceptor para adicionar token de autenticação e contexto ativo
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Adiciona o sistema ativo no header para validação de acesso no backend
    const activeSistema = localStorage.getItem('active_sistema')
    if (activeSistema) {
      config.headers['X-Active-Sistema'] = activeSistema
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

// Interceptor para refresh token e tratamento de erros HTTP
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    
    // =================================================================
    // 401 - Não autenticado: tenta refresh token
    // =================================================================
    if (status === 401 && !originalRequest._retry) {
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
    
    // =================================================================
    // 403 - Sem permissão: dispara evento para feedback ao usuário
    // (a menos que a requisição tenha silent403 = true)
    // =================================================================
    if (status === 403) {
      // Permite suprimir notificação global para carregamentos isolados
      if (!originalRequest.silent403) {
        const message = getErrorMessage(error)
        dispatchPermissionDenied(message)
      }
      // Não bloqueia - deixa o componente tratar o erro também
    }
    
    return Promise.reject(error)
  }
)

export default api
