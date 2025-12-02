import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { 
  getDependente, createDependente, updateDependente, getTitulares,
  getVinculosDependentes, createVinculoDependente, updateVinculoDependente, deleteVinculoDependente
} from '../services/titulares'
import { getNacionalidades, getAmparosLegais, getConsulados, getTiposAtualizacao } from '../services/core'

const emptyVinculo = {
  id: null,
  amparo: '',
  consulado: '',
  tipo_atualizacao: '',
  data_entrada: '',
  data_fim_vinculo: '',
  observacoes: '',
  status: true,
  isNew: true,
  isDeleted: false,
}

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
  const [amparosLegais, setAmparosLegais] = useState([])
  const [consulados, setConsulados] = useState([])
  const [tiposAtualizacao, setTiposAtualizacao] = useState([])
  
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

  const [vinculos, setVinculos] = useState([])

  useEffect(() => {
    loadDados()
    if (isEditing) {
      loadDependente()
    }
  }, [id])

  async function loadDados() {
    try {
      const [titRes, nacRes, ampRes, consRes, tipoRes] = await Promise.all([
        getTitulares(),
        getNacionalidades({ ativo: true }),
        getAmparosLegais({ ativo: true }),
        getConsulados({ ativo: true }),
        getTiposAtualizacao({ ativo: true }),
      ])
      setTitulares(titRes.data.results || titRes.data)
      setNacionalidades(nacRes.data.results || nacRes.data)
      setAmparosLegais(ampRes.data.results || ampRes.data)
      setConsulados(consRes.data.results || consRes.data)
      setTiposAtualizacao(tipoRes.data.results || tipoRes.data)
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
      
      // Carregar vínculos do dependente
      if (data.vinculos && data.vinculos.length > 0) {
        setVinculos(data.vinculos.map(v => ({
          id: v.id,
          amparo: v.amparo || '',
          consulado: v.consulado || '',
          tipo_atualizacao: v.tipo_atualizacao || '',
          data_entrada: v.data_entrada || '',
          data_fim_vinculo: v.data_fim_vinculo || '',
          observacoes: v.observacoes || '',
          status: v.status !== undefined ? v.status : true,
          isNew: false,
          isDeleted: false,
          amparo_nome: v.amparo_nome,
        })))
      }
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

  function handleVinculoChange(index, e) {
    const { name, value, type, checked } = e.target
    setVinculos(prev => prev.map((v, i) => {
      if (i !== index) return v
      return {
        ...v,
        [name]: type === 'checkbox' ? checked : value,
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

  function calcularDiasRestantes(dataFim) {
    if (!dataFim) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(0, 0, 0, 0)
    const diff = fim - hoje
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  function getBadgeClass(dataFim) {
    const dias = calcularDiasRestantes(dataFim)
    if (dias === null) return 'badge-secondary'
    if (dias < 0) return 'badge-danger'
    if (dias <= 30) return 'badge-warning'
    if (dias <= 90) return 'badge-info'
    return 'badge-success'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const dataToSend = { ...formData }
      
      // Validar tipo_dependente - apenas valores válidos
      const tiposValidos = ['CONJUGE', 'FILHO', 'ENTEADO', 'PAI_MAE', 'OUTRO']
      if (dataToSend.tipo_dependente && !tiposValidos.includes(dataToSend.tipo_dependente)) {
        dataToSend.tipo_dependente = null
      }
      
      // Validar sexo - apenas valores válidos
      const sexosValidos = ['M', 'F']
      if (dataToSend.sexo && !sexosValidos.includes(dataToSend.sexo)) {
        dataToSend.sexo = null
      }
      
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null
        }
      })

      console.log('Enviando dependente:', dataToSend)

      let dependenteId = id

      if (isEditing) {
        await updateDependente(id, dataToSend)
      } else {
        const response = await createDependente(dataToSend)
        dependenteId = response.data.id
      }
      
      // Processar vínculos do dependente
      for (const vinculo of vinculos) {
        const vinculoToSend = { 
          dependente: dependenteId,
          amparo: vinculo.amparo || null,
          consulado: vinculo.consulado || null,
          tipo_atualizacao: vinculo.tipo_atualizacao || null,
          data_entrada: vinculo.data_entrada || null,
          data_fim_vinculo: vinculo.data_fim_vinculo || null,
          observacoes: vinculo.observacoes || null,
          status: vinculo.status,
        }
        
        if (vinculo.isDeleted && !vinculo.isNew) {
          // Deletar vínculo existente
          await deleteVinculoDependente(vinculo.id)
        } else if (vinculo.isNew && !vinculo.isDeleted) {
          // Criar novo vínculo
          await createVinculoDependente(vinculoToSend)
        } else if (!vinculo.isNew && !vinculo.isDeleted) {
          // Atualizar vínculo existente
          await updateVinculoDependente(vinculo.id, vinculoToSend)
        }
      }
      
      // Voltar para a lista, mantendo o filtro do titular se veio de lá
      if (formData.titular) {
        navigate(`/dependentes?titular=${formData.titular}`)
      } else {
        navigate('/dependentes')
      }
    } catch (err) {
      console.error('Erro detalhado:', err.response?.data)
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

  // Função para calcular dias restantes
  function calcularDiasRestantes(dataFim) {
    if (!dataFim) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(0, 0, 0, 0)
    const diffTime = fim - hoje
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Função para obter classe do badge
  function getBadgeClass(dataFim) {
    const dias = calcularDiasRestantes(dataFim)
    if (dias === null) return ''
    if (dias < 0) return 'badge-danger'
    if (dias <= 60) return 'badge-warning'
    return 'badge-success'
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

        {/* Seção de Vínculos do Dependente */}
        <div className="form-section">
          <div className="section-header">
            <h3>📋 Vínculos Migratórios</h3>
            <button
              type="button"
              onClick={addVinculo}
              className="btn btn-sm btn-secondary"
            >
              + Adicionar Vínculo
            </button>
          </div>
          
          {vinculos.filter(v => !v.isDeleted).length === 0 ? (
            <div className="empty-state-small">
              <p>Nenhum vínculo cadastrado.</p>
              <p className="text-muted">Clique em "Adicionar Vínculo" para inserir informações de prazo e amparo legal.</p>
            </div>
          ) : (
            <div className="vinculos-list">
              {vinculos.map((vinculo, index) => {
                if (vinculo.isDeleted) return null
                const dias = calcularDiasRestantes(vinculo.data_fim_vinculo)
                
                return (
                  <div key={vinculo.id} className="vinculo-card">
                    <div className="vinculo-header">
                      <span className="vinculo-number">Vínculo #{index + 1}</span>
                      <div className="vinculo-header-actions">
                        {vinculo.data_fim_vinculo && dias !== null && (
                          <span className={`badge ${getBadgeClass(vinculo.data_fim_vinculo)}`}>
                            {dias < 0 ? `Vencido há ${Math.abs(dias)} dias` : `${dias} dias restantes`}
                          </span>
                        )}
                        <label className="checkbox-inline">
                          <input
                            type="checkbox"
                            name="status"
                            checked={vinculo.status}
                            onChange={(e) => handleVinculoChange(index, e)}
                          />
                          Ativo
                        </label>
                        <button
                          type="button"
                          onClick={() => removeVinculo(index)}
                          className="btn btn-sm btn-danger"
                          title="Remover vínculo"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
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
                          {amparosLegais.map(a => (
                            <option key={a.id} value={a.id}>{a.nome}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Consulado</label>
                        <select
                          name="consulado"
                          value={vinculo.consulado}
                          onChange={(e) => handleVinculoChange(index, e)}
                          className="form-control"
                        >
                          <option value="">Selecione...</option>
                          {consulados.map(c => (
                            <option key={c.id} value={c.id}>{c.pais} - {c.cidade}</option>
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
                          {tiposAtualizacao.map(t => (
                            <option key={t.id} value={t.id}>{t.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Data de Entrada</label>
                        <input
                          type="date"
                          name="data_entrada"
                          value={vinculo.data_entrada}
                          onChange={(e) => handleVinculoChange(index, e)}
                          className="form-control"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Data Fim do Vínculo (Vencimento)</label>
                        <input
                          type="date"
                          name="data_fim_vinculo"
                          value={vinculo.data_fim_vinculo}
                          onChange={(e) => handleVinculoChange(index, e)}
                          className="form-control"
                        />
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
                          placeholder="Observações sobre este vínculo..."
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
