import React, { useCallback } from 'react'
import CountryAutocomplete from './CountryAutocomplete'

/**
 * Componente puro para renderizar filtros da pesquisa
 * Responsabilidades:
 * - Renderizar filtros unificados
 * - Renderizar filtros avançados
 * - Handlers de mudança delegados ao pai
 */
function PesquisaFilters({
  filters,
  empresasAutocomplete,
  onSearch,
  onKeyPress,
}) {
  const handleClearFilters = useCallback(() => {
    filters.clearFilters()
  }, [filters])

  return (
    <div className="card filter-card">
      {/* Busca Unificada */}
      <div className="search-unified">
        <div className="search-field-selector">
          <select
            name="searchField"
            className="form-select"
            value={filters.filters.searchField}
            onChange={filters.handleFilterChange}
            style={{ border: '0px solid transparent' }}
          >
            <option value="todos">Todos os Campos</option>
            <option value="nome">Nome</option>
            <option value="rnm">RNM</option>
            <option value="cpf">CPF</option>
            <option value="passaporte">Passaporte</option>
            <option value="titular">Apenas Titulares</option>
            <option value="dependente">Apenas Dependentes</option>
          </select>
        </div>
        <div className="search-input-wrapper">
          <input
            type="text"
            name="searchTerm"
            className="form-input search-input"
            value={filters.filters.searchTerm}
            onChange={filters.handleFilterChange}
            onKeyPress={onKeyPress}
            placeholder="Buscar titulares e dependentes..."
            style={{ border: '0px solid transparent' }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => onSearch(1)}>
          🔍 Buscar
        </button>
      </div>

      {/* Filtros Adicionais */}
      <div className="filter-toggle">
        <details>
          <summary className="filter-summary">Filtros Avançados</summary>
          <div className="filter-grid">
            <div className="form-group">
              <CountryAutocomplete
                id="filter-nacionalidade"
                value={filters.filters.nacionalidade || ''}
                onChange={(value) => filters.handleItemSelect('nacionalidade', value, value)}
                label="Nacionalidade"
                placeholder="Digite para buscar país..."
              />
            </div>

            <div className="form-group">
              <CountryAutocomplete
                id="filter-consulado"
                value={filters.filters.consulado || ''}
                onChange={(value) => filters.handleItemSelect('consulado', value, value)}
                label="Consulado"
                placeholder="Digite para buscar país..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Empresa</label>
              <input
                type="text"
                className="form-input"
                value={filters.filters.empresaText || ''}
                onChange={(e) => {
                  filters.handleTextChange('empresaText', e.target.value)
                  empresasAutocomplete.search(e.target.value)
                }}
                onBlur={(e) => {
                  const emp = empresasAutocomplete.suggestions.find(
                    e2 => e2.nome.toLowerCase() === e.target.value.toLowerCase()
                  )
                  if (emp) {
                    filters.handleItemSelect('empresa', emp.nome, emp.id)
                  }
                }}
                list="empresas-list"
                placeholder="Digite para buscar..."
              />
              <datalist id="empresas-list">
                {empresasAutocomplete.suggestions.map(emp => (
                  <option key={emp.id} value={emp.nome} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo Vínculo</label>
              <select
                name="tipoVinculo"
                className="form-select"
                value={filters.filters.tipoVinculo}
                onChange={filters.handleFilterChange}
              >
                <option value="">Todos</option>
                <option value="EMPRESA">Empresa</option>
                <option value="PARTICULAR">Particular</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={filters.filters.status}
                onChange={filters.handleFilterChange}
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Evento</label>
              <select
                name="tipoEvento"
                className="form-select"
                value={filters.filters.tipoEvento}
                onChange={filters.handleFilterChange}
              >
                <option value="">Selecione...</option>
                <option value="entrada">Entrada</option>
                <option value="atualizacao">Atualização</option>
                <option value="vencimento">Vencimento</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Período</label>
              <select
                name="periodo"
                className="form-select"
                value={filters.filters.periodo}
                onChange={filters.handleFilterChange}
                disabled={!filters.filters.tipoEvento || filters.filters.dataDe || filters.filters.dataAte}
              >
                <option value="">Selecione...</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
                <option value="120">120 dias</option>
                <option value="180">6 meses</option>
                <option value="365">1 ano</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Direção do Período</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="periodoPosterior"
                    checked={filters.filters.periodoPosterior}
                    onChange={filters.handleCheckboxChange}
                    disabled={!filters.filters.tipoEvento || !filters.filters.periodo}
                  />
                  Posterior (próximos dias)
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="periodoAnterior"
                    checked={filters.filters.periodoAnterior}
                    onChange={filters.handleCheckboxChange}
                    disabled={!filters.filters.tipoEvento || !filters.filters.periodo}
                  />
                  Anterior (dias passados)
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">De</label>
              <input
                type="date"
                name="dataDe"
                className="form-input"
                value={filters.filters.dataDe}
                onChange={filters.handleFilterChange}
                disabled={!filters.filters.tipoEvento || filters.filters.periodo}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Até</label>
              <input
                type="date"
                name="dataAte"
                className="form-input"
                value={filters.filters.dataAte}
                onChange={filters.handleFilterChange}
                disabled={!filters.filters.tipoEvento || filters.filters.periodo}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={handleClearFilters}>
              Limpar Filtros
            </button>
            <button className="btn btn-primary" onClick={() => onSearch(1)}>
              Aplicar Filtros
            </button>
          </div>
        </details>
      </div>
    </div>
  )
}

export default PesquisaFilters
