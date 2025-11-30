import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTitular, createTitular, updateTitular, createVinculo, updateVinculo, deleteVinculo } from '../services/titulares'
import { getNacionalidades, getAmparosLegais, getConsulados, getTiposAtualizacao } from '../services/core'
import { getEmpresas } from '../services/empresas'

const emptyVinculo = {
  id: null,
  tipo_vinculo: '',
  empresa: '',
  amparo: '',
  consulado: '',
  tipo_atualizacao: '',
  data_entrada_pais: '',
  data_fim_vinculo: '',
  observacoes: '',
  status: true,
  isNew: true,
  isDeleted: false,
}

function TitularForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [nacionalidades, setNacionalidades] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [amparosLegais, setAmparosLegais] = useState([])
  const [consulados, setConsulados] = useState([])
  const [tiposAtualizacao, setTiposAtualizacao] = useState([])
  
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnh: '',
    passaporte: '',
    rnm: '',
    nacionalidade: '',
    sexo: '',
    email: '',
    telefone: '',
    pai: '',
    mae: '',
    data_nascimento: '',
    data_validade_cnh: '',
  })

  const [vinculos, setVinculos] = useState([])

  useEffect(() => {
    loadDados()
    if (isEditing) {
      loadTitular()
    }
  }, [id])

  async function loadDados() {
    try {
      const [nacRes, empRes, ampRes, consRes, tipoRes] = await Promise.all([
        getNacionalidades({ ativo: true }),
        getEmpresas({ status: true }),
        getAmparosLegais({ ativo: true }),
        getConsulados({ ativo: true }),
        getTiposAtualizacao({ ativo: true }),
      ])
      setNacionalidades(nacRes.data.results || nacRes.data)
      setEmpresas(empRes.data.results || empRes.data)
      setAmparosLegais(ampRes.data.results || ampRes.data)
      setConsulados(consRes.data.results || consRes.data)
      setTiposAtualizacao(tipoRes.data.results || tipoRes.data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  async function loadTitular() {
    try {
      setLoading(true)
      const response = await getTitular(id)
      const data = response.data
      setFormData({
        nome: data.nome || '',
        cpf: data.cpf || '',
        cnh: data.cnh || '',
        passaporte: data.passaporte || '',
        rnm: data.rnm || '',
        nacionalidade: data.nacionalidade || '',
        sexo: data.sexo || '',
        email: data.email || '',
        telefone: data.telefone || '',
        pai: data.pai || '',
        mae: data.mae || '',
        data_nascimento: data.data_nascimento || '',
        data_validade_cnh: data.data_validade_cnh || '',
      })
      
      // Carregar todos os vínculos existentes
      if (data.vinculos && data.vinculos.length > 0) {
        setVinculos(data.vinculos.map(v => ({
          id: v.id,
          tipo_vinculo: v.tipo_vinculo || '',
          empresa: v.empresa || '',
          amparo: v.amparo || '',
          consulado: v.consulado || '',
          tipo_atualizacao: v.tipo_atualizacao || '',
          data_entrada_pais: v.data_entrada_pais || '',
          data_fim_vinculo: v.data_fim_vinculo || '',
          observacoes: v.observacoes || '',
          status: v.status !== undefined ? v.status : true,
          isNew: false,
          isDeleted: false,
          empresa_nome: v.empresa_nome,
        })))
      }
    } catch (err) {
      setError('Erro ao carregar dados do titular')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handleVinculoChange(index, e) {
    const { name, value, type, checked } = e.target
    setVinculos(prev => prev.map((v, i) => {
      if (i !== index) return v
      return {
        ...v,
        [name]: type === 'checkbox' ? checked : value,
        // Se mudar tipo_vinculo para PARTICULAR, limpar empresa
        ...(name === 'tipo_vinculo' && value === 'PARTICULAR' ? { empresa: '' } : {})
      }
    }))
  }

  function addVinculo() {
    setVinculos(prev => [...prev, { ...emptyVinculo, id: `new-${Date.now()}` }])
  }

  function removeVinculo(index) {
    setVinculos(prev => prev.map((v, i) => {
      if (i !== index) return v
      // Se é um vínculo existente (do banco), marca como deletado
      if (!v.isNew) {
        return { ...v, isDeleted: true }
      }
      // Se é novo, remove da lista
      return null
    }).filter(Boolean))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Limpar campos vazios para não enviar strings vazias
      const dataToSend = { ...formData }
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null
        }
      })

      let titularId = id
      
      if (isEditing) {
        await updateTitular(id, dataToSend)
      } else {
        const response = await createTitular(dataToSend)
        titularId = response.data.id
      }
      
      // Processar vínculos
      for (const vinculo of vinculos) {
        // Pular vínculos sem tipo selecionado
        if (!vinculo.tipo_vinculo) continue
        
        const vinculoToSend = { 
          tipo_vinculo: vinculo.tipo_vinculo,
          empresa: vinculo.empresa || null,
          amparo: vinculo.amparo || null,
          consulado: vinculo.consulado || null,
          tipo_atualizacao: vinculo.tipo_atualizacao || null,
          data_entrada_pais: vinculo.data_entrada_pais || null,
          data_fim_vinculo: vinculo.data_fim_vinculo || null,
          observacoes: vinculo.observacoes || null,
          status: vinculo.status,
          titular: titularId,
        }
        
        // Se tipo é PARTICULAR, limpar empresa
        if (vinculoToSend.tipo_vinculo === 'PARTICULAR') {
          vinculoToSend.empresa = null
        }
        
        if (vinculo.isDeleted && !vinculo.isNew) {
          // Deletar vínculo existente
          await deleteVinculo(vinculo.id)
        } else if (vinculo.isNew && !vinculo.isDeleted) {
          // Criar novo vínculo
          await createVinculo(vinculoToSend)
        } else if (!vinculo.isNew && !vinculo.isDeleted) {
          // Atualizar vínculo existente
          await updateVinculo(vinculo.id, vinculoToSend)
        }
      }
      
      navigate('/titulares')
    } catch (err) {
      const errorData = err.response?.data
      if (errorData) {
        const messages = Object.entries(errorData)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n')
        setError(messages)
      } else {
        setError('Erro ao salvar titular')
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
        <h1>{isEditing ? 'Editar Titular' : 'Novo Titular'}</h1>
      </div>

      {error && <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Identificação</h3>
          
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
              <label htmlFor="rnm">RNM *</label>
              <input
                type="text"
                id="rnm"
                name="rnm"
                value={formData.rnm}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cpf">CPF</label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className="form-control"
                placeholder="000.000.000-00"
              />
            </div>
            
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
              <label htmlFor="nacionalidade">Nacionalidade *</label>
              <select
                id="nacionalidade"
                name="nacionalidade"
                value={formData.nacionalidade}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="">Selecione...</option>
                {nacionalidades.map(nac => (
                  <option key={nac.id} value={nac.id}>{nac.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cnh">CNH</label>
              <input
                type="text"
                id="cnh"
                name="cnh"
                value={formData.cnh}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="data_validade_cnh">Validade CNH</label>
              <input
                type="date"
                id="data_validade_cnh"
                name="data_validade_cnh"
                value={formData.data_validade_cnh}
                onChange={handleChange}
                className="form-control"
              />
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

        <div className="form-section">
          <h3>Contato</h3>
          
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
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Vínculos</h3>
            <button
              type="button"
              onClick={addVinculo}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '14px' }}
            >
              + Adicionar Vínculo
            </button>
          </div>
          
          {vinculos.filter(v => !v.isDeleted).length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              Nenhum vínculo cadastrado. Clique em "Adicionar Vínculo" para criar um novo.
            </p>
          ) : (
            vinculos.map((vinculo, index) => {
              if (vinculo.isDeleted) return null
              
              return (
                <div 
                  key={vinculo.id} 
                  className="vinculo-card"
                  style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    marginBottom: '16px',
                    backgroundColor: vinculo.status ? '#fff' : '#f9f9f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>
                      Vínculo {index + 1}
                      {!vinculo.status && <span style={{ color: '#999', fontWeight: 'normal' }}> (Inativo)</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVinculo(index)}
                      className="btn btn-danger"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Remover
                    </button>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de Vínculo *</label>
                      <select
                        name="tipo_vinculo"
                        value={vinculo.tipo_vinculo}
                        onChange={(e) => handleVinculoChange(index, e)}
                        className="form-control"
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="EMPRESA">Empresa</option>
                        <option value="PARTICULAR">Particular (Autônomo)</option>
                      </select>
                    </div>
                    
                    {vinculo.tipo_vinculo === 'EMPRESA' && (
                      <div className="form-group">
                        <label>Empresa *</label>
                        <select
                          name="empresa"
                          value={vinculo.empresa}
                          onChange={(e) => handleVinculoChange(index, e)}
                          className="form-control"
                          required
                        >
                          <option value="">Selecione a empresa...</option>
                          {empresas.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nome}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>Consulado</label>
                      <select
                        name="consulado"
                        value={vinculo.consulado}
                        onChange={(e) => handleVinculoChange(index, e)}
                        className="form-control"
                      >
                        <option value="">Selecione o consulado...</option>
                        {consulados.map(cons => (
                          <option key={cons.id} value={cons.id}>{cons.pais}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {vinculo.tipo_vinculo && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Amparo Legal</label>
                          <select
                            name="amparo"
                            value={vinculo.amparo}
                            onChange={(e) => handleVinculoChange(index, e)}
                            className="form-control"
                          >
                            <option value="">Selecione...</option>
                            {amparosLegais.map(amp => (
                              <option key={amp.id} value={amp.id}>{amp.nome}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Tipo de Atualização</label>
                          <select
                            name="tipo_atualizacao"
                            value={vinculo.tipo_atualizacao}
                            onChange={(e) => handleVinculoChange(index, e)}
                            className="form-control"
                          >
                            <option value="">Selecione...</option>
                            {tiposAtualizacao.map(tipo => (
                              <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Data de Entrada no País</label>
                          <input
                            type="date"
                            name="data_entrada_pais"
                            value={vinculo.data_entrada_pais}
                            onChange={(e) => handleVinculoChange(index, e)}
                            className="form-control"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Data Fim do Vínculo</label>
                          <input
                            type="date"
                            name="data_fim_vinculo"
                            value={vinculo.data_fim_vinculo}
                            onChange={(e) => handleVinculoChange(index, e)}
                            className="form-control"
                          />
                        </div>
                        
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              name="status"
                              checked={vinculo.status}
                              onChange={(e) => handleVinculoChange(index, e)}
                            />
                            Vínculo Ativo
                          </label>
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Observações</label>
                          <textarea
                            name="observacoes"
                            value={vinculo.observacoes}
                            onChange={(e) => handleVinculoChange(index, e)}
                            className="form-control"
                            rows="2"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/titulares')}
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

export default TitularForm
