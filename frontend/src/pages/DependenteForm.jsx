import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getDependente, createDependente, updateDependente, getTitulares } from '../services/titulares'
import { getNacionalidades } from '../services/core'

function DependenteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const titularIdFromUrl = searchParams.get('titular')
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [titulares, setTitulares] = useState([])
  const [nacionalidades, setNacionalidades] = useState([])
  
  const [formData, setFormData] = useState({
    titular: titularIdFromUrl || '',
    nome: '',
    passaporte: '',
    rnm: '',
    nacionalidade: '',
    tipo_dependente: '',
    sexo: '',
    data_nascimento: '',
    pai: '',
    mae: '',
  })

  useEffect(() => {
    loadDados()
    if (isEditing) {
      loadDependente()
    }
  }, [id])

  async function loadDados() {
    try {
      const [titRes, nacRes] = await Promise.all([
        getTitulares(),
        getNacionalidades({ ativo: true }),
      ])
      setTitulares(titRes.data.results || titRes.data)
      setNacionalidades(nacRes.data.results || nacRes.data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  async function loadDependente() {
    try {
      setLoading(true)
      const response = await getDependente(id)
      const data = response.data
      setFormData({
        titular: data.titular || '',
        nome: data.nome || '',
        passaporte: data.passaporte || '',
        rnm: data.rnm || '',
        nacionalidade: data.nacionalidade || '',
        tipo_dependente: data.tipo_dependente || '',
        sexo: data.sexo || '',
        data_nascimento: data.data_nascimento || '',
        pai: data.pai || '',
        mae: data.mae || '',
      })
    } catch (err) {
      setError('Erro ao carregar dados do dependente')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const dataToSend = { ...formData }
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null
        }
      })

      if (isEditing) {
        await updateDependente(id, dataToSend)
      } else {
        await createDependente(dataToSend)
      }
      
      // Voltar para a lista, mantendo o filtro do titular se veio de lá
      if (formData.titular) {
        navigate(`/dependentes?titular=${formData.titular}`)
      } else {
        navigate('/dependentes')
      }
    } catch (err) {
      const errorData = err.response?.data
      if (errorData) {
        const messages = Object.entries(errorData)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n')
        setError(messages)
      } else {
        setError('Erro ao salvar dependente')
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
        <h1>{isEditing ? 'Editar Dependente' : 'Novo Dependente'}</h1>
      </div>

      {error && <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Titular</h3>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="titular">Titular *</label>
              <select
                id="titular"
                name="titular"
                value={formData.titular}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="">Selecione o titular...</option>
                {titulares.map(t => (
                  <option key={t.id} value={t.id}>{t.nome} - {t.rnm}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Identificação do Dependente</h3>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="nome">Nome Completo *</label>
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
              <label htmlFor="tipo_dependente">Tipo de Dependente</label>
              <select
                id="tipo_dependente"
                name="tipo_dependente"
                value={formData.tipo_dependente}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Selecione...</option>
                <option value="CONJUGE">Cônjuge</option>
                <option value="FILHO">Filho(a)</option>
                <option value="ENTEADO">Enteado(a)</option>
                <option value="PAI_MAE">Pai/Mãe</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="passaporte">Passaporte</label>
              <input
                type="text"
                id="passaporte"
                name="passaporte"
                value={formData.passaporte}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="rnm">RNM</label>
              <input
                type="text"
                id="rnm"
                name="rnm"
                value={formData.rnm}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="nacionalidade">Nacionalidade</label>
              <select
                id="nacionalidade"
                name="nacionalidade"
                value={formData.nacionalidade}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Selecione...</option>
                {nacionalidades.map(nac => (
                  <option key={nac.id} value={nac.id}>{nac.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Dados Pessoais</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sexo">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="data_nascimento">Data de Nascimento</label>
              <input
                type="date"
                id="data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pai">Nome do Pai</label>
              <input
                type="text"
                id="pai"
                name="pai"
                value={formData.pai}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="mae">Nome da Mãe</label>
              <input
                type="text"
                id="mae"
                name="mae"
                value={formData.mae}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dependentes')}
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

export default DependenteForm
