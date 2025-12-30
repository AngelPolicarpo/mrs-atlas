import { formatDate, getBadgeClass, formatDiasRestantes, calcularDiasRestantes, getTituloVinculo } from '../utils/uiHelpers'
import { formatLocalDate } from '../utils/dateUtils'
import CountryAutocomplete from './CountryAutocomplete'

/**
 * Componente apresenta UI de um vínculo (card expandível/colapsável)
 * Recebe todos os dados e callbacks como props
 * Sem lógica de negócio ou estado
 */
function VinculoCard({
  index,
  vinculo,
  tiposAtualizacao,
  vinculoSearchTexts,
  empresasSuggestions,
  amparosSuggestions,
  onToggleExpanded,
  onRemove,
  onChange,
  onEmpresaSearch,
  onEmpresaSelect,
  onAmparoSearch,
  onAmparoSelect,
  onConsuladoChange,
}) {
  const dias = calcularDiasRestantes(vinculo.data_fim_vinculo)
  const tituloVinculo = getTituloVinculo(vinculo)
  const hoje = formatLocalDate();


  return (
    <div
      className="vinculo-card"
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '12px',
        backgroundColor: vinculo.status ? '#fff' : '#f9f9f9',
        overflow: 'hidden',
      }}
    >
      {/* Header compacto */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: vinculo.isExpanded ? '#f8f9fa' : 'transparent',
          cursor: 'pointer',
          borderBottom: vinculo.isExpanded ? '1px solid #ddd' : 'none',
        }}
        onClick={() => onToggleExpanded(index)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ color: '#666' }}>{vinculo.isExpanded ? '▼' : '▶'}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 'bold', color: '#333' }}>{tituloVinculo}</span>
            {!vinculo.status && <span style={{ color: '#999', marginLeft: '8px' }}>(Inativo)</span>}
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' }}>
            {vinculo.data_fim_vinculo && (
              <span style={{ color: '#666' }}>
                <strong>Vencimento:</strong> {formatDate(vinculo.data_fim_vinculo)}
                {dias !== null && (
                  <span className={`badge ${getBadgeClass(vinculo.data_fim_vinculo)}`} style={{ marginLeft: '6px', fontSize: '11px' }}>
                    {formatDiasRestantes(vinculo.data_fim_vinculo)}
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
          onClick={(e) => {
            e.stopPropagation()
            onRemove(index)
          }}
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
              <select name="tipo_vinculo" value={vinculo.tipo_vinculo} onChange={(e) => onChange(index, e)} className="form-control" required>
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
                  onChange={(e) => onEmpresaSearch(index, e.target.value)}
                  className="form-control"
                  placeholder="Digite para buscar..."
                  autoComplete="off"
                />
                {empresasSuggestions.length > 0 && vinculoSearchTexts[`empresa_${index}`] && (
                  <div
                    style={{
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
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    {empresasSuggestions.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => onEmpresaSelect(index, emp)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                        }}
                        onMouseOver={e => (e.target.style.backgroundColor = '#f5f5f5')}
                        onMouseOut={e => (e.target.style.backgroundColor = '#fff')}
                      >
                        {emp.nome}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <CountryAutocomplete
              id={`consulado_${index}`}
              value={vinculo.consulado || ''}
              onChange={(value) => onConsuladoChange(index, value)}
              label="Consulado"
              placeholder="Digite para buscar país..."
            />
          </div>

          {vinculo.tipo_vinculo && (
            <>
              <div className="form-row">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Amparo Legal</label>
                  <input
                    type="text"
                    value={vinculoSearchTexts[`amparo_${index}`] || vinculo.amparo_nome || ''}
                    onChange={(e) => onAmparoSearch(index, e.target.value)}
                    className="form-control"
                    placeholder="Digite para buscar..."
                    autoComplete="off"
                  />
                  {amparosSuggestions.length > 0 && vinculoSearchTexts[`amparo_${index}`] && (
                    <div
                      style={{
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
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      {amparosSuggestions.map(amp => (
                        <div
                          key={amp.id}
                          onClick={() => onAmparoSelect(index, amp)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                          }}
                          onMouseOver={e => (e.target.style.backgroundColor = '#f5f5f5')}
                          onMouseOut={e => (e.target.style.backgroundColor = '#fff')}
                        >
                          {amp.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Tipo de Atualização</label>
                  <select name="tipo_atualizacao" value={vinculo.tipo_atualizacao} onChange={(e) => onChange(index, e)} className="form-control">
                    <option value="">Selecione...</option>
                    {tiposAtualizacao.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data de Entrada no País</label>
                  <input type="date" name="data_entrada_pais" value={vinculo.data_entrada_pais} onChange={(e) => onChange(index, e)} className="form-control" />
                </div>

                <div className="form-group">
                  <label>Valido até</label>
                  <input type="date" name="data_fim_vinculo" value={vinculo.data_fim_vinculo} onChange={(e) => onChange(index, e)} className="form-control" />
                </div>

                <div className="form-group">
                  <label>Atualização</label>
                  <input type="date" name="atualizacao" value={vinculo.atualizacao || hoje} onChange={(e) => onChange(index, e)} className="form-control" />
                </div>

                <div className="form-group">
                  <label>Status do Vínculo</label>
                  <select
                    name="tipo_status"
                    value={vinculo.tipo_status || "ATIVO"}
                    onChange={(e) => {
                      // Atualiza tipo_status e status (boolean) juntos
                      const tipoStatus = e.target.value
                      const isAtivo = tipoStatus === "ATIVO"
                      onChange(index, { target: { name: 'tipo_status', value: tipoStatus } })
                      onChange(index, { target: { name: 'status', value: isAtivo, type: 'checkbox', checked: isAtivo } })
                    }}
                    className="form-control"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="CANCELADO">CANCELADO</option>
                    <option value="VENCIDO">VENCIDO</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Observações</label>
                  <textarea name="observacoes" value={vinculo.observacoes} onChange={(e) => onChange(index, e)} className="form-control" rows="2" />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default VinculoCard
