import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getEmpresa, createEmpresa, updateEmpresa } from '../services/empresas'
import { getContratos, createContrato, updateContrato, getContratoServicos, createContratoServico, updateContratoServico, deleteContratoServico, cancelarContrato, finalizarContrato } from '../services/contratos'
import { getServicosAtivos, getEmpresasPrestadoras } from '../services/ordemServico'
import useAutoComplete from '../hooks/useAutoComplete'
import { formatNomeInput, normalizeNome, formatCNPJ, validateCNPJ, removeFormatting } from '../utils/validation'

/**
 * EmpresaForm com arquitetura:
 * - Empresa (básico)
 * - Contratos (accordion expansível)
 * - Serviços (dentro do contrato)
 * * Salvamento cascata: Empresa → Contratos → Serviços
 */
function EmpresaForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Dados da empresa
  const [empresaData, setEmpresaData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    status: true,
    data_registro: '',
  })

  // Estado local: contratos e serviços (antes de salvar)
  const [contratos, setContratos] = useState([])
  const [expandedContrato, setExpandedContrato] = useState(null)
  const [empresasPrestadoras, setEmpresasPrestadoras] = useState([])
  
  // Estado para erros de validação de campos
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (isEditing) {
      loadEmpresa()
    } else {
      loadEmpresasPrestadoras()
    }
  }, [id])

  // Efeito para expandir contrato via hash da URL (ex: #contrato-uuid)
  useEffect(() => {
    if (contratos.length > 0 && location.hash) {
      const hashMatch = location.hash.match(/^#contrato-(.+)$/)
      if (hashMatch) {
        const contratoId = hashMatch[1]
        const contrato = contratos.find(c => c.id === contratoId || c._id === contratoId)
        if (contrato) {
          setExpandedContrato(contrato._id)
          // Scroll para o contrato após um pequeno delay
          setTimeout(() => {
            const element = document.getElementById(`contrato-${contrato._id}`)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 100)
        }
      }
    }
  }, [contratos, location.hash])

  async function loadEmpresa() {
    try {
      setLoading(true)
      setError('')

      const [empresaRes, contratosRes, prestadorasRes] = await Promise.all([
        getEmpresa(id),
        getContratos({ empresa_contratante: id, page_size: 1000 }),
        getEmpresasPrestadoras({ page_size: 1000, ativo: true })
      ])

      const empresa = empresaRes.data
      setEmpresaData({
        nome: empresa.nome || '',
        cnpj: empresa.cnpj || '',
        email: empresa.email || '',
        telefone: empresa.telefone || '',
        endereco: empresa.endereco || '',
        status: empresa.status ?? true,
        data_registro: empresa.data_registro || '',
      })

      setEmpresasPrestadoras(prestadorasRes.data.results || prestadorasRes.data || [])

      // Carregar contratos com seus serviços
      const contratosComServicos = await Promise.all(
        (contratosRes.data.results || contratosRes.data || []).map(async (c) => {
          try {
            const servicosRes = await getContratoServicos(c.id)
            return {
              ...c,
              _id: c.id, // Garantir que _id seja preenchido com o id do banco
              _isNew: false,
              _servicos: (servicosRes.data || []).map(s => ({
                ...s,
                _isNew: false,
                _hasChanges: false
              })),
              _hasChanges: false
            }
          } catch {
            return {
              ...c,
              _id: c.id, // Garantir que _id seja preenchido com o id do banco
              _isNew: false,
              _servicos: [],
              _hasChanges: false
            }
          }
        })
      )

      setContratos(contratosComServicos)
    } catch (err) {
      setError('Erro ao carregar dados da empresa')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadEmpresasPrestadoras() {
    try {
      const res = await getEmpresasPrestadoras({ page_size: 1000, ativo: true })
      setEmpresasPrestadoras(res.data.results || res.data || [])
    } catch (err) {
      console.error('Erro ao carregar prestadoras', err)
    }
  }

  function handleEmpresaChange(e) {
    const { name, value, type, checked } = e.target
    
    let formattedValue = value
    
    // Aplicar formatação específica por campo
    if (name === 'nome') {
      formattedValue = formatNomeInput(value)
    } else if (name === 'cnpj') {
      formattedValue = formatCNPJ(value)
      // Validar CNPJ
      const validation = validateCNPJ(formattedValue)
      setFieldErrors(prev => ({
        ...prev,
        cnpj: validation.valid ? null : validation.error
      }))
    }
    
    setEmpresaData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : formattedValue
    }))
  }

  // Adicionar novo contrato (vazio, para preenchimento)
  function handleAddContrato() {
    const novoContrato = {
      _id: `_novo_${Date.now()}`,
      numero: '',
      data_inicio: '',
      data_fim: '',
      observacao: '',
      status: 'ATIVO',
      _isNew: true,
      _servicos: [],
      _hasChanges: true
    }
    setContratos(prev => [...prev, novoContrato])
    setExpandedContrato(novoContrato._id)
  }

  // Atualizar contrato local
  function handleContratoChange(contratoId, field, value) {
    setContratos(prev =>
      prev.map(c =>
        c._id === contratoId
          ? { ...c, [field]: value, _hasChanges: true }
          : c
      )
    )
  }

  // Toggle expansão contrato
  function toggleContratoExpanded(contratoId) {
    setExpandedContrato(expandedContrato === contratoId ? null : contratoId)
  }

  // Adicionar serviço vazio em um contrato
  function handleAddServico(contratoId) {
    setContratos(prev =>
      prev.map(c =>
        c._id === contratoId
          ? {
              ...c,
              _servicos: [...c._servicos, {
                _id: `_novo_${Date.now()}`,
                servico: '',
                servico_item: '',
                servico_descricao: '',
                valor: '',
                _isNew: true,
                _hasChanges: true
              }],
              _hasChanges: true
            }
          : c
      )
    )
  }

  // Atualizar serviço local
  function handleServicoChange(contratoId, servicoIndex, field, value) {
    setContratos(prev =>
      prev.map(c =>
        c._id === contratoId
          ? {
              ...c,
              _servicos: c._servicos.map((s, idx) =>
                idx === servicoIndex
                  ? { ...s, [field]: value, _hasChanges: true }
                  : s
              ),
              _hasChanges: true
            }
          : c
      )
    )
  }

  // Remover serviço local
  function handleRemoveServico(contratoId, servicoIndex) {
    setContratos(prev =>
      prev.map(c =>
        c._id === contratoId
          ? {
              ...c,
              _servicos: c._servicos.map((s, idx) =>
                idx === servicoIndex
                  ? { ...s, _removido: true }
                  : s
              ),
              _hasChanges: true
            }
          : c
      )
    )
  }

  // Salvar: Empresa → Contratos → Serviços (cascata)
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      // 1. Validar dados da empresa
      if (!empresaData.nome || !empresaData.cnpj) {
        setError('Nome e CNPJ da empresa são obrigatórios')
        setSaving(false)
        return
      }
      
      // Validar CNPJ antes de enviar
      const cnpjValidation = validateCNPJ(empresaData.cnpj)
      if (!cnpjValidation.valid) {
        setError(cnpjValidation.error)
        setSaving(false)
        return
      }
      
      // Validar nome (mínimo 3 caracteres)
      const nomeNormalizado = normalizeNome(empresaData.nome)
      if (nomeNormalizado.length < 3) {
        setError('Nome da empresa deve ter pelo menos 3 caracteres')
        setSaving(false)
        return
      }

      // 2. Salvar ou atualizar empresa
      let empresaId = id
      const empresaPayload = { 
        ...empresaData,
        nome: nomeNormalizado, // Nome normalizado (uppercase, sem acentos)
        cnpj: removeFormatting(empresaData.cnpj) // CNPJ sem formatação
      }
      Object.keys(empresaPayload).forEach(key => {
        if (empresaPayload[key] === '') {
          empresaPayload[key] = null
        }
      })

      if (isEditing) {
        await updateEmpresa(id, empresaPayload)
      } else {
        const res = await createEmpresa(empresaPayload)
        empresaId = res.data?.id
        if (!empresaId) {
          throw new Error('Erro ao criar empresa: ID não retornado')
        }
      }

      // 3. Salvar contratos e seus serviços
      for (const contrato of contratos) {
        let contratoId = contrato.id

        // Validar contrato
        if (!contrato.numero || !contrato.data_inicio) {
          setError(`Contrato inválido: número e data são obrigatórios`)
          setSaving(false)
          return
        }

        // Criar ou atualizar contrato
        if (contrato._isNew) {
          const contratoPayload = {
            numero: contrato.numero,
            empresa_contratante: empresaId,
            data_inicio: contrato.data_inicio,
            data_fim: contrato.data_fim || null,
            observacao: contrato.observacao || null
          }
          const res = await createContrato(contratoPayload)
          contratoId = res.data?.id
          if (!contratoId) {
            throw new Error('Erro ao criar contrato: ID não retornado')
          }
        } else {
          const contratoPayload = {
            numero: contrato.numero,
            data_inicio: contrato.data_inicio,
            data_fim: contrato.data_fim || null,
            observacao: contrato.observacao || null
          }
          await updateContrato(contratoId, contratoPayload)
        }

        // Salvar serviços do contrato
        for (const servico of contrato._servicos) {
          // Se marcado como removido e tem ID (foi salvo antes), deletar
          if (servico._removido) {
            if (servico.id && !servico._isNew) {
              // Deletar do backend
              await deleteContratoServico(servico.id)
            }
            continue // Pular para próximo
          }

          if (!servico.servico_item || !servico.valor) {
            setError('Todos os serviços devem ter tipo e valor')
            setSaving(false)
            return
          }

          // Validação adicional: servico ID deve estar preenchido
          if (!servico.servico) {
            setError(`Serviço "${servico.servico_item}" não foi selecionado corretamente. Use o autocomplete para selecionar.`)
            setSaving(false)
            return
          }

          if (servico._isNew) {
            await createContratoServico({
              contrato: contratoId,
              servico: servico.servico, // Agora obrigatório
              valor: parseFloat(servico.valor),
              ativo: true
            })
          } else if (servico._hasChanges) {
            await updateContratoServico(servico.id, {
              valor: parseFloat(servico.valor)
            })
          }
        }
      }

      setSuccess('Empresa, contratos e serviços salvos com sucesso!')
      
      // Recarregar dados
      setTimeout(() => {
        if (!isEditing && empresaId) {
          navigate(`/empresas/${empresaId}`, { replace: true })
        } else {
          loadEmpresa()
        }
      }, 1500)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      // Tratamento de erros do backend
      const errorData = err.response?.data
      if (errorData) {
        // Formatar mensagens de erro do backend
        if (typeof errorData === 'object' && !errorData.detail) {
          const messages = Object.entries(errorData)
            .map(([field, errors]) => {
              const fieldLabel = {
                nome: 'Nome',
                cnpj: 'CNPJ',
                email: 'Email',
                telefone: 'Telefone'
              }[field] || field
              const errorMsg = Array.isArray(errors) ? errors.join(', ') : errors
              return `${fieldLabel}: ${errorMsg}`
            })
            .join('\n')
          setError(messages)
        } else {
          setError(errorData.detail || errorData.error || 'Erro ao salvar')
        }
      } else {
        setError(err.message || 'Erro ao salvar')
      }
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

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
        {/* Seção: Dados da Empresa */}
        <div className="form-section">
          <h3>📋 Dados da Empresa</h3>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="nome">Nome *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={empresaData.nome}
                onChange={handleEmpresaChange}
                required
                className="form-control"
                placeholder="NOME DA EMPRESA"
              />
              <small style={{ color: '#6b7280', fontSize: '0.8em' }}>
                Apenas letras e espaços. Será convertido para maiúsculas.
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="cnpj">CNPJ *</label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={empresaData.cnpj}
                onChange={handleEmpresaChange}
                required
                className={`form-control ${fieldErrors.cnpj ? 'is-invalid' : ''}`}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              {fieldErrors.cnpj && (
                <small style={{ color: '#dc2626', fontSize: '0.8em' }}>{fieldErrors.cnpj}</small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={empresaData.email}
                onChange={handleEmpresaChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="text"
                id="telefone"
                name="telefone"
                value={empresaData.telefone}
                onChange={handleEmpresaChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="endereco">Endereço</label>
            <textarea
              id="endereco"
              name="endereco"
              value={empresaData.endereco}
              onChange={handleEmpresaChange}
              className="form-control"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="data_registro">Data de Registro</label>
              <input
                type="date"
                id="data_registro"
                name="data_registro"
                value={empresaData.data_registro}
                onChange={handleEmpresaChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="status"
                  checked={empresaData.status}
                  onChange={handleEmpresaChange}
                />
                Empresa Ativa
              </label>
            </div>
          </div>
        </div>

        {/* Seção: Contratos (Accordion) */}
        {isEditing && (
          <div className="form-section">
            <h3>📝 Contratos</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={handleAddContrato}
                className="btn btn-success"
              >
                + Novo Contrato
              </button>
            </div>

            {contratos.length === 0 ? (
              <p className="text-muted">Nenhum contrato. Clique em "+ Novo Contrato" para começar.</p>
            ) : (
              <div className="contratos-list">
                {contratos.map((contrato, idx) => (
                  <div key={contrato._id} id={`contrato-${contrato._id}`}>
                    <ContratoAccordion
                      contrato={contrato}
                      index={idx}
                      isExpanded={expandedContrato === contrato._id}
                      onToggle={() => toggleContratoExpanded(contrato._id)}
                      onChange={(field, value) => handleContratoChange(contrato._id, field, value)}
                      onAddServico={() => handleAddServico(contrato._id)}
                      onServicoChange={(sIdx, field, value) => handleServicoChange(contrato._id, sIdx, field, value)}
                      onRemoveServico={(sIdx) => handleRemoveServico(contrato._id, sIdx)}
                      onReload={loadEmpresa}
                      setError={setError}
                      setSuccess={setSuccess}
                      empresasPrestadoras={empresasPrestadoras}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isEditing && (
          <div className="form-section">
            <h3>📝 Contratos</h3>
            <p className="text-muted">Você poderá adicionar contratos após criar a empresa.</p>
          </div>
        )}

        {/* Botões de Ação */}
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
            {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Empresa')}
          </button>
        </div>
      </form>
    </div>
  )
}

/**
 * Accordion para cada contrato
 */
function ContratoAccordion({
  contrato,
  index,
  isExpanded,
  onToggle,
  onChange,
  onAddServico,
  onServicoChange,
  onRemoveServico,
  onReload,
  setError,
  setSuccess,
  empresasPrestadoras
}) {
  const [actionLoading, setActionLoading] = useState(false)

  // Handler para cancelar contrato
  async function handleCancelarContrato() {
    if (!contrato.id || contrato._isNew) {
      setError('Salve o contrato antes de cancelá-lo')
      return
    }
    if (!window.confirm('Tem certeza que deseja CANCELAR este contrato? Esta ação não pode ser desfeita.')) {
      return
    }
    
    setActionLoading(true)
    try {
      await cancelarContrato(contrato.id)
      setSuccess('Contrato cancelado com sucesso!')
      onReload()
    } catch (err) {
      console.error('Erro ao cancelar contrato:', err)
      setError(err.response?.data?.error || err.response?.data?.detail || 'Erro ao cancelar contrato')
    } finally {
      setActionLoading(false)
    }
  }

  // Handler para finalizar contrato
  async function handleFinalizarContrato() {
    if (!contrato.id || contrato._isNew) {
      setError('Salve o contrato antes de finalizá-lo')
      return
    }
    if (!window.confirm('Tem certeza que deseja FINALIZAR este contrato?')) {
      return
    }
    
    setActionLoading(true)
    try {
      await finalizarContrato(contrato.id)
      setSuccess('Contrato finalizado com sucesso!')
      onReload()
    } catch (err) {
      console.error('Erro ao finalizar contrato:', err)
      setError(err.response?.data?.error || err.response?.data?.detail || 'Erro ao finalizar contrato')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem', overflow: 'visible', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {/* Header do Accordion */}
      <div
        style={{
          padding: '1rem',
          background: '#f9fafb',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
        }}
        onClick={onToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <strong>{contrato.numero || `Contrato ${index + 1}`}</strong>
          {contrato.data_inicio && <span style={{ color: '#6b7280', fontSize: '0.9em' }}>• desde {contrato.data_inicio}</span>}
          <span style={{ 
            fontSize: '0.75em', 
            padding: '2px 8px', 
            borderRadius: '9999px', 
            background: getStatusColor(contrato.status),
            fontWeight: 500
          }}>
            {contrato.status || 'RASCUNHO'}
          </span>
        </div>
        <span style={{ fontSize: '1.2rem', color: '#9ca3af', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
      </div>

      {/* Conteúdo do Accordion */}
      {isExpanded && (
        <div style={{ padding: '1.5rem', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9em', color: '#374151', fontWeight: 500 }}>Número do Contrato *</label>
              <input
                type="text"
                value={contrato.numero}
                onChange={(e) => onChange('numero', e.target.value)}
                className="form-control"
                placeholder="Ex: CNT-2024/001"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9em', color: '#374151', fontWeight: 500 }}>Data de Início *</label>
              <input
                type="date"
                value={contrato.data_inicio}
                onChange={(e) => onChange('data_inicio', e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9em', color: '#374151', fontWeight: 500 }}>Data de Término</label>
              <input
                type="date"
                value={contrato.data_fim || ''}
                onChange={(e) => onChange('data_fim', e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9em', color: '#374151', fontWeight: 500 }}>Observação</label>
            <textarea
              value={contrato.observacao || ''}
              onChange={(e) => onChange('observacao', e.target.value)}
              className="form-control"
              rows="2"
              style={{ width: '100%' }}
            />
          </div>

          {/* Serviços do Contrato */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, color: '#1f2937' }}>🛠️ Serviços ({contrato._servicos.filter(s => !s._removido).length})</h4>
              <button
                type="button"
                onClick={onAddServico}
                className="btn btn-sm btn-success"
              >
                + Adicionar Serviço
              </button>
            </div>

            {contrato._servicos.filter(s => !s._removido).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                <p className="text-muted">Nenhum serviço vinculado. Clique em "+ Adicionar Serviço" para começar.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {contrato._servicos
                  .filter(s => !s._removido) // Filtrar apenas serviços não removidos
                  .map((servico, sIdx) => {
                    // Encontrar índice real no array original
                    const indexReal = contrato._servicos.indexOf(servico)
                    return (
                      <ServicoItem 
                        key={`${contrato._id}-${indexReal}`}
                        servico={servico}
                        contrato={contrato}
                        onServicoChange={(field, value) => onServicoChange(indexReal, field, value)}
                        // CORREÇÃO ABAIXO: Passar apenas o indexReal
                        onRemove={() => onRemoveServico(indexReal)} 
                      />
                    )
                  })}
              </div>
            )}
          </div>

          {/* Botões do Contrato */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {/* Mostrar botões apenas para contratos salvos e ativos */}
            {!contrato._isNew && contrato.status === 'ATIVO' && (
              <>
                <button
                  type="button"
                  onClick={handleCancelarContrato}
                  disabled={actionLoading}
                  className="btn btn-sm"
                  style={{ 
                    fontSize: '0.85em',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  ❌ {actionLoading ? 'Processando...' : 'Cancelar Contrato'}
                </button>
                <button
                  type="button"
                  onClick={handleFinalizarContrato}
                  disabled={actionLoading}
                  className="btn btn-sm"
                  style={{ 
                    fontSize: '0.85em',
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  ✅ {actionLoading ? 'Processando...' : 'Finalizar Contrato'}
                </button>
              </>
            )}
            {/* Mostrar mensagem para contratos não-ativos */}
            {!contrato._isNew && contrato.status !== 'ATIVO' && (
              <span style={{ 
                fontSize: '0.85em', 
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Contrato {contrato.status?.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Item de serviço (Substituindo a Table Row por um Card/Grid)
 */
function ServicoItem({ servico, contrato, onServicoChange, onRemove }) {
  const { suggestions, search, clear } = useAutoComplete(
    (searchText) => getServicosAtivos({ search: searchText })
  )
  
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchText, setSearchText] = useState(servico.servico_item || '')

  const handleSearchChange = (text) => {
    setSearchText(text)
    onServicoChange('servico_item', text)
    if (text.length > 0) {
      search(text)
      setShowSuggestions(true)
    } else {
      clear()
      setShowSuggestions(false)
    }
  }

  // Filtrar sugestões para remover serviços já adicionados ao contrato
  const getFilteredSuggestions = () => {
    if (!contrato || !contrato._servicos) {
      return suggestions
    }
    
    // IDs dos serviços já adicionados (excluindo o serviço atual sendo editado)
    const servicosAdicionados = new Set(
      contrato._servicos
        .filter(s => s.servico) // Apenas os que foram selecionados
        .map(s => s.servico)
    )
    
    // Remover do ID do serviço atual para permitir edição
    if (servico.servico) {
      servicosAdicionados.delete(servico.servico)
    }
    
    // Filtrar sugestões
    return suggestions.filter(s => !servicosAdicionados.has(s.id))
  }

  const handleClearSearch = () => {
    setSearchText('')
    onServicoChange('servico_item', '')
    onServicoChange('servico', '')
    onServicoChange('valor', '')
    clear()
  }

  const handleSelectServico = (servicoData) => {
    setSearchText(servicoData.item)
    onServicoChange('servico_item', servicoData.item)
    onServicoChange('servico', servicoData.id)
    onServicoChange('valor', servicoData.valor_base || '')
    setShowSuggestions(false)
    clear()
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 150px 40px', 
      gap: '1rem', 
      alignItems: 'start', 
      background: '#fff', 
      padding: '0.75rem', 
      borderRadius: '6px', 
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
    }}>
      
      {/* Campo de Busca com Autocomplete */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {/* Ícone de Lupa */}
          <span style={{ position: 'absolute', left: '10px', fontSize: '14px', color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
          
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar serviço (ex: Manutenção...)"
            className="form-control"
            style={{ width: '100%', paddingLeft: '32px', paddingRight: searchText ? '30px' : '10px' }}
            onFocus={() => searchText.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />

          {/* Botão Limpar (X) */}
          {searchText && (
            <button 
              type="button" 
              onClick={handleClearSearch}
              style={{ 
                position: 'absolute', 
                right: '10px', 
                border: 'none', 
                background: 'transparent', 
                color: '#9ca3af', 
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Limpar campo"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Mensagem quando não há serviços disponíveis */}
        {showSuggestions && suggestions.length > 0 && getFilteredSuggestions().length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              marginTop: '4px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.9em',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            ℹ️ Todos os serviços encontrados já foram adicionados a este contrato
          </div>
        )}
        
        {/* Dropdown de Sugestões Melhorado */}
        {showSuggestions && getFilteredSuggestions().length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              maxHeight: '240px',
              overflowY: 'auto',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              marginTop: '4px'
            }}
          >
            {getFilteredSuggestions().map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectServico(s)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.1s',
                  backgroundColor: '#fff'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
              >
                <div style={{ overflow: 'hidden', marginRight: '10px', flex: 1 }}>
                  <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.95em' }}>{s.item}</div>
                  <div style={{ 
                    fontSize: '0.8em', 
                    color: '#6b7280', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    maxWidth: '100%' 
                  }}>
                    {s.descricao}
                  </div>
                </div>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#059669', 
                  fontSize: '0.9em', 
                  whiteSpace: 'nowrap',
                  marginLeft: '10px',
                  minWidth: 'auto'
                }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.valor_base)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input de Valor */}
      <div>
        <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '0.9em' }}>R$</span>
            <input
                type="number"
                step="0.01"
                value={servico.valor || ''}
                onChange={(e) => onServicoChange('valor', e.target.value)}
                placeholder="0.00"
                className="form-control"
                style={{ width: '100%', paddingLeft: '35px' }}
            />
        </div>
      </div>

      {/* Botão de Remover */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5px' }}>
        <button
          type="button"
          onClick={onRemove}
          className="btn-icon-danger"
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '1.2rem',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          title="Remover Serviço"
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

/**
 * Função auxiliar para cor de status
 */
function getStatusColor(status) {
  const colors = {
    'ATIVO': '#d1fae5',    // Verde claro
    'CANCELADO': '#fee2e2',// Vermelho
    'FINALIZADO': '#f3f4f6'// Cinza
  }
  return colors[status] || '#f3f4f6'
}

export default EmpresaForm