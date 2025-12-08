import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTitular, createTitular, updateTitular, createVinculo, updateVinculo, deleteVinculo } from '../services/titulares'
import { getNacionalidades, getAmparosLegais, getConsulados, getTiposAtualizacao } from '../services/core'
import { getEmpresas } from '../services/empresas'
import { 
  formatters, validators, cleanDataForSubmit, validateDocuments 
} from '../utils/validation'

const emptyVinculo = {
  id: null,
  tipo_vinculo: '',
  empresa: '',
  empresa_nome: '',
  amparo: '',
  amparo_nome: '',
  consulado: '',
  consulado_nome: '',
  tipo_atualizacao: '',
  tipo_atualizacao_nome: '',
  data_entrada_pais: '',
  data_fim_vinculo: '',
  atualizacao: '',
  observacoes: '',
  status: true,
  tipo_status: '',
  isNew: true,
  isDeleted: false,
  isExpanded: true, // Novos vínculos começam expandidos
}

function TitularForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [nacionalidades, setNacionalidades] = useState([])
  const [tiposAtualizacao, setTiposAtualizacao] = useState([])
  
  // Mapeamento de campos para nomes amigáveis
  const fieldLabels = {
    nome: 'Nome',
    cpf: 'CPF',
    cnh: 'CNH',
    passaporte: 'Passaporte',
    rnm: 'RNM',
    ctps: 'CTPS',
    nacionalidade: 'Nacionalidade',
    sexo: 'Sexo',
    email: 'Email',
    telefone: 'Telefone',
    filiacao_um: 'Filiação 1',
    filiacao_dois: 'Filiação 2',
    data_nascimento: 'Data de Nascimento',
    data_validade_passaporte: 'Validade do Passaporte',
    data_validade_cnh: 'Validade da CNH',
    status_visto: 'Status do Visto',
    titular: 'Titular',
    tipo_vinculo: 'Tipo de Vínculo',
    empresa: 'Empresa',
    amparo: 'Amparo Legal',
    consulado: 'Consulado',
  }
  
  // Estados para autocomplete com busca no backend
  const [empresasSuggestions, setEmpresasSuggestions] = useState([])
  const [amparosSuggestions, setAmparosSuggestions] = useState([])
  const [consuladosSuggestions, setConsuladosSuggestions] = useState([])
  
  // Refs para debounce
  const empresaDebounceRef = useRef(null)
  const amparoDebounceRef = useRef(null)
  const consuladoDebounceRef = useRef(null)
  
  // Estados para texto de busca por vínculo
  const [vinculoSearchTexts, setVinculoSearchTexts] = useState({})
  
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnh: '',
    passaporte: '',
    data_validade_passaporte: '',
    rnm: '',
    status_visto: '',
    ctps: '',
    nacionalidade: '',
    sexo: '',
    email: '',
    telefone: '',
    filiacao_um: '',
    filiacao_dois: '',
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
      const [nacRes, tipoRes] = await Promise.all([
        getNacionalidades({ ativo: true }),
        getTiposAtualizacao({ ativo: true }),
      ])
      setNacionalidades(nacRes.data.results || nacRes.data)
      setTiposAtualizacao(tipoRes.data.results || tipoRes.data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  // Funções de busca com debounce
  const searchEmpresas = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setEmpresasSuggestions([])
      return
    }
    try {
      const response = await getEmpresas({ search: searchText, status: true, page_size: 15 })
      setEmpresasSuggestions(response.data.results || response.data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    }
  }, [])

  const searchAmparos = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setAmparosSuggestions([])
      return
    }
    try {
      const response = await getAmparosLegais({ search: searchText, ativo: true, page_size: 15 })
      setAmparosSuggestions(response.data.results || response.data || [])
    } catch (error) {
      console.error('Erro ao buscar amparos:', error)
    }
  }, [])

  const searchConsulados = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setConsuladosSuggestions([])
      return
    }
    try {
      const response = await getConsulados({ search: searchText, ativo: true, page_size: 15 })
      setConsuladosSuggestions(response.data.results || response.data || [])
    } catch (error) {
      console.error('Erro ao buscar consulados:', error)
    }
  }, [])

  // Handlers para campos com autocomplete
  const handleEmpresaSearch = useCallback((index, text) => {
    setVinculoSearchTexts(prev => ({ ...prev, [`empresa_${index}`]: text }))
    setVinculos(prev => prev.map((v, i) => i === index ? { ...v, empresa: '', empresa_nome: text } : v))
    
    if (empresaDebounceRef.current) clearTimeout(empresaDebounceRef.current)
    empresaDebounceRef.current = setTimeout(() => searchEmpresas(text), 300)
  }, [searchEmpresas])

  const handleEmpresaSelect = useCallback((index, empresa) => {
    setVinculos(prev => prev.map((v, i) => i === index ? { ...v, empresa: empresa.id, empresa_nome: empresa.nome } : v))
    setVinculoSearchTexts(prev => ({ ...prev, [`empresa_${index}`]: empresa.nome }))
    setEmpresasSuggestions([])
  }, [])

  const handleAmparoSearch = useCallback((index, text) => {
    setVinculoSearchTexts(prev => ({ ...prev, [`amparo_${index}`]: text }))
    setVinculos(prev => prev.map((v, i) => i === index ? { ...v, amparo: '', amparo_nome: text } : v))
    
    if (amparoDebounceRef.current) clearTimeout(amparoDebounceRef.current)
    amparoDebounceRef.current = setTimeout(() => searchAmparos(text), 300)
  }, [searchAmparos])

  const handleAmparoSelect = useCallback((index, amparo) => {
    setVinculos(prev => prev.map((v, i) => i === index ? { ...v, amparo: amparo.id, amparo_nome: amparo.nome } : v))
    setVinculoSearchTexts(prev => ({ ...prev, [`amparo_${index}`]: amparo.nome }))
    setAmparosSuggestions([])
  }, [])

  const handleConsuladoSearch = useCallback((index, text) => {
    setVinculoSearchTexts(prev => ({ ...prev, [`consulado_${index}`]: text }))
    setVinculos(prev => prev.map((v, i) => i === index ? { ...v, consulado: '', consulado_nome: text } : v))
    
    if (consuladoDebounceRef.current) clearTimeout(consuladoDebounceRef.current)
    consuladoDebounceRef.current = setTimeout(() => searchConsulados(text), 300)
  }, [searchConsulados])

  const handleConsuladoSelect = useCallback((index, consulado) => {
    setVinculos(prev => prev.map((v, i) => i === index ? { ...v, consulado: consulado.id, consulado_nome: consulado.pais } : v))
    setVinculoSearchTexts(prev => ({ ...prev, [`consulado_${index}`]: consulado.pais }))
    setConsuladosSuggestions([])
  }, [])

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
        data_validade_passaporte: data.data_validade_passaporte || '',
        rnm: data.rnm || '',
        status_visto: data.status_visto || '',
        ctps: data.ctps || '',
        nacionalidade: data.nacionalidade || '',
        sexo: data.sexo || '',
        email: data.email || '',
        telefone: data.telefone || '',
        filiacao_um: data.filiacao_um || '',
        filiacao_dois: data.filiacao_dois || '',
        data_nascimento: data.data_nascimento || '',
        data_validade_cnh: data.data_validade_cnh || '',
      })
      
      // Carregar todos os vínculos existentes
      if (data.vinculos && data.vinculos.length > 0) {
        const vinculosCarregados = data.vinculos.map(v => ({
          id: v.id,
          tipo_vinculo: v.tipo_vinculo || '',
          empresa: v.empresa || '',
          empresa_nome: v.empresa_nome || '',
          amparo: v.amparo || '',
          amparo_nome: v.amparo_nome || '',
          consulado: v.consulado || '',
          consulado_nome: v.consulado_pais || '',
          tipo_atualizacao: v.tipo_atualizacao || '',
          tipo_atualizacao_nome: v.tipo_atualizacao_nome || '',
          data_entrada_pais: v.data_entrada_pais || '',
          data_fim_vinculo: v.data_fim_vinculo || '',
          atualizacao: v.atualizacao || '',
          observacoes: v.observacoes || '',
          status: v.status !== undefined ? v.status : true,
          tipo_status: v.tipo_status || '',
          isNew: false,
          isDeleted: false,
          isExpanded: false, // Vínculos existentes começam fechados
        }))
        setVinculos(vinculosCarregados)
        
        // Inicializar textos de busca
        const searchTexts = {}
        vinculosCarregados.forEach((v, i) => {
          searchTexts[`empresa_${i}`] = v.empresa_nome
          searchTexts[`amparo_${i}`] = v.amparo_nome
          searchTexts[`consulado_${i}`] = v.consulado_nome
        })
        setVinculoSearchTexts(searchTexts)
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
    let newValue = value
    
    // Aplica formatação para campos específicos
    if (formatters[name]) {
      newValue = formatters[name](value)
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }))
    
    // Limpa erro do campo ao digitar
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target
    
    // Valida campo ao sair
    if (validators[name] && value) {
      const result = validators[name](value)
      if (!result.valid) {
        setFieldErrors(prev => ({ ...prev, [name]: result.error }))
      }
    }
  }

  function handleVinculoChange(index, e) {
    const { name, value, type, checked } = e.target
    setVinculos(prev => prev.map((v, i) => {
      if (i !== index) return v
      return {
        ...v,
        [name]: type === 'checkbox' ? checked : value,
        // Se mudar tipo_vinculo para PARTICULAR, limpar empresa
        ...(name === 'tipo_vinculo' && value === 'PARTICULAR' ? { empresa: '', empresa_nome: '' } : {})
      }
    }))
  }

  function toggleVinculoExpanded(index) {
    setVinculos(prev => prev.map((v, i) => i === index ? { ...v, isExpanded: !v.isExpanded } : v))
  }

  function addVinculo() {
    const newIndex = vinculos.length
    setVinculos(prev => [...prev, { ...emptyVinculo, id: `new-${Date.now()}` }])
    setVinculoSearchTexts(prev => ({
      ...prev,
      [`empresa_${newIndex}`]: '',
      [`amparo_${newIndex}`]: '',
      [`consulado_${newIndex}`]: '',
    }))
  }

  function removeVinculo(index) {
    setVinculos(prev => prev.map((v, i) => {
      if (i !== index) return v
      if (!v.isNew) {
        return { ...v, isDeleted: true }
      }
      return null
    }).filter(Boolean))
  }

  // Função para formatar data
  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  // Função para calcular dias restantes
  function calcularDiasRestantes(dataFim) {
    if (!dataFim) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(0, 0, 0, 0)
    const diff = fim - hoje
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Função para obter classe do badge
  function getBadgeClass(dataFim) {
    const dias = calcularDiasRestantes(dataFim)
    if (dias === null) return ''
    if (dias < 0) return 'badge-danger'
    if (dias <= 60) return 'badge-warning'
    return 'badge-success'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Valida documentos antes de enviar
    const validation = validateDocuments(formData)
    if (!validation.valid) {
      setFieldErrors(validation.errors)
      // Criar mensagem com nomes amigáveis dos campos com erro
      const camposComErro = Object.keys(validation.errors)
        .map(field => fieldLabels[field] || field)
        .join(', ')
      setError(`Por favor, corrija os erros nos campos: ${camposComErro}`)
      window.location.hash = 'mensagens'
      return
    }
    
    // Validar vínculos antes de salvar
    const vinculosAtivos = vinculos.filter(v => !v.isDeleted && v.tipo_vinculo)
    for (let i = 0; i < vinculosAtivos.length; i++) {
      const vinculo = vinculosAtivos[i]
      if (vinculo.tipo_vinculo === 'EMPRESA' && !vinculo.empresa) {
        setError(`Vínculo ${i + 1}: O campo Empresa é obrigatório para vínculos do tipo Empresa.`)
        window.location.hash = 'mensagens'
        return
      }
    }
    
    setSaving(true)

    try {
      // Limpa e normaliza os dados antes de enviar
      const dataToSend = cleanDataForSubmit({ ...formData })
      
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
      
      // Processar vínculos - só processa se tiver titularId válido
      if (!titularId) {
        throw new Error('Erro ao obter ID do titular')
      }
      
      for (const vinculo of vinculos) {
        if (!vinculo.tipo_vinculo) continue
        
        const vinculoToSend = { 
          tipo_vinculo: vinculo.tipo_vinculo,
          empresa: vinculo.empresa || null,
          amparo: vinculo.amparo || null,
          consulado: vinculo.consulado || null,
          tipo_atualizacao: vinculo.tipo_atualizacao || null,
          data_entrada_pais: vinculo.data_entrada_pais || null,
          data_fim_vinculo: vinculo.data_fim_vinculo || null,
          atualizacao: vinculo.atualizacao || null,
          observacoes: vinculo.observacoes || null,
          status: vinculo.status,
          tipo_status: vinculo.tipo_status || null,
          titular: titularId,
        }
        
        
        if (vinculoToSend.tipo_vinculo === 'PARTICULAR') {
          vinculoToSend.empresa = null
        }
        
        if (vinculo.isDeleted && !vinculo.isNew) {
          await deleteVinculo(vinculo.id)
        } else if (vinculo.isNew && !vinculo.isDeleted) {
          await createVinculo(vinculoToSend)
        } else if (!vinculo.isNew && !vinculo.isDeleted) {
          await updateVinculo(vinculo.id, vinculoToSend)
        }
      }
      
      // Mostrar mensagem de sucesso e redirecionar
      setSuccess(isEditing ? 'Titular atualizado com sucesso!' : 'Titular cadastrado com sucesso!')
      window.location.hash = 'mensagens'
      setTimeout(() => {
        navigate('/titulares')
      }, 1500)
    } catch (err) {
      const errorData = err.response?.data
      if (errorData) {
        const messages = Object.entries(errorData)
          .map(([field, errors]) => {
            const label = fieldLabels[field] || field
            let errorMsg = Array.isArray(errors) ? errors.join(', ') : errors
            // Melhorar mensagens de campos únicos
            if (errorMsg.includes('already exists') || errorMsg.includes('já existe') || errorMsg.includes('unique')) {
              errorMsg = `Este ${label} já está cadastrado no sistema.`
            }
            return `${label}: ${errorMsg}`
          })
          .join('\n')
        setError(messages)
      } else {
        setError('Erro ao salvar titular')
      }
      window.location.hash = 'mensagens'
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

      <div id="mensagens">
        {error && <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

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
                onBlur={handleBlur}
                required
                className={`form-control ${fieldErrors.nome ? 'is-invalid' : ''}`}
                placeholder="NOME COMPLETO"
              />
              {fieldErrors.nome && <small className="text-danger">{fieldErrors.nome}</small>}
            </div>
            
            <div className="form-group">
              <label htmlFor="rnm">RNM</label>
              <input
                type="text"
                id="rnm"
                name="rnm"
                value={formData.rnm}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${fieldErrors.rnm ? 'is-invalid' : ''}`}
                placeholder="V1234567"
              />
              {fieldErrors.rnm && <small className="text-danger">{fieldErrors.rnm}</small>}
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
                onBlur={handleBlur}
                className={`form-control ${fieldErrors.cpf ? 'is-invalid' : ''}`}
                placeholder="000.000.000-00"
              />
              {fieldErrors.cpf && <small className="text-danger">{fieldErrors.cpf}</small>}
            </div>
            
            <div className="form-group">
              <label htmlFor="passaporte">Passaporte</label>
              <input
                type="text"
                id="passaporte"
                name="passaporte"
                value={formData.passaporte}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${fieldErrors.passaporte ? 'is-invalid' : ''}`}
                placeholder="AB123456"
              />
              {fieldErrors.passaporte && <small className="text-danger">{fieldErrors.passaporte}</small>}
            </div>
            
            <div className="form-group">
              <label htmlFor="data_validade_passaporte">Validade Passaporte</label>
              <input
                type="date"
                id="data_validade_passaporte"
                name="data_validade_passaporte"
                value={formData.data_validade_passaporte}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status_visto">Status do Visto</label>
              <select
                id="status_visto"
                name="status_visto"
                value={formData.status_visto}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Selecione...</option>
                <option value="TEMPORARIO">Temporário</option>
                <option value="PERMANENTE">Permanente</option>
              </select>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cnh">CNH</label>
              <input
                type="text"
                id="cnh"
                name="cnh"
                value={formData.cnh}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${fieldErrors.cnh ? 'is-invalid' : ''}`}
                placeholder="00000000000"
              />
              {fieldErrors.cnh && <small className="text-danger">{fieldErrors.cnh}</small>}
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
            
            <div className="form-group">
              <label htmlFor="ctps">CTPS</label>
              <input
                type="text"
                id="ctps"
                name="ctps"
                value={formData.ctps}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${fieldErrors.ctps ? 'is-invalid' : ''}`}
                placeholder="0000000 00000-00"
              />
              {fieldErrors.ctps && <small className="text-danger">{fieldErrors.ctps}</small>}
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
                <option value="O">Outro</option>
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
              <label htmlFor="filiacao_um">Filiação 1</label>
              <input
                type="text"
                id="filiacao_um"
                name="filiacao_um"
                value={formData.filiacao_um}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="filiacao_dois">Filiação 2</label>
              <input
                type="text"
                id="filiacao_dois"
                name="filiacao_dois"
                value={formData.filiacao_dois}
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
              const dias = calcularDiasRestantes(vinculo.data_fim_vinculo)
              
              // Título do card compacto
              const tituloVinculo = vinculo.tipo_vinculo === 'EMPRESA' && vinculo.empresa_nome 
                ? vinculo.empresa_nome 
                : vinculo.tipo_vinculo === 'PARTICULAR' 
                  ? 'Particular (Autônomo)' 
                  : 'Novo Vínculo'
              
              return (
                <div 
                  key={vinculo.id} 
                  className="vinculo-card"
                  style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    backgroundColor: vinculo.status ? '#fff' : '#f9f9f9',
                    overflow: 'hidden'
                  }}
                >
                  {/* Header compacto - sempre visível */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 16px',
                      backgroundColor: vinculo.isExpanded ? '#f8f9fa' : 'transparent',
                      cursor: 'pointer',
                      borderBottom: vinculo.isExpanded ? '1px solid #ddd' : 'none'
                    }}
                    onClick={() => toggleVinculoExpanded(index)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span style={{ color: '#666' }}>{vinculo.isExpanded ? '▼' : '▶'}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>
                          {tituloVinculo}
                        </span>
                        {!vinculo.status && <span style={{ color: '#999', marginLeft: '8px' }}>(Inativo)</span>}
                      </div>
                      
                      {/* Info compacta */}
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' }}>
                        {vinculo.data_fim_vinculo && (
                          <span style={{ color: '#666' }}>
                            <strong>Vencimento:</strong> {formatDate(vinculo.data_fim_vinculo)}
                            {dias !== null && (
                              <span className={`badge ${getBadgeClass(vinculo.data_fim_vinculo)}`} style={{ marginLeft: '6px', fontSize: '11px' }}>
                                {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
                              </span>
                            )}
                          </span>
                        )}
                        {vinculo.atualizacao && (
                          <span style={{ color: '#666' }}>
                            <strong>Atualização:</strong> {formatDate(vinculo.atualizacao)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeVinculo(index); }}
                      className="btn btn-danger"
                      style={{ padding: '4px 10px', fontSize: '12px', marginLeft: '12px' }}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {/* Conteúdo expandido */}
                  {vinculo.isExpanded && (
                    <div style={{ padding: '16px' }}>
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
                          <div className="form-group" style={{ position: 'relative' }}>
                            <label>Empresa *</label>
                            <input
                              type="text"
                              value={vinculoSearchTexts[`empresa_${index}`] || vinculo.empresa_nome || ''}
                              onChange={(e) => handleEmpresaSearch(index, e.target.value)}
                              className="form-control"
                              placeholder="Digite para buscar..."
                              autoComplete="off"
                            />
                            {empresasSuggestions.length > 0 && vinculoSearchTexts[`empresa_${index}`] && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                zIndex: 1000,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}>
                                {empresasSuggestions.map(emp => (
                                  <div 
                                    key={emp.id} 
                                    onClick={() => handleEmpresaSelect(index, emp)}
                                    style={{ 
                                      padding: '8px 12px', 
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #eee'
                                    }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
                                  >
                                    {emp.nome}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="form-group" style={{ position: 'relative' }}>
                          <label>Consulado</label>
                          <input
                            type="text"
                            value={vinculoSearchTexts[`consulado_${index}`] || vinculo.consulado_nome || ''}
                            onChange={(e) => handleConsuladoSearch(index, e.target.value)}
                            className="form-control"
                            placeholder="Digite para buscar..."
                            autoComplete="off"
                          />
                          {consuladosSuggestions.length > 0 && vinculoSearchTexts[`consulado_${index}`] && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              backgroundColor: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              zIndex: 1000,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}>
                              {consuladosSuggestions.map(cons => (
                                <div 
                                  key={cons.id} 
                                  onClick={() => handleConsuladoSelect(index, cons)}
                                  style={{ 
                                    padding: '8px 12px', 
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #eee'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
                                >
                                  {cons.pais}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {vinculo.tipo_vinculo && (
                        <>
                          <div className="form-row">
                            <div className="form-group" style={{ position: 'relative' }}>
                              <label>Amparo Legal</label>
                              <input
                                type="text"
                                value={vinculoSearchTexts[`amparo_${index}`] || vinculo.amparo_nome || ''}
                                onChange={(e) => handleAmparoSearch(index, e.target.value)}
                                className="form-control"
                                placeholder="Digite para buscar..."
                                autoComplete="off"
                              />
                              {amparosSuggestions.length > 0 && vinculoSearchTexts[`amparo_${index}`] && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  backgroundColor: '#fff',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  zIndex: 1000,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}>
                                  {amparosSuggestions.map(amp => (
                                    <div 
                                      key={amp.id} 
                                      onClick={() => handleAmparoSelect(index, amp)}
                                      style={{ 
                                        padding: '8px 12px', 
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #eee'
                                      }}
                                      onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                      onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
                                    >
                                      {amp.nome}
                                    </div>
                                  ))}
                                </div>
                              )}
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
                            
                            <div className="form-group">
                              <label>Atualização</label>
                              <input
                                type="date"
                                name="atualizacao"
                                value={vinculo.atualizacao}
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
                            
                            <div className="form-group">
                              <label>Tipo Status</label>
                              <select
                                name="tipo_status"
                                value={vinculo.tipo_status}
                                onChange={(e) => handleVinculoChange(index, e)}
                                className="form-control"
                              >
                                <option value="">Selecione...</option>
                                <option value="CANCELADO">Cancelado</option>
                                <option value="VENCIDO">Vencido</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
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
