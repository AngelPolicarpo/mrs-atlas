import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useTitularForm from '../hooks/useTitularForm'
import useAutocomplete from '../hooks/useAutocomplete'
import { getEmpresas } from '../services/empresas'
import { getAmparosLegais, getConsulados } from '../services/core'
import { formatters, validators } from '../utils/validation'
import VinculoCard from '../components/VinculoCard'

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
    nacionalidades,
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
  const { suggestions: empresasSuggestions, search: searchEmpresas, clear: clearEmpresasSuggestions } = useAutocomplete(
    (searchText) => getEmpresas({ search: searchText, status: true, page_size: 15 })
  )

  const { suggestions: amparosSuggestions, search: searchAmparos, clear: clearAmparosSuggestions } = useAutocomplete(
    (searchText) => getAmparosLegais({ search: searchText, ativo: true, page_size: 15 })
  )

  const { suggestions: consuladosSuggestions, search: searchConsulados, clear: clearConsuladosSuggestions } = useAutocomplete(
    (searchText) => getConsulados({ search: searchText, ativo: true, page_size: 15 })
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

  const handleConsuladoSearch = useCallback(
    (index, text) => {
      setVinculoSearchText(`consulado_${index}`, text)
      updateVinculoItem(index, v => ({ ...v, consulado: '', consulado_nome: text }))
      searchConsulados(text)
    },
    [searchConsulados, setVinculoSearchText, updateVinculoItem]
  )

  const handleConsuladoSelect = useCallback(
    (index, consulado) => {
      updateVinculoItem(index, v => ({ ...v, consulado: consulado.id, consulado_nome: consulado.pais }))
      setVinculoSearchText(`consulado_${index}`, consulado.pais)
      clearConsuladosSuggestions()
    },
    [clearConsuladosSuggestions, setVinculoSearchText, updateVinculoItem]
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

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="nome">Nome Completo *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={(e) => handleFormChange(e, formatters.nome)}
                onBlur={(e) => handleFormBlur(e, validators.nome)}
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
                onChange={(e) => handleFormChange(e, formatters.rnm)}
                onBlur={(e) => handleFormBlur(e, validators.rnm)}
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
                onChange={(e) => handleFormChange(e, formatters.cpf)}
                onBlur={(e) => handleFormBlur(e, validators.cpf)}
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
                onChange={(e) => handleFormChange(e, formatters.passaporte)}
                onBlur={(e) => handleFormBlur(e, validators.passaporte)}
                className={`form-control ${fieldErrors.passaporte ? 'is-invalid' : ''}`}
                placeholder="AB123456"
              />
              {fieldErrors.passaporte && <small className="text-danger">{fieldErrors.passaporte}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="data_validade_passaporte">Validade Passaporte</label>
              <input type="date" id="data_validade_passaporte" name="data_validade_passaporte" value={formData.data_validade_passaporte} onChange={handleFormChange} className="form-control" />
            </div>

            <div className="form-group">
              <label htmlFor="status_visto">Status do Visto</label>
              <select id="status_visto" name="status_visto" value={formData.status_visto} onChange={handleFormChange} className="form-control">
                <option value="">Selecione...</option>
                <option value="TEMPORARIO">Temporário</option>
                <option value="PERMANENTE">Permanente</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nacionalidade">Nacionalidade</label>
              <select id="nacionalidade" name="nacionalidade" value={formData.nacionalidade} onChange={handleFormChange} className="form-control">
                <option value="">Selecione...</option>
                {nacionalidades.map(nac => (
                  <option key={nac.id} value={nac.id}>
                    {nac.nome}
                  </option>
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
                onChange={(e) => handleFormChange(e, formatters.cnh)}
                onBlur={(e) => handleFormBlur(e, validators.cnh)}
                className={`form-control ${fieldErrors.cnh ? 'is-invalid' : ''}`}
                placeholder="00000000000"
              />
              {fieldErrors.cnh && <small className="text-danger">{fieldErrors.cnh}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="data_validade_cnh">Validade CNH</label>
              <input type="date" id="data_validade_cnh" name="data_validade_cnh" value={formData.data_validade_cnh} onChange={handleFormChange} className="form-control" />
            </div>

            <div className="form-group">
              <label htmlFor="ctps">CTPS</label>
              <input
                type="text"
                id="ctps"
                name="ctps"
                value={formData.ctps}
                onChange={(e) => handleFormChange(e, formatters.ctps)}
                onBlur={(e) => handleFormBlur(e, validators.ctps)}
                className={`form-control ${fieldErrors.ctps ? 'is-invalid' : ''}`}
                placeholder="0000000 00000-00"
              />
              {fieldErrors.ctps && <small className="text-danger">{fieldErrors.ctps}</small>}
            </div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="form-section">
          <h3>Dados Pessoais</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sexo">Sexo</label>
              <select id="sexo" name="sexo" value={formData.sexo} onChange={handleFormChange} className="form-control">
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="data_nascimento">Data de Nascimento</label>
              <input type="date" id="data_nascimento" name="data_nascimento" value={formData.data_nascimento} onChange={handleFormChange} className="form-control" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="filiacao_um">Filiação 1</label>
              <input type="text" id="filiacao_um" name="filiacao_um" value={formData.filiacao_um} onChange={handleFormChange} className="form-control" />
            </div>

            <div className="form-group">
              <label htmlFor="filiacao_dois">Filiação 2</label>
              <input type="text" id="filiacao_dois" name="filiacao_dois" value={formData.filiacao_dois} onChange={handleFormChange} className="form-control" />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="form-section">
          <h3>Contato</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} className="form-control" />
            </div>

            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input type="text" id="telefone" name="telefone" value={formData.telefone} onChange={handleFormChange} className="form-control" placeholder="(00) 00000-0000" />
            </div>
          </div>
        </div>

        {/* Vínculos */}
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Vínculos</h3>
            <button type="button" onClick={addVinculo} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '14px' }}>
              + Adicionar Vínculo
            </button>
          </div>

          {vinculos.filter(v => !v.isDeleted).length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhum vínculo cadastrado. Clique em "Adicionar Vínculo" para criar um novo.</p>
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
                    consuladosSuggestions={consuladosSuggestions}
                    onToggleExpanded={toggleVinculoExpanded}
                    onRemove={removeVinculo}
                    onChange={handleVinculoChange}
                    onEmpresaSearch={handleEmpresaSearch}
                    onEmpresaSelect={handleEmpresaSelect}
                    onAmparoSearch={handleAmparoSearch}
                    onAmparoSelect={handleAmparoSelect}
                    onConsuladoSearch={handleConsuladoSearch}
                    onConsuladoSelect={handleConsuladoSelect}
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
