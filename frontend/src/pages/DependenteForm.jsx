import { useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useDependenteForm from '../hooks/useDependenteForm'
import { formatDate, formatDiasRestantes, getBadgeClass } from '../utils/uiHelpers'
import { formatters, validators } from '../utils/validation'
import CountryAutocomplete from '../components/CountryAutocomplete'

function SuggestionBox({ items, onSelect, getLabel, isVisible }) {
  if (!isVisible || !items.length) return null
  return (
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
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5' }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff' }}
        >
          {getLabel(item)}
        </div>
      ))}
    </div>
  )
}

function VinculoCard({
  index,
  vinculo,
  searchTexts,
  amparosSuggestions,
  tiposAtualizacao,
  onToggle,
  onRemove,
  onChange,
  onAmparoSearch,
  onAmparoSelect,
  onConsuladoChange,
}) {
  if (vinculo.isDeleted) return null
  const diasRestantes = formatDiasRestantes(vinculo.data_fim_vinculo)
  const tituloVinculo = vinculo.amparo_nome || 'Novo Vínculo'

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
        onClick={() => onToggle(index)}
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
                {diasRestantes && (
                  <span className={`badge ${getBadgeClass(vinculo.data_fim_vinculo)}`} style={{ marginLeft: '6px', fontSize: '11px' }}>
                    {diasRestantes}
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
          onClick={(e) => { e.stopPropagation(); onRemove(index) }}
          className="btn btn-danger"
          style={{ padding: '4px 10px', fontSize: '12px', marginLeft: '12px' }}
        >
          🗑️
        </button>
      </div>

      {vinculo.isExpanded && (
        <div style={{ padding: '16px' }}>
          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Amparo Legal</label>
              <input
                type="text"
                value={searchTexts[`amparo_${index}`] || vinculo.amparo_nome || ''}
                onChange={(e) => onAmparoSearch(index, e.target.value)}
                className="form-control"
                placeholder="Digite para buscar..."
                autoComplete="off"
              />
              <SuggestionBox
                items={amparosSuggestions}
                onSelect={(item) => onAmparoSelect(index, item)}
                getLabel={(item) => item.nome}
                isVisible={Boolean(searchTexts[`amparo_${index}`])}
              />
            </div>

            <CountryAutocomplete
              id={`consulado_dep_${index}`}
              value={vinculo.consulado || ''}
              onChange={(value) => onConsuladoChange(index, value)}
              label="Consulado"
              placeholder="Digite para buscar país..."
            />

            <div className="form-group">
              <label>Tipo de Atualização</label>
              <select
                name="tipo_atualizacao"
                value={vinculo.tipo_atualizacao}
                onChange={(e) => onChange(index, e)}
                className="form-control"
              >
                <option value="">Selecione...</option>
                {tiposAtualizacao.map((t) => (
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
                onChange={(e) => onChange(index, e)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Valido até</label>
              <input
                type="date"
                name="data_fim_vinculo"
                value={vinculo.data_fim_vinculo}
                onChange={(e) => onChange(index, e)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Atualização</label>
              <input
                type="date"
                name="atualizacao"
                value={vinculo.atualizacao}
                onChange={(e) => onChange(index, e)}
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="status"
                  checked={vinculo.status}
                  onChange={(e) => onChange(index, e)}
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
                onChange={(e) => onChange(index, e)}
                className="form-control"
                rows="2"
                placeholder="Observações sobre este vínculo..."
              />
            </div>

            <div className="form-group">
              <label>Tipo Status</label>
              <select
                name="tipo_status"
                value={vinculo.tipo_status}
                onChange={(e) => onChange(index, e)}
                className="form-control"
              >
                <option value="">Selecione...</option>
                <option value="VALIDO">Válido</option>
                <option value="PENDENTE">Pendente</option>
                <option value="VENCIDO">Vencido</option>
                <option value="INDEFINIDO">Indefinido</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DependenteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const titularIdFromUrl = searchParams.get('titular')

  const onSaved = useCallback(({ titular }) => {
    setTimeout(() => {
      if (titular) {
        navigate(`/dependentes?titular=${titular}`)
      } else {
        navigate('/dependentes')
      }
    }, 1200)
  }, [navigate])

  const {
    isEditing,
    loading,
    saving,
    error,
    success,
    formData,
    fieldErrors,
    tiposAtualizacao,
    vinculos,
    vinculoSearchTexts,
    titularSearchText,
    titularSuggestions,
    amparosSuggestions,
    handleChange,
    handleBlur,
    handleTitularSearch,
    handleTitularSelect,
    handleAmparoSearch,
    handleAmparoSelect,
    handleConsuladoChange,
    handleVinculoChange,
    toggleVinculoExpanded,
    addVinculo,
    removeVinculo,
    handleSubmit,
  } = useDependenteForm({ dependenteId: id, titularIdFromUrl, onSaved })

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEditing ? 'Editar Dependente' : 'Novo Dependente'}</h1>
      </div>

      <div id="mensagens">
        {error && <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Titular</h3>
          <div className="form-grid">
            <div className="form-field" style={{ position: 'relative' }}>
              <label htmlFor="titular" className="form-label">
                Titular <span className="required">*</span>
              </label>
              <input
                type="text"
                id="titular"
                value={titularSearchText}
                onChange={(e) => handleTitularSearch(e.target.value)}
                className="form-input"
                placeholder="Digite para buscar titular..."
                autoComplete="off"
                required={!formData.titular}
              />
              {formData.titular && (
                <input type="hidden" name="titular" value={formData.titular} />
              )}
              <SuggestionBox
                items={titularSuggestions}
                onSelect={handleTitularSelect}
                getLabel={(t) => (
                  <>
                    <strong>{t.nome}</strong>
                    {t.rnm && <span style={{ color: '#666', marginLeft: '8px' }}>RNM: {t.rnm}</span>}
                    {t.passaporte && <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>Pass: {t.passaporte}</span>}
                  </>
                )}
                isVisible={Boolean(titularSearchText) && !formData.titular}
              />
              {formData.titular && (
                <small style={{ color: 'var(--success)', marginTop: '0.25rem', display: 'block', fontSize: '0.75rem' }}>
                  ✓ Titular selecionado
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Identificação do Dependente</h3>

          <div className="form-grid-2">
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="nome" className="form-label">
                Nome Completo <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`form-input ${fieldErrors.nome ? 'is-invalid' : ''}`}
                placeholder="NOME COMPLETO"
              />
              {fieldErrors.nome && <span className="form-error">{fieldErrors.nome}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="tipo_dependente" className="form-label">Tipo de Dependente</label>
              <select
                id="tipo_dependente"
                name="tipo_dependente"
                value={formData.tipo_dependente}
                onChange={handleChange}
                className="form-input"
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

          <div className="form-grid-4">
            <div className="form-field">
              <label htmlFor="passaporte" className="form-label">Passaporte</label>
              <input
                type="text"
                id="passaporte"
                name="passaporte"
                value={formData.passaporte}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${fieldErrors.passaporte ? 'is-invalid' : ''}`}
                placeholder="AB123456"
              />
              {fieldErrors.passaporte && <span className="form-error">{fieldErrors.passaporte}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="data_validade_passaporte" className="form-label">Validade Passaporte</label>
              <input
                type="date"
                id="data_validade_passaporte"
                name="data_validade_passaporte"
                value={formData.data_validade_passaporte}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="status_visto" className="form-label">Status do Visto</label>
              <select
                id="status_visto"
                name="status_visto"
                value={formData.status_visto}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Selecione...</option>
                <option value="TEMPORARIO">Temporário</option>
                <option value="PERMANENTE">Permanente</option>
              </select>
            </div>

            <div className="form-field">
              <CountryAutocomplete
                id="nacionalidade"
                value={formData.nacionalidade}
                onChange={(value) => handleChange({ target: { name: 'nacionalidade', value } })}
                label="Nacionalidade"
                placeholder="Digite para buscar país..."
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-field">
              <label htmlFor="rnm" className="form-label">RNM</label>
              <input
                type="text"
                id="rnm"
                name="rnm"
                value={formData.rnm}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${fieldErrors.rnm ? 'is-invalid' : ''}`}
                placeholder="V1234567"
              />
              {fieldErrors.rnm && <span className="form-error">{fieldErrors.rnm}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="cnh" className="form-label">CNH</label>
              <input
                type="text"
                id="cnh"
                name="cnh"
                value={formData.cnh}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${fieldErrors.cnh ? 'is-invalid' : ''}`}
                placeholder="00000000000"
              />
              {fieldErrors.cnh && <span className="form-error">{fieldErrors.cnh}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="ctps" className="form-label">CTPS</label>
              <input
                type="text"
                id="ctps"
                name="ctps"
                value={formData.ctps}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${fieldErrors.ctps ? 'is-invalid' : ''}`}
                placeholder="0000000 00000-00"
              />
              {fieldErrors.ctps && <span className="form-error">{fieldErrors.ctps}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Dados Pessoais</h3>

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="sexo" className="form-label">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="data_nascimento" className="form-label">Data de Nascimento</label>
              <input
                type="date"
                id="data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                onBlur={(e) => handleBlur(e, validators.data_nascimento)}
                className={`form-input ${fieldErrors.data_nascimento ? 'is-invalid' : ''}`}
              />
              {fieldErrors.data_nascimento && <span className="form-error">{fieldErrors.data_nascimento}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="filiacao_um" className="form-label">Filiação 1</label>
              <input
                type="text"
                id="filiacao_um"
                name="filiacao_um"
                value={formData.filiacao_um}
                onChange={(e) => {
                  const formatted = formatters.filiacao_um(e.target.value)
                  handleChange({ target: { name: 'filiacao_um', value: formatted } })
                }}
                onBlur={(e) => handleBlur(e, validators.filiacao_um)}
                className={`form-input ${fieldErrors.filiacao_um ? 'is-invalid' : ''}`}
              />
              {fieldErrors.filiacao_um && <span className="form-error">{fieldErrors.filiacao_um}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="filiacao_dois" className="form-label">Filiação 2</label>
              <input
                type="text"
                id="filiacao_dois"
                name="filiacao_dois"
                value={formData.filiacao_dois}
                onChange={(e) => {
                  const formatted = formatters.filiacao_dois(e.target.value)
                  handleChange({ target: { name: 'filiacao_dois', value: formatted } })
                }}
                onBlur={(e) => handleBlur(e, validators.filiacao_dois)}
                className={`form-input ${fieldErrors.filiacao_dois ? 'is-invalid' : ''}`}
              />
              {fieldErrors.filiacao_dois && <span className="form-error">{fieldErrors.filiacao_dois}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <h3 style={{ margin: 0 }}>📋 Vínculos Migratórios</h3>
            <button
              type="button"
              onClick={addVinculo}
              className="btn-secondary btn-sm"
            >
              + Adicionar Vínculo
            </button>
          </div>

          {vinculos.filter((v) => !v.isDeleted).length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              Nenhum vínculo cadastrado. Clique em "Adicionar Vínculo" para criar um novo.
            </p>
          ) : (
            vinculos.map((vinculo, index) => (
              <VinculoCard
                key={vinculo.id}
                index={index}
                vinculo={vinculo}
                searchTexts={vinculoSearchTexts}
                amparosSuggestions={amparosSuggestions}
                tiposAtualizacao={tiposAtualizacao}
                onToggle={toggleVinculoExpanded}
                onRemove={removeVinculo}
                onChange={handleVinculoChange}
                onAmparoSearch={handleAmparoSearch}
                onAmparoSelect={handleAmparoSelect}
                onConsuladoChange={handleConsuladoChange}
              />
            ))
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
