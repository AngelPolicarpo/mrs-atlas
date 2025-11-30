import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import userService from '../services/users'

function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    password: '',
    password_confirm: '',
    is_active: true,
    is_staff: false,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  useEffect(() => {
    if (isEditing) {
      loadUser()
    }
  }, [id])
  
  async function loadUser() {
    setLoading(true)
    try {
      const data = await userService.get(id)
      setFormData({
        ...data,
        password: '',
        password_confirm: '',
      })
    } catch (error) {
      setError('Erro ao carregar usuário')
    } finally {
      setLoading(false)
    }
  }
  
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    
    if (!isEditing && formData.password !== formData.password_confirm) {
      setError('As senhas não coincidem')
      return
    }
    
    if (!isEditing && formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }
    
    setSaving(true)
    
    try {
      const dataToSend = { ...formData }
      delete dataToSend.password_confirm
      
      if (isEditing) {
        delete dataToSend.password
        await userService.update(id, dataToSend)
      } else {
        await userService.create(dataToSend)
      }
      navigate('/users')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const firstError = Object.values(errors)[0]
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        setError('Erro ao salvar usuário')
      }
    } finally {
      setSaving(false)
    }
  }
  
  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 8) {
      alert('A senha deve ter pelo menos 8 caracteres')
      return
    }
    
    try {
      await userService.resetPassword(id, newPassword)
      alert('Senha alterada com sucesso!')
      setShowPasswordReset(false)
      setNewPassword('')
    } catch (error) {
      alert('Erro ao alterar senha')
    }
  }
  
  if (loading) {
    return <div className="loading">Carregando...</div>
  }
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h1>
      </div>
      
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '1rem' }}>Dados do Usuário</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input
                type="text"
                className="form-input"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isEditing}
              />
              {isEditing && (
                <small style={{ color: 'var(--text-light)' }}>
                  O email não pode ser alterado após a criação
                </small>
              )}
            </div>
          </div>
          {!isEditing && (
            <>
              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Senha</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Senha *</label>
                  <input
                    type="password"
                    className="form-input"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Confirmar Senha *</label>
                  <input
                    type="password"
                    className="form-input"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </>
          )}
          
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Permissões</h3>
          
          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span>Usuário ativo (pode fazer login)</span>
            </label>
          </div>
          
          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                name="is_staff"
                checked={formData.is_staff}
                onChange={handleChange}
              />
              <span>Administrador (acesso ao Django Admin)</span>
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Usuário')}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/users')}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
      
      {isEditing && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Alterar Senha</h3>
          
          {!showPasswordReset ? (
            <button
              className="btn btn-outline"
              onClick={() => setShowPasswordReset(true)}
            >
              🔑 Redefinir Senha
            </button>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  style={{ maxWidth: '300px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleResetPassword}>
                  Salvar Nova Senha
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowPasswordReset(false)
                    setNewPassword('')
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserForm
