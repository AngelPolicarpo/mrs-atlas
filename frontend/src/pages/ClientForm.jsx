import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import clientService from '../services/clients'

function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    company: '',
    cnpj: '',
    lgpd_consent: false,
    marketing_consent: false,
    notes: '',
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  useEffect(() => {
    if (isEditing) {
      loadClient()
    }
  }, [id])
  
  async function loadClient() {
    setLoading(true)
    try {
      const data = await clientService.get(id)
      setFormData(data)
    } catch (error) {
      setError('Erro ao carregar cliente')
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
    setSaving(true)
    
    try {
      if (isEditing) {
        await clientService.update(id, formData)
      } else {
        await clientService.create(formData)
      }
      navigate('/clients')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const firstError = Object.values(errors)[0]
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        setError('Erro ao salvar cliente')
      }
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return <div className="loading">Carregando...</div>
  }
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h1>
      </div>
      
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '1rem' }}>Dados Pessoais</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome Completo *</label>
              <input
                type="text"
                className="form-input"
                name="name"
                value={formData.name}
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
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="tel"
                className="form-input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">CPF</label>
              <input
                type="text"
                className="form-input"
                name="cpf"
                value={formData.cpf || ''}
                onChange={handleChange}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
          
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Endereço</h3>
          
          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input
              type="text"
              className="form-input"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Rua, número, complemento"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input
                type="text"
                className="form-input"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Estado</label>
              <input
                type="text"
                className="form-input"
                name="state"
                value={formData.state}
                onChange={handleChange}
                maxLength={2}
                placeholder="SP"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">CEP</label>
              <input
                type="text"
                className="form-input"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="00000-000"
              />
            </div>
          </div>
          
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Empresa (opcional)</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <input
                type="text"
                className="form-input"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <input
                type="text"
                className="form-input"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
          
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>LGPD / Consentimentos</h3>
          
          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                name="lgpd_consent"
                checked={formData.lgpd_consent}
                onChange={handleChange}
              />
              <span>Cliente consentiu com a coleta e processamento de dados (LGPD)</span>
            </label>
          </div>
          
          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                name="marketing_consent"
                checked={formData.marketing_consent}
                onChange={handleChange}
              />
              <span>Cliente consentiu em receber comunicações de marketing</span>
            </label>
          </div>
          
          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span>Cliente ativo</span>
            </label>
          </div>
          
          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Observações</h3>
          
          <div className="form-group">
            <textarea
              className="form-input"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Anotações sobre o cliente..."
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Cadastrar')}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/clients')}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientForm
