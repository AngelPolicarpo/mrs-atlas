import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/auth'

const AuthContext = createContext(null)

// Função para obter usuário do localStorage
function getStoredUser() {
  try {
    const stored = localStorage.getItem('user_data')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Função para salvar usuário no localStorage
function setStoredUser(user) {
  if (user) {
    localStorage.setItem('user_data', JSON.stringify(user))
  } else {
    localStorage.removeItem('user_data')
  }
}

export function AuthProvider({ children }) {
  // Inicializa com dados do localStorage para evitar flash de logout
  const [user, setUser] = useState(getStoredUser)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  async function checkAuth() {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)
        setStoredUser(userData)
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        // Só limpa se for erro 401 (não autorizado)
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user_data')
          setUser(null)
        }
        // Se for outro erro (rede, servidor), mantém o usuário logado
      }
    } else {
      setUser(null)
      setStoredUser(null)
    }
    setLoading(false)
  }
  
  async function login(email, password) {
    const userData = await authService.login(email, password)
    setUser(userData)
    setStoredUser(userData)
    return userData
  }
  
  async function register(data) {
    const userData = await authService.register(data)
    setUser(userData)
    setStoredUser(userData)
    return userData
  }
  
  async function logout() {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setStoredUser(null)
    }
  }
  
  async function updateProfile(data) {
    const userData = await authService.updateProfile(data)
    setUser(userData)
    setStoredUser(userData)
    return userData
  }
  
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
