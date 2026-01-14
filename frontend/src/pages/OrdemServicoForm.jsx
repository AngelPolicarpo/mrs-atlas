import { useNavigate, useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import useOrdemServicoForm from '../hooks/useOrdemServicoForm'
import useAutoComplete from '../hooks/useAutoComplete'
import { searchContratos } from '../services/contratos'
import { searchEmpresas } from '../services/empresas'
import { searchEmpresasPrestadoras, searchTiposDespesa } from '../services/ordemServico'
import { searchTitulares, searchDependentes } from '../services/titulares'
import { searchUsers } from '../services/users'
import { scrollToMensagens } from '../utils/errorHandler'

/**
 * Formata valor em reais
 */
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Componente de AutoComplete reutilizável
 */
function AutoCompleteInput({ 
  id, 
  name, 
  value, 
  displayValue, 
  onChange, 
  onSelect, 
  suggestions, 
  onSearch, 
  onClear,
  placeholder,
  required,
  disabled,
  renderSuggestion,
  hint
}) {
  const [inputValue, setInputValue] = useState(displayValue || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    setInputValue(displayValue || '')
  }, [displayValue])

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onSearch(newValue)
    setShowSuggestions(true)
    if (!newValue) {
      onChange({ target: { name, value: '' } })
      onClear()
    }
  }

  const handleSelect = (item) => {
    onSelect(item)
    setInputValue(renderSuggestion ? renderSuggestion(item) : item.nome || item.numero)
    setShowSuggestions(false)
    onClear()
  }

  return (
    <div ref={wrapperRef} className="autocomplete-wrapper">
      <input
        type="text"
        id={id}
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="form-input"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="autocomplete-suggestions">
          {suggestions.map((item, index) => (
            <li 
              key={item.id || index} 
              onClick={() => handleSelect(item)}
              className="autocomplete-suggestion"
            >
              {renderSuggestion ? renderSuggestion(item) : item.nome || item.numero}
            </li>
          ))}
        </ul>
      )}
      {hint && <small className="form-hint">{hint}</small>}
    </div>
  )
}

function OrdemServicoForm() {
  const navigate = useNavigate()
  const { id } = useParams()

  const {
    formData,
    handleChange,
    handleSubmit: handleSubmitForm,
    loading,
    saving,
    error,
    success,
    isEditing,
    ordemServico,
    contratoSelecionado,
    titulares,
    dependentes,
    // Itens da OS (serviços do contrato)
    osItens,
    addOSItem,
    removeOSItem,
    updateOSItemData,
    handleContratoServicoChange,
    handleQuantidadeChange,
    // Despesas
    despesas,
    addDespesa,
    removeDespesa,
    updateDespesaItem,
    tiposDespesa,
    // Titulares da OS
    osTitulares,
    addOSTitular,
    removeOSTitular,
    // Dependentes da OS
    osDependentes,
    addOSDependente,
    removeOSDependente,
    // Options
    empresas,
    empresasPrestadoras,
    contratos,
    servicosContrato,
    statusOptions,
    // Cálculos
    calcularTotaisLocais,
  } = useOrdemServicoForm(id)

  // Display values for autocompletes
  const [contratoDisplay, setContratoDisplay] = useState('')
  const [empresaSolicitanteDisplay, setEmpresaSolicitanteDisplay] = useState('')
  const [empresaPagadoraDisplay, setEmpresaPagadoraDisplay] = useState('')
  const [titularSolicitanteDisplay, setTitularSolicitanteDisplay] = useState('')
  const [titularPagadorDisplay, setTitularPagadorDisplay] = useState('')
  const [solicitanteDisplay, setSolicitanteDisplay] = useState('')
  const [colaboradorDisplay, setColaboradorDisplay] = useState('')

  // AutoComplete hooks
  const contratoAC = useAutoComplete(searchContratos, { minLength: 1 })
  const empresaSolicitanteAC = useAutoComplete(searchEmpresas, { minLength: 2 })
  const empresaPagadoraAC = useAutoComplete(searchEmpresas, { minLength: 2 })
  const titularSolicitanteAC = useAutoComplete(searchTitulares, { minLength: 2 })
  const titularPagadorAC = useAutoComplete(searchTitulares, { minLength: 2 })
  const solicitanteAC = useAutoComplete(searchUsers, { minLength: 2 })
  const colaboradorAC = useAutoComplete(searchUsers, { minLength: 2 })
  const titularAC = useAutoComplete(searchTitulares, { minLength: 2 })
  const dependenteAC = useAutoComplete(searchDependentes, { minLength: 2 })

  // State para AutoComplete de titulares e dependentes
  const [titularSearchText, setTitularSearchText] = useState('')
  const [showTitularSuggestions, setShowTitularSuggestions] = useState(false)
  const [dependenteSearchText, setDependenteSearchText] = useState('')
  const [showDependenteSuggestions, setShowDependenteSuggestions] = useState(false)

  // Atualiza display values quando dados são carregados (edição)
  useEffect(() => {
    if (ordemServico) {
      setContratoDisplay(ordemServico.contrato_numero || '')
      setEmpresaSolicitanteDisplay(ordemServico.empresa_solicitante_nome || '')
      setEmpresaPagadoraDisplay(ordemServico.empresa_pagadora_nome || '')
      setTitularSolicitanteDisplay(ordemServico.titular_solicitante_nome || '')
      setTitularPagadorDisplay(ordemServico.titular_pagador_nome || '')
      setSolicitanteDisplay(ordemServico.solicitante_nome || '')
      setColaboradorDisplay(ordemServico.colaborador_nome || '')
    }
  }, [ordemServico])

  // Atualiza display quando contrato é selecionado via lista inicial
  useEffect(() => {
    if (contratoSelecionado && !contratoDisplay) {
      setContratoDisplay(`${contratoSelecionado.numero} - ${contratoSelecionado.empresa_contratante_nome}`)
    }
  }, [contratoSelecionado, contratoDisplay])

  // Auto-preenche empresa solicitante e pagadora quando contrato é selecionado (nova OS)
  useEffect(() => {
    if (!isEditing && contratoSelecionado && formData.empresa_solicitante && !empresaSolicitanteDisplay) {
      // Se o formData já tem empresa_solicitante (preenchido pelo hook), atualiza o display
      setEmpresaSolicitanteDisplay(contratoSelecionado.empresa_contratante_nome || '')
    }
    if (!isEditing && contratoSelecionado && formData.empresa_pagadora && !empresaPagadoraDisplay) {
      // Se o formData já tem empresa_pagadora (preenchido pelo hook), atualiza o display
      setEmpresaPagadoraDisplay(contratoSelecionado.empresa_contratante_nome || '')
    }
  }, [isEditing, contratoSelecionado, formData.empresa_solicitante, formData.empresa_pagadora, empresaSolicitanteDisplay, empresaPagadoraDisplay])

  // Totais calculados localmente
  const totais = calcularTotaisLocais()

  // Submit com redirecionamento
  const handleSubmit = async (e) => {
    const result = await handleSubmitForm(e)
    if (result?.success) {
      scrollToMensagens()
      setTimeout(() => navigate('/ordens-servico'), 1500)
    } else if (error) {
      scrollToMensagens()
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEditing ? `Editar OS #${ordemServico?.numero || ''}` : 'Nova Ordem de Serviço'}</h1>
        <Link to="/ordens-servico" className="btn btn-secondary">
          ← Voltar
        </Link>
      </div>

      <div id="mensagens">
        {error && (
          <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>
            {error}
          </div>
        )}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

      <form onSubmit={handleSubmit} className="form">
        {/* Seleção de Contrato */}
        <div className="form-section" style={{ borderRadius: '8px', padding: '1.5rem' }}>
          <h3>📝 Contrato <span className="required">*</span></h3>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Selecione o contrato ao qual esta OS está vinculada. Os serviços disponíveis serão baseados no contrato selecionado.
          </p>
          
          <div className="form-field">
            <label htmlFor="contrato" className="form-label">
              Contrato
            </label>
            {isEditing ? (
              <input
                type="text"
                value={contratoDisplay}
                disabled
                className="form-input"
                style={{ backgroundColor: '#f5f5f5' }}
              />
            ) : (
              <AutoCompleteInput
                id="contrato"
                name="contrato"
                value={formData.contrato}
                displayValue={contratoDisplay}
                onChange={handleChange}
                onSelect={(contrato) => {
                  handleChange({ target: { name: 'contrato', value: contrato.id } })
                  setContratoDisplay(`${contrato.numero} - ${contrato.empresa_contratante_nome}`)
                }}
                suggestions={contratoAC.suggestions}
                onSearch={contratoAC.search}
                onClear={contratoAC.clear}
                placeholder="Digite o número do contrato..."
                required
                renderSuggestion={(c) => `${c.numero} - ${c.empresa_contratante_nome}`}
                hint="Digite ao menos 1 caractere para buscar"
              />
            )}
            {isEditing && (
              <small className="form-hint">O contrato não pode ser alterado após a criação da OS</small>
            )}
          </div>

          {contratoSelecionado && (
            <div className="contrato-info" style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '4px' }}>
              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Contratante:</strong><br />
                  {contratoSelecionado.empresa_contratante_nome}
                </div>
                <div>
                  <strong>Vigência:</strong><br />
                  {contratoSelecionado.data_inicio} a {contratoSelecionado.data_fim || 'Indeterminado'}
                </div>
                <div>
                  <strong>Serviços Disponíveis:</strong><br />
                  {servicosContrato.filter(s => s.ativo).length} serviço(s)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dados da OS */}
        <div className="form-section">
          <h3>📋 Dados da Ordem de Serviço</h3>

          <div className="form-grid-3">
            {isEditing && ordemServico && (
              <div className="form-field">
                <label className="form-label">Número</label>
                <input
                  type="text"
                  value={`#${ordemServico.numero}`}
                  disabled
                  className="form-input"
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="data_abertura" className="form-label">
                Data de Abertura <span className="required">*</span>
              </label>
              <input
                type="date"
                id="data_abertura"
                name="data_abertura"
                value={formData.data_abertura}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="data_fechamento" className="form-label">
                Data de Fechamento
              </label>
              <input
                type="date"
                id="data_fechamento"
                name="data_fechamento"
                value={formData.data_fechamento || ''}
                onChange={handleChange}
                className="form-input"
              />
              <small className="form-hint">Preencher ao finalizar a OS</small>
            </div>

            <div className="form-field">
              <label htmlFor="status" className="form-label">
                Status <span className="required">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="form-select"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="solicitante" className="form-label">
                Solicitante
              </label>
              <AutoCompleteInput
                id="solicitante"
                name="solicitante"
                value={formData.solicitante}
                displayValue={solicitanteDisplay}
                onChange={handleChange}
                onSelect={(user) => {
                  handleChange({ target: { name: 'solicitante', value: user.id } })
                  setSolicitanteDisplay(user.nome)
                }}
                suggestions={solicitanteAC.suggestions}
                onSearch={solicitanteAC.search}
                onClear={solicitanteAC.clear}
                placeholder="Digite o nome do solicitante..."
                renderSuggestion={(u) => `${u.nome} (${u.email})`}
                hint="Usuário solicitante da OS"
              />
            </div>
            <div className="form-field">
              <label htmlFor="colaborador" className="form-label">
                Colaborador
              </label>
              <AutoCompleteInput
                id="colaborador"
                name="colaborador"
                value={formData.colaborador}
                displayValue={colaboradorDisplay}
                onChange={handleChange}
                onSelect={(user) => {
                  handleChange({ target: { name: 'colaborador', value: user.id } })
                  setColaboradorDisplay(user.nome)
                }}
                suggestions={colaboradorAC.suggestions}
                onSearch={colaboradorAC.search}
                onClear={colaboradorAC.clear}
                placeholder="Digite para buscar..."
                renderSuggestion={(u) => `${u.nome} (${u.email})`}
                hint="Usuário colaborador responsável pelo atendimento"
              />
            </div>
          </div>

          {/* Pessoas e Empresas - na mesma seção */}
          <div className="form-grid-3" style={{ marginTop: '1.5rem' }}>


            <div className="form-field">
              <label className="form-label">
                Solicitou OS
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="solicitante_tipo"
                    value="empresa"
                    checked={formData.solicitante_tipo === 'empresa'}
                    onChange={(e) => {
                      handleChange(e)
                      // Limpar campo do outro tipo
                      handleChange({ target: { name: 'titular_solicitante', value: '' } })
                      setTitularSolicitanteDisplay('')
                    }}
                  />
                  Empresa
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="solicitante_tipo"
                    value="titular"
                    checked={formData.solicitante_tipo === 'titular'}
                    onChange={(e) => {
                      handleChange(e)
                      // Limpar campo do outro tipo
                      handleChange({ target: { name: 'empresa_solicitante', value: '' } })
                      setEmpresaSolicitanteDisplay('')
                    }}
                  />
                  Titular (Particular)
                </label>
              </div>
              
              {formData.solicitante_tipo === 'empresa' ? (
                <AutoCompleteInput
                  id="empresa_solicitante"
                  name="empresa_solicitante"
                  value={formData.empresa_solicitante}
                  displayValue={empresaSolicitanteDisplay}
                  onChange={handleChange}
                  onSelect={(emp) => {
                    handleChange({ target: { name: 'empresa_solicitante', value: emp.id } })
                    setEmpresaSolicitanteDisplay(emp.nome)
                  }}
                  suggestions={empresaSolicitanteAC.suggestions}
                  onSearch={empresaSolicitanteAC.search}
                  onClear={empresaSolicitanteAC.clear}
                  placeholder="Digite o nome da empresa..."
                  renderSuggestion={(emp) => emp.nome}
                  hint="Empresa que solicitou a OS"
                />
              ) : (
                <AutoCompleteInput
                  id="titular_solicitante"
                  name="titular_solicitante"
                  value={formData.titular_solicitante}
                  displayValue={titularSolicitanteDisplay}
                  onChange={handleChange}
                  onSelect={(t) => {
                    handleChange({ target: { name: 'titular_solicitante', value: t.id } })
                    setTitularSolicitanteDisplay(t.nome)
                  }}
                  suggestions={titularSolicitanteAC.suggestions}
                  onSearch={titularSolicitanteAC.search}
                  onClear={titularSolicitanteAC.clear}
                  placeholder="Digite o nome do titular..."
                  renderSuggestion={(t) => `${t.nome} ${t.cpf ? `(${t.cpf})` : ''}`}
                  hint="Titular que solicitou a OS como particular"
                />
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Faturamento
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pagador_tipo"
                    value="empresa"
                    checked={formData.pagador_tipo === 'empresa'}
                    onChange={(e) => {
                      handleChange(e)
                      // Limpar campo do outro tipo
                      handleChange({ target: { name: 'titular_pagador', value: '' } })
                      setTitularPagadorDisplay('')
                    }}
                  />
                  Empresa
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pagador_tipo"
                    value="titular"
                    checked={formData.pagador_tipo === 'titular'}
                    onChange={(e) => {
                      handleChange(e)
                      // Limpar campo do outro tipo
                      handleChange({ target: { name: 'empresa_pagadora', value: '' } })
                      setEmpresaPagadoraDisplay('')
                    }}
                  />
                  Titular (Particular)
                </label>
              </div>
              
              {formData.pagador_tipo === 'empresa' ? (
                <AutoCompleteInput
                  id="empresa_pagadora"
                  name="empresa_pagadora"
                  value={formData.empresa_pagadora}
                  displayValue={empresaPagadoraDisplay}
                  onChange={handleChange}
                  onSelect={(emp) => {
                    handleChange({ target: { name: 'empresa_pagadora', value: emp.id } })
                    setEmpresaPagadoraDisplay(emp.nome)
                  }}
                  suggestions={empresaPagadoraAC.suggestions}
                  onSearch={empresaPagadoraAC.search}
                  onClear={empresaPagadoraAC.clear}
                  placeholder="Digite o nome da empresa..."
                  renderSuggestion={(emp) => emp.nome}
                  hint="Empresa responsável pelo pagamento"
                />
              ) : (
                <AutoCompleteInput
                  id="titular_pagador"
                  name="titular_pagador"
                  value={formData.titular_pagador}
                  displayValue={titularPagadorDisplay}
                  onChange={handleChange}
                  onSelect={(t) => {
                    handleChange({ target: { name: 'titular_pagador', value: t.id } })
                    setTitularPagadorDisplay(t.nome)
                  }}
                  suggestions={titularPagadorAC.suggestions}
                  onSearch={titularPagadorAC.search}
                  onClear={titularPagadorAC.clear}
                  placeholder="Digite o nome do titular..."
                  renderSuggestion={(t) => `${t.nome} ${t.cpf ? `(${t.cpf})` : ''}`}
                  hint="Titular responsável pelo pagamento (particular)"
                />
              )}
            </div>
          </div>

          {contratoSelecionado && (
            <div className="form-hint" style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fffbe6', borderRadius: '4px' }}>
              💡 <strong>Contrato vinculado:</strong> {contratoSelecionado.numero}
            </div>
          )}
        </div>

        {/* Serviços do Contrato */}
        <div className="form-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🛠️ Serviços a Executar</h3>
            <button
              type="button"
              onClick={addOSItem}
              className="btn btn-sm btn-secondary"
              disabled={!formData.contrato || servicosContrato.length === 0}
            >
              + Adicionar Serviço
            </button>
          </div>

          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            💡 A OS <strong>executa</strong> serviços já vendidos no contrato. O valor é fixo (definido no contrato).
          </p>

          {!formData.contrato ? (
            <p className="text-muted">⚠️ Selecione um contrato primeiro para ver os serviços disponíveis.</p>
          ) : servicosContrato.length === 0 ? (
            <p className="text-muted">⚠️ Este contrato não possui serviços ativos disponíveis.</p>
          ) : osItens.filter(item => !item.isDeleted).length === 0 ? (
            <p className="text-muted">Nenhum serviço adicionado. Clique em "+ Adicionar Serviço" para executar serviços do contrato.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Serviço</th>
                    <th style={{ width: '20%' }}>Valor Unitário</th>
                    <th style={{ width: '15%' }}>QUANTIDADE</th>
                    <th style={{ width: '15%' }}>Subtotal</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {osItens.map((item, index) => {
                    if (item.isDeleted) return null
                    const valorUnitario = parseFloat(item.valor_contrato) || parseFloat(item.valor_aplicado) || 0
                    const quantidade = parseInt(item.quantidade) || 1
                    const subtotal = valorUnitario * quantidade
                    
                    return (
                      <tr key={item.id || item._tempId}>
                        <td>
                          <select
                            value={item.contrato_servico}
                            onChange={(e) => handleContratoServicoChange(index, e.target.value)}
                            className="form-select"
                            required
                          >
                            <option value="">Selecione o serviço...</option>
                            {servicosContrato.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.servico_item} - {s.servico_descricao?.substring(0, 40)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formatCurrency(valorUnitario)}
                            disabled
                            className="form-input"
                            style={{ backgroundColor: '#f5f5f5', textAlign: 'right' }}
                            title="Valor definido no contrato"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => handleQuantidadeChange(index, e.target.value)}
                            className="form-input"
                            style={{ width: '80px', textAlign: 'center' }}
                            disabled={!item.contrato_servico}
                          />
                        </td>
                        <td>
                          <strong>{formatCurrency(subtotal)}</strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeOSItem(index)}
                            className="btn btn-sm btn-danger"
                            title="Remover"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right' }}><strong>Total Serviços:</strong></td>
                    <td colSpan="2"><strong>{formatCurrency(totais.valor_servicos)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Despesas */}
        <div className="form-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>💰 Despesas</h3>
            <button
              type="button"
              onClick={addDespesa}
              className="btn btn-sm btn-secondary"
            >
              + Adicionar Despesa
            </button>
          </div>

          {despesas.filter(d => !d.isDeleted).length === 0 ? (
            <p className="text-muted">Nenhuma despesa adicionada.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Despesa</th>
                    <th style={{ width: '20%' }}>Valor</th>
                    <th style={{ width: '40%' }}>Observação</th>
                    <th style={{ width: '15%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((despesa, index) => {
                    if (despesa.isDeleted) return null
                    return (
                      <tr key={despesa.id || despesa._tempId}>
                        <td>
                          <select
                            value={despesa.tipo_despesa || ''}
                            onChange={(e) => {
                              const tipoDespesa = tiposDespesa.find(t => t.id === e.target.value)
                              updateDespesaItem(index, { 
                                tipo_despesa: e.target.value,
                                tipo_despesa_item: tipoDespesa?.item || '',
                              })
                            }}
                            className="form-select"
                            required
                          >
                            <option value="">Selecione...</option>
                            {tiposDespesa.map(t => (
                              <option key={t.id} value={t.id}>{t.item}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={despesa.valor}
                            onChange={(e) => updateDespesaItem(index, { valor: e.target.value })}
                            className="form-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={despesa.observacao || ''}
                            onChange={(e) => updateDespesaItem(index, { observacao: e.target.value })}
                            className="form-input"
                            placeholder="Descrição opcional"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeDespesa(index)}
                            className="btn btn-sm btn-danger"
                            title="Remover"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ textAlign: 'right' }}><strong>Total Despesas:</strong></td>
                    <td colSpan="3"><strong>{formatCurrency(totais.valor_despesas)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Titulares */}
        <div className="form-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>👤 Titulares</h3>
          </div>
          
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            Vincule os titulares beneficiados por esta ordem de serviço.
          </p>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              type="text"
              value={titularSearchText}
              onChange={(e) => {
                const text = e.target.value
                setTitularSearchText(text)
                if (text.length >= 2) {
                  titularAC.search(text)
                  setShowTitularSuggestions(true)
                } else {
                  titularAC.clear()
                  setShowTitularSuggestions(false)
                }
              }}
              onFocus={() => titularSearchText.length >= 2 && setShowTitularSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTitularSuggestions(false), 200)}
              placeholder="Digite nome ou CPF para buscar titular..."
              className="form-input"
              autoComplete="off"
            />
            {showTitularSuggestions && titularAC.suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {titularAC.suggestions
                  .filter(t => !osTitulares.some(ot => !ot.isDeleted && ot.titular === t.id))
                  .map((titular) => (
                    <div
                      key={titular.id}
                      onClick={() => {
                        const added = addOSTitular(titular)
                        if (added) {
                          setTitularSearchText('')
                          titularAC.clear()
                          setShowTitularSuggestions(false)
                        }
                      }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                      <div style={{ fontWeight: 500 }}>{titular.nome}</div>
                      <div style={{ fontSize: '0.85em', color: '#6b7280' }}>{titular.cpf || 'Sem CPF'}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {osTitulares.filter(t => !t.isDeleted).length === 0 ? (
            <p className="text-muted">Nenhum titular vinculado. Use a busca acima para adicionar.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th style={{ width: '80px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {osTitulares.map((titular, index) => {
                    if (titular.isDeleted) return null
                    return (
                      <tr key={titular.id || titular._tempId}>
                        <td>{titular.titular_nome}</td>
                        <td>{titular.titular_cpf || '-'}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeOSTitular(index)}
                            className="btn btn-sm btn-danger"
                            title="Remover"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dependentes */}
        <div className="form-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>👨‍👩‍👧 Dependentes</h3>
          </div>
          
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            Vincule os dependentes beneficiados por esta ordem de serviço.
          </p>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              type="text"
              value={dependenteSearchText}
              onChange={(e) => {
                const text = e.target.value
                setDependenteSearchText(text)
                if (text.length >= 2) {
                  dependenteAC.search(text)
                  setShowDependenteSuggestions(true)
                } else {
                  dependenteAC.clear()
                  setShowDependenteSuggestions(false)
                }
              }}
              onFocus={() => dependenteSearchText.length >= 2 && setShowDependenteSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDependenteSuggestions(false), 200)}
              placeholder="Digite nome ou CPF para buscar dependente..."
              className="form-input"
              autoComplete="off"
            />
            {showDependenteSuggestions && dependenteAC.suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {dependenteAC.suggestions
                  .filter(d => !osDependentes.some(od => !od.isDeleted && od.dependente === d.id))
                  .map((dependente) => (
                    <div
                      key={dependente.id}
                      onClick={() => {
                        const added = addOSDependente(dependente)
                        if (added) {
                          setDependenteSearchText('')
                          dependenteAC.clear()
                          setShowDependenteSuggestions(false)
                        }
                      }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                      <div style={{ fontWeight: 500 }}>{dependente.nome}</div>
                      <div style={{ fontSize: '0.85em', color: '#6b7280' }}>
                        {dependente.cpf || 'Sem CPF'}
                        {dependente.titular_nome && ` • Titular: ${dependente.titular_nome}`}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {osDependentes.filter(d => !d.isDeleted).length === 0 ? (
            <p className="text-muted">Nenhum dependente vinculado. Use a busca acima para adicionar.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Titular</th>
                    <th style={{ width: '80px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {osDependentes.map((dependente, index) => {
                    if (dependente.isDeleted) return null
                    return (
                      <tr key={dependente.id || dependente._tempId}>
                        <td>{dependente.dependente_nome}</td>
                        <td>{dependente.dependente_cpf || '-'}</td>
                        <td>{dependente.titular_nome || '-'}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeOSDependente(index)}
                            className="btn btn-sm btn-danger"
                            title="Remover"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Observação */}
        <div className="form-section">
          <h3>📝 Observação</h3>
          <div className="form-field">
            <textarea
              id="observacao"
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="Observações adicionais sobre esta OS..."
            />
          </div>
        </div>

        {/* Resumo de Valores */}
        <div className="form-section" style={{ borderRadius: '8px', padding: '1.5rem' }}>
          <h3>📊 Resumo</h3>
          <div className="resume-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Serviços</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(totais.valor_servicos)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Despesas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(totais.valor_despesas)}</div>
            </div>
            <div style={{ background: '#007bff', color: '#fff', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem' }}>Total da OS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(totais.valor_total)}</div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Ordem de Serviço')}
          </button>
          <Link to="/ordens-servico" className="btn btn-outline">
            Cancelar
          </Link>
        </div>
      </form>

      <style>{`
        .form-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        .form-section h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e0e0e0;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .form-field {
          margin-bottom: 0.5rem;
        }
        .form-label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }
        .form-hint {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
        }
        .required {
          color: #dc3545;
        }
        /* AutoComplete Styles */
        .autocomplete-wrapper {
          position: relative;
        }
        .autocomplete-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 200px;
          overflow-y: auto;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .autocomplete-suggestion {
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }
        .autocomplete-suggestion:last-child {
          border-bottom: none;
        }
        .autocomplete-suggestion:hover {
          background: #f5f5f5;
        }
        @media (max-width: 768px) {
          .form-grid-2, .form-grid-3 {
            grid-template-columns: 1fr;
          }
          .resume-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default OrdemServicoForm
