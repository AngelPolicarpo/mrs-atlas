import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useContratoForm from '../hooks/useContratoForm'
import { usePermissions } from '../context/PermissionContext'

/**
 * Formata valor em reais
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Formulário de Contrato com abas: Resumo, Serviços, OS
 */
function ContratoForm() {
  const navigate = useNavigate()
  const { canEditModel } = usePermissions()
  
  const {
    id,
    formData,
    servicosContrato,
    servicosDisponiveis,
    empresas,
    loading,
    saving,
    error,
    success,
    isEditing,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
    handleAtivar,
    handleFinalizar,
    handleCancelar,
    addServico,
    updateServicoContrato,
    removeServico,
    setError,
    setSuccess
  } = useContratoForm()

  // Estado para adicionar novo serviço
  const [novoServico, setNovoServico] = useState({ servico: '', valor: '', quantidade: 1 })
  
  const canEdit = canEditModel('contratos', 'contrato')
  const statusBloqueado = formData.status === 'CANCELADO' || formData.status === 'FINALIZADO'

  const handleAddServico = async () => {
    if (!novoServico.servico || !novoServico.valor) {
      setError('Selecione um serviço e informe o valor')
      return
    }
    await addServico(novoServico.servico, novoServico.valor, novoServico.quantidade)
    setNovoServico({ servico: '', valor: '', quantidade: 1 })
  }

  // Preencher valor base ao selecionar serviço
  const handleServicoChange = (e) => {
    const servicoId = e.target.value
    const servico = servicosDisponiveis.find(s => s.id === servicoId)
    setNovoServico({
      ...novoServico,
      servico: servicoId,
      valor: servico ? servico.valor_base : ''
    })
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEditing ? `📝 Contrato ${formData.numero}` : '📝 Novo Contrato'}</h1>
        <div className="btn-group">
          {isEditing && canEdit && !statusBloqueado && (
            <>
              {formData.status === 'ATIVO' && (
                <>
                  <button onClick={handleFinalizar} className="btn btn-info">
                    🏁 Finalizar
                  </button>
                  <button onClick={handleCancelar} className="btn btn-danger">
                    ❌ Cancelar
                  </button>
                </>
              )}
            </>
          )}
          <Link to="/contratos" className="btn btn-secondary">
            ← Voltar
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      {isEditing && (
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          <button
            className={`tab ${activeTab === 'resumo' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumo')}
          >
            📋 Resumo
          </button>
          <button
            className={`tab ${activeTab === 'servicos' ? 'active' : ''}`}
            onClick={() => setActiveTab('servicos')}
          >
            🛠️ Serviços ({servicosContrato.length})
          </button>
          <button
            className={`tab ${activeTab === 'os' ? 'active' : ''}`}
            onClick={() => setActiveTab('os')}
          >
            📄 Ordens de Serviço
          </button>
        </div>
      )}

      {/* Tab Resumo */}
      {(activeTab === 'resumo' || !isEditing) && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Número do Contrato *</label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={!canEdit || statusBloqueado}
                />
              </div>

              <div className="form-group">
                <label>Empresa Contratante *</label>
                <select
                  name="empresa_contratante"
                  value={formData.empresa_contratante}
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={!canEdit || statusBloqueado}
                >
                  <option value="">Selecione...</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Data de Início *</label>
                <input
                  type="date"
                  name="data_inicio"
                  value={formData.data_inicio}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={!canEdit || statusBloqueado}
                />
              </div>

              <div className="form-group">
                <label>Data de Término</label>
                <input
                  type="date"
                  name="data_fim"
                  value={formData.data_fim}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!canEdit || statusBloqueado}
                />
              </div>

              <div className="form-group full-width">
                <label>Observação</label>
                <textarea
                  name="observacao"
                  value={formData.observacao}
                  onChange={handleChange}
                  className="form-input"
                  rows="3"
                  disabled={!canEdit || statusBloqueado}
                />
              </div>
            </div>

            {canEdit && !statusBloqueado && (
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Contrato')}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab Serviços */}
      {activeTab === 'servicos' && isEditing && (
        <div className="card">
          <h3>🛠️ Serviços do Contrato</h3>
          
          {/* Adicionar novo serviço */}
          {canEdit && !statusBloqueado && (
            <div className="form-grid" style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
              <div className="form-group">
                <label>Serviço</label>
                <select
                  value={novoServico.servico}
                  onChange={handleServicoChange}
                  className="form-select"
                >
                  <option value="">Selecione um serviço...</option>
                  {servicosDisponiveis
                    .filter(s => !servicosContrato.some(sc => sc.servico === s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.item} - {s.descricao} ({formatCurrency(s.valor_base)})
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Valor Contratado</label>
                <input
                  type="number"
                  step="0.01"
                  value={novoServico.valor}
                  onChange={(e) => setNovoServico({...novoServico, valor: e.target.value})}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={novoServico.quantidade}
                  onChange={(e) => setNovoServico({...novoServico, quantidade: parseInt(e.target.value) || 1})}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="button" onClick={handleAddServico} className="btn btn-success">
                  + Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Lista de serviços */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Valor Contratado</th>
                  <th>Qtd Contratada</th>
                  <th>Qtd Executada</th>
                  <th>Saldo</th>
                  <th>Valor Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {servicosContrato.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Nenhum serviço vinculado a este contrato
                    </td>
                  </tr>
                ) : (
                  servicosContrato.map((sc) => (
                    <tr key={sc.id}>
                      <td><strong>{sc.servico_item}</strong></td>
                      <td>{sc.servico_descricao}</td>
                      <td>{formatCurrency(sc.valor)}</td>
                      <td style={{ textAlign: 'center' }}>{sc.quantidade}</td>
                      <td style={{ textAlign: 'center' }}>{sc.quantidade_executada || 0}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '12px',
                            backgroundColor: sc.saldo_disponivel === null ? '#e2f0fb' : ((sc.saldo_disponivel || sc.quantidade) > 0 ? '#d4edda' : '#f8d7da'),
                            color: sc.saldo_disponivel === null ? '#0b5ed7' : ((sc.saldo_disponivel || sc.quantidade) > 0 ? '#155724' : '#721c24'),
                            fontWeight: 'bold'
                          }}
                        >
                          {sc.saldo_disponivel === null ? 'Ilimitado' : (sc.saldo_disponivel ?? sc.quantidade)}
                        </span>
                      </td>
                      <td><strong>{formatCurrency(sc.valor_total)}</strong></td>
                      <td>
                        <span className={`badge ${sc.ativo ? 'badge-success' : 'badge-danger'}`}>
                          {sc.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        {canEdit && !statusBloqueado && (
                          <div className="btn-group">
                            <button
                              onClick={() => updateServicoContrato(sc.id, { ativo: !sc.ativo })}
                              className="btn btn-sm btn-outline"
                              title={sc.ativo ? 'Desativar' : 'Ativar'}
                            >
                              {sc.ativo ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => removeServico(sc.id)}
                              className="btn btn-sm btn-danger"
                              title="Remover"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {servicosContrato.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'right' }}><strong>Total:</strong></td>
                    <td colSpan="3">
                      <strong>
                        {formatCurrency(
                          servicosContrato
                            .filter(sc => sc.ativo)
                            .reduce((sum, sc) => sum + parseFloat(sc.valor_total || 0), 0)
                        )}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab OS */}
      {activeTab === 'os' && isEditing && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>📄 Ordens de Serviço</h3>
            {formData.status === 'ATIVO' && id && (
              <Link 
                to={`/ordens-servico/new?contrato=${id}`}
                className="btn btn-primary"
              >
                + Nova OS
              </Link>
            )}
          </div>
          
          <p className="text-muted">
            As ordens de serviço deste contrato serão listadas aqui.
            Clique em "Nova OS" para criar uma ordem de serviço vinculada a este contrato.
          </p>
          
          {/* TODO: Implementar listagem de OS do contrato */}
        </div>
      )}

      <style>{`
        .tabs {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 0;
        }
        .tab {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          font-weight: 500;
          color: #666;
        }
        .tab:hover {
          color: #333;
        }
        .tab.active {
          border-bottom-color: var(--primary-color, #007bff);
          color: var(--primary-color, #007bff);
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-actions {
          margin-top: 1.5rem;
          display: flex;
          gap: 1rem;
        }
      `}</style>
    </div>
  )
}

export default ContratoForm
