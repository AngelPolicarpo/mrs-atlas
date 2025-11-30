import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEmpresa, createEmpresa, updateEmpresa } from '../services/empresas'

function EmpresaForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    status: true,
    data_registro: '',
  })

  useEffect(() => {
    if (isEditing) {
      loadEmpresa()
    }
  }, [id])

  async function loadEmpresa() {
    try {
      setLoading(true)
      const response = await getEmpresa(id)
      const data = response.data
      setFormData({
        nome: data.nome || '',
        cnpj: data.cnpj || '',
        email: data.email || '',
        telefone: data.telefone || '',
        endereco: data.endereco || '',
        status: data.status ?? true,
        data_registro: data.data_registro || '',
      })
    } catch (err) {
      setError('Erro ao carregar dados da empresa')
      console.error(err)
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
      const dataToSend = { ...formData }
      // Limpar campos vazios
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null
        }
      })

      if (isEditing) {
        await updateEmpresa(id, dataToSend)
      } else {
        await createEmpresa(dataToSend)
      }
      navigate('/empresas')
    } catch (err) {
      const errorData = err.response?.data
      if (errorData) {
        const messages = Object.entries(errorData)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n')
        setError(messages)
      } else {
        setError('Erro ao salvar empresa')
      }
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEditing ? 'Editar Empresa' : 'Nova Empresa'}</h1>
      </div>

      {error && <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Dados da Empresa</h3>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="nome">Nome *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cnpj">CNPJ *</label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="text"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="form-control"
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="endereco">Endereço</label>
            <textarea
              id="endereco"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              className="form-control"
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Status</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="data_registro">Data de Registro</label>
              <input
                type="date"
                id="data_registro"
                name="data_registro"
                value={formData.data_registro}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                />
                Empresa Ativa
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/empresas')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EmpresaForm
