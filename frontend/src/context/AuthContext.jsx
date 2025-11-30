import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
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
      } catch (error) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    setLoading(false)
  }
  
  async function login(email, password) {
    const userData = await authService.login(email, password)
    setUser(userData)
    return userData
  }
  
  async function register(data) {
    const userData = await authService.register(data)
    setUser(userData)
    return userData
  }
  
  async function logout() {
    await authService.logout()
    setUser(null)
  }
  
  async function updateProfile(data) {
    const userData = await authService.updateProfile(data)
    setUser(userData)
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
