import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../img/oie_ADRZD4MM25hi.png'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img style={{ width: '30px', height: '30px', marginRight: '10px' }} src={logo} alt="MRS Logo" />
          <h1 style={{ marginTop: '10px' }} className="auth-title">Atlas</h1>
        </div>
        <p className="auth-subtitle" style={{ marginBottom: '1rem' }}>Sistema de Gestão de Clientes</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              style={{ marginBottom: '18px' }}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
      </div>
    </div>
  )
}

export default Login
