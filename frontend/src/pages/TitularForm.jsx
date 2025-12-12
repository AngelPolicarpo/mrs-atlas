import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useTitularForm from '../hooks/useTitularForm'
import useAutoComplete from '../hooks/useAutoComplete'
import { getEmpresas } from '../services/empresas'
import { getAmparosLegais } from '../services/core'
import { formatters, validators } from '../utils/validation'
import VinculoCard from '../components/VinculoCard'
import PhoneInput, { isValidPhoneNumber } from '../components/PhoneInput'
import CountryAutocomplete from '../components/CountryAutocomplete'

function TitularForm() {
  const navigate = useNavigate()
  const { id } = useParams()

  const {
    formData,
    fieldErrors,
    handleFormChange,
    handleFormBlur,
    loading,
    saving,
    error,
    success,
    tiposAtualizacao,
    vinculos,
    vinculoSearchTexts,
    addVinculo,
    removeVinculo,
    toggleVinculoExpanded,
    handleVinculoChange,
    updateVinculoItem,
    setVinculoSearchText,
    handleSubmit: handleSubmitForm,
  } = useTitularForm(id)

  // Autocomplete hooks
  const { suggestions: empresasSuggestions, search: searchEmpresas, clear: clearEmpresasSuggestions } = useAutoComplete(
    (searchText) => getEmpresas({ search: searchText, status: true, page_size: 15 })
  )

  const { suggestions: amparosSuggestions, search: searchAmparos, clear: clearAmparosSuggestions } = useAutoComplete(
    (searchText) => getAmparosLegais({ search: searchText, ativo: true, page_size: 15 })
  )

  // Handlers para autocomplete
  const handleEmpresaSearch = useCallback(
    (index, text) => {
      setVinculoSearchText(`empresa_${index}`, text)
      updateVinculoItem(index, v => ({ ...v, empresa: '', empresa_nome: text }))
      searchEmpresas(text)
    },
    [searchEmpresas, setVinculoSearchText, updateVinculoItem]
  )

  const handleEmpresaSelect = useCallback(
    (index, empresa) => {
      updateVinculoItem(index, v => ({ ...v, empresa: empresa.id, empresa_nome: empresa.nome }))
      setVinculoSearchText(`empresa_${index}`, empresa.nome)
      clearEmpresasSuggestions()
    },
    [clearEmpresasSuggestions, setVinculoSearchText, updateVinculoItem]
  )

  const handleAmparoSearch = useCallback(
    (index, text) => {
      setVinculoSearchText(`amparo_${index}`, text)
      updateVinculoItem(index, v => ({ ...v, amparo: '', amparo_nome: text }))
      searchAmparos(text)
    },
    [searchAmparos, setVinculoSearchText, updateVinculoItem]
  )

  const handleAmparoSelect = useCallback(
    (index, amparo) => {
      updateVinculoItem(index, v => ({ ...v, amparo: amparo.id, amparo_nome: amparo.nome }))
      setVinculoSearchText(`amparo_${index}`, amparo.nome)
      clearAmparosSuggestions()
    },
    [clearAmparosSuggestions, setVinculoSearchText, updateVinculoItem]
  )

  const handleConsuladoChange = useCallback(
    (index, value) => {
      updateVinculoItem(index, v => ({ ...v, consulado: value }))
    },
    [updateVinculoItem]
  )

  // Submit com redirecionamento
  const handleSubmit = async (e) => {
    const result = await handleSubmitForm(e)
    if (result?.success) {
      window.location.hash = 'mensagens'
      setTimeout(() => navigate('/titulares'), 1500)
    } else if (error) {
      window.location.hash = 'mensagens'
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{id ? 'Editar Titular' : 'Novo Titular'}</h1>
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
        {/* Identificação */}
        <div className="form-section">
          <h3>Identificação</h3>

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
                onChange={(e) => handleFormChange(e, formatters.nome)}
                onBlur={(e) => handleFormBlur(e, validators.nome)}
                required
                className={`form-input ${fieldErrors.nome ? 'is-invalid' : ''}`}
                placeholder="NOME COMPLETO"
              />
              {fieldErrors.nome && <span className="form-error">{fieldErrors.nome}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="rnm" className="form-label">RNM</label>
              <input
                type="text"
                id="rnm"
                name="rnm"
                value={formData.rnm}
                onChange={(e) => handleFormChange(e, formatters.rnm)}
                onBlur={(e) => handleFormBlur(e, validators.rnm)}
                className={`form-input ${fieldErrors.rnm ? 'is-invalid' : ''}`}
                placeholder="V1234567"
              />
              {fieldErrors.rnm && <span className="form-error">{fieldErrors.rnm}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="cpf" className="form-label">CPF</label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={(e) => handleFormChange(e, formatters.cpf)}
                onBlur={(e) => handleFormBlur(e, validators.cpf)}
                className={`form-input ${fieldErrors.cpf ? 'is-invalid' : ''}`}
                placeholder="000.000.000-00"
              />
              {fieldErrors.cpf && <span className="form-error">{fieldErrors.cpf}</span>}
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
                onChange={(e) => handleFormChange(e, formatters.passaporte)}
                onBlur={(e) => handleFormBlur(e, validators.passaporte)}
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
                onChange={handleFormChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="status_visto" className="form-label">Status do Visto</label>
              <select
                id="status_visto"
                name="status_visto"
                value={formData.status_visto}
                onChange={handleFormChange}
                className="form-input"
              >
                <option value="">Selecione...</option>
                <option value="TEMPORARIO">Temporário</option>
                <option value="PERMANENTE">Permanente</option>
              </select>
            </div>

            <CountryAutocomplete
              id="nacionalidade"
              value={formData.nacionalidade}
              onChange={(value) => handleFormChange({ target: { name: 'nacionalidade', value } })}
              label="Nacionalidade"
              placeholder="Digite para buscar país..."
            />
          </div>

          <div className="form-grid-3">
            <div className="form-field">
              <label htmlFor="cnh" className="form-label">CNH</label>
              <input
                type="text"
                id="cnh"
                name="cnh"
                value={formData.cnh}
                onChange={(e) => handleFormChange(e, formatters.cnh)}
                onBlur={(e) => handleFormBlur(e, validators.cnh)}
                className={`form-input ${fieldErrors.cnh ? 'is-invalid' : ''}`}
                placeholder="00000000000"
              />
              {fieldErrors.cnh && <span className="form-error">{fieldErrors.cnh}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="data_validade_cnh" className="form-label">Validade CNH</label>
              <input
                type="date"
                id="data_validade_cnh"
                name="data_validade_cnh"
                value={formData.data_validade_cnh}
                onChange={handleFormChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="ctps" className="form-label">CTPS</label>
              <input
                type="text"
                id="ctps"
                name="ctps"
                value={formData.ctps}
                onChange={(e) => handleFormChange(e, formatters.ctps)}
                onBlur={(e) => handleFormBlur(e, validators.ctps)}
                className={`form-input ${fieldErrors.ctps ? 'is-invalid' : ''}`}
                placeholder="0000000 00000-00"
              />
              {fieldErrors.ctps && <span className="form-error">{fieldErrors.ctps}</span>}
            </div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="form-section">
          <h3>Dados Pessoais</h3>

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="sexo" className="form-label">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleFormChange}
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
                onChange={handleFormChange}
                onBlur={(e) => handleFormBlur(e, validators.data_nascimento)}
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
                onChange={(e) => handleFormChange(e, formatters.filiacao_um)}
                onBlur={(e) => handleFormBlur(e, validators.filiacao_um)}
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
                onChange={(e) => handleFormChange(e, formatters.filiacao_dois)}
                onBlur={(e) => handleFormBlur(e, validators.filiacao_dois)}
                className={`form-input ${fieldErrors.filiacao_dois ? 'is-invalid' : ''}`}
              />
              {fieldErrors.filiacao_dois && <span className="form-error">{fieldErrors.filiacao_dois}</span>}
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="form-section">
          <h3>Contato</h3>

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="email" className="form-label">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={(e) => handleFormChange(e, formatters.email)}
                onBlur={(e) => handleFormBlur(e, validators.email)}
                className={`form-input ${fieldErrors.email ? 'is-invalid' : ''}`}
              />
              {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
            </div>
              <PhoneInput
                id="telefone"
                value={formData.telefone}
                onChange={(value) => handleFormChange({ target: { name: 'telefone', value: value || '' } })}
                onBlur={(e) => handleFormBlur(e, validators.telefone)}
                label="Telefone"
                error={fieldErrors.telefone}
              />
          </div>
        </div>

        {/* Vínculos */}
        <div className="form-section">
          <div className="form-section-header">
            <h3 style={{ margin: 0 }}>Vínculos</h3>
            <button
              type="button"
              onClick={addVinculo}
              className="btn btn-secondary btn-sm"
            >
              + Adicionar Vínculo
            </button>
          </div>

          {vinculos.filter(v => !v.isDeleted).length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', padding: '1rem 0' }}>
              Nenhum vínculo cadastrado. Clique em "Adicionar Vínculo" para criar um novo.
            </p>
          ) : (
            vinculos.map(
              (vinculo, index) =>
                !vinculo.isDeleted && (
                  <VinculoCard
                    key={vinculo.id}
                    index={index}
                    vinculo={vinculo}
                    tiposAtualizacao={tiposAtualizacao}
                    vinculoSearchTexts={vinculoSearchTexts}
                    empresasSuggestions={empresasSuggestions}
                    amparosSuggestions={amparosSuggestions}
                    onToggleExpanded={toggleVinculoExpanded}
                    onRemove={removeVinculo}
                    onChange={handleVinculoChange}
                    onEmpresaSearch={handleEmpresaSearch}
                    onEmpresaSelect={handleEmpresaSelect}
                    onAmparoSearch={handleAmparoSearch}
                    onAmparoSelect={handleAmparoSelect}
                    onConsuladoChange={handleConsuladoChange}
                  />
                )
            )
          )}
        </div>

        {/* Ações */}
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/titulares')} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TitularForm
