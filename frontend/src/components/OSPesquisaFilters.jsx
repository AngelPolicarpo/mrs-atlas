import React, { useCallback } from 'react'

/**
 * Componente de filtros para Pesquisa Avançada de Ordens de Serviço
 * Responsabilidades:
 * - Renderizar filtros unificados (busca geral)
 * - Renderizar filtros avançados (datas, empresas, valores, etc.)
 * - Handlers de mudança delegados ao pai
 */
function OSPesquisaFilters({
  filters,
  empresasAutocomplete,
  contratosAutocomplete,
  centroCustosAutocomplete,
  titularesAutocomplete,
  dependentesAutocomplete,
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
            <option value="numero">Número da OS</option>
            <option value="contrato">Nº Contrato</option>
            <option value="observacao">Observação</option>
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
            placeholder="Buscar ordens de serviço..."
            style={{ border: '0px solid transparent' }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => onSearch(1)}>
          🔍 Buscar
        </button>
      </div>

      {/* Filtros Avançados */}
      <div className="filter-toggle">
        <details>
          <summary className="filter-summary">Filtros Avançados</summary>
          <div className="filter-grid">
            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={filters.filters.status}
                onChange={filters.handleFilterChange}
              >
                <option value="">Todos</option>
                <option value="ABERTA">Aberta</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            {/* Contrato */}
            <div className="form-group">
              <label className="form-label">Contrato</label>
              <input
                type="text"
                className="form-input"
                value={filters.filters.contratoText || ''}
                onChange={(e) => {
                  filters.handleTextChange('contratoText', e.target.value)
                  contratosAutocomplete.search(e.target.value)
                }}
                onBlur={(e) => {
                  const item = contratosAutocomplete.suggestions.find(
                    c => c.numero?.toLowerCase() === e.target.value.toLowerCase()
                  )
                  if (item) {
                    filters.handleItemSelect('contrato', item.numero, item.id)
                  }
                }}
                list="contratos-list"
                placeholder="Digite para buscar..."
              />
              <datalist id="contratos-list">
                {contratosAutocomplete.suggestions.map(c => (
                  <option key={c.id} value={c.numero}>
                    {c.numero} - {c.empresa_contratante_nome}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Empresa Solicitante */}
            <div className="form-group">
              <label className="form-label">Solicitante</label>
              <input
                type="text"
                className="form-input"
                value={filters.filters.empresaSolicitanteText || ''}
                onChange={(e) => {
                  filters.handleTextChange('empresaSolicitanteText', e.target.value)
                  empresasAutocomplete.search(e.target.value)
                }}
                onBlur={(e) => {
                  const emp = empresasAutocomplete.suggestions.find(
                    emp => emp.nome?.toLowerCase() === e.target.value.toLowerCase()
                  )
                  if (emp) {
                    filters.handleItemSelect('empresaSolicitante', emp.nome, emp.id)
                  }
                }}
                list="empresas-solicitante-list"
                placeholder="Digite para buscar..."
              />
              <datalist id="empresas-solicitante-list">
                {empresasAutocomplete.suggestions.map(emp => (
                  <option key={emp.id} value={emp.nome} />
                ))}
              </datalist>
            </div>

            {/* Centro de Custos */}
            <div className="form-group">
              <label className="form-label">Centro de Custos</label>
              <input
                type="text"
                className="form-input"
                value={filters.filters.centroCustosText || ''}
                onChange={(e) => {
                  filters.handleTextChange('centroCustosText', e.target.value)
                  centroCustosAutocomplete.search(e.target.value)
                }}
                onBlur={(e) => {
                  const cc = centroCustosAutocomplete.suggestions.find(
                    c => (c.nome_fantasia || c.nome_juridico)?.toLowerCase() === e.target.value.toLowerCase()
                  )
                  if (cc) {
                    filters.handleItemSelect('centroCustos', cc.nome_fantasia || cc.nome_juridico, cc.id)
                  }
                }}
                list="centro-custos-list"
                placeholder="Digite para buscar..."
              />
              <datalist id="centro-custos-list">
                {centroCustosAutocomplete.suggestions.map(cc => (
                  <option key={cc.id} value={cc.nome_fantasia || cc.nome_juridico} />
                ))}
              </datalist>
            </div>

            {/* Titular Vinculado */}
            <div className="form-group">
              <label className="form-label">Titular</label>
              <input
                type="text"
                className="form-input"
                value={filters.filters.titularText || ''}
                onChange={(e) => {
                  filters.handleTextChange('titularText', e.target.value)
                  titularesAutocomplete.search(e.target.value)
                }}
                onBlur={(e) => {
                  const tit = titularesAutocomplete.suggestions.find(
                    t => t.nome?.toLowerCase() === e.target.value.toLowerCase()
                  )
                  if (tit) {
                    filters.handleItemSelect('titular', tit.nome, tit.id)
                  }
                }}
                list="titulares-list"
                placeholder="Digite nome ou CPF..."
              />
              <datalist id="titulares-list">
                {titularesAutocomplete.suggestions.map(t => (
                  <option key={t.id} value={t.nome}>
                    {t.nome} - {t.cpf || 'Sem CPF'}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Dependente Vinculado */}
            <div className="form-group">
              <label className="form-label">Dependente</label>
              <input
                type="text"
                className="form-input"
                value={filters.filters.dependenteText || ''}
                onChange={(e) => {
                  filters.handleTextChange('dependenteText', e.target.value)
                  dependentesAutocomplete.search(e.target.value)
                }}
                onBlur={(e) => {
                  const dep = dependentesAutocomplete.suggestions.find(
                    d => d.nome?.toLowerCase() === e.target.value.toLowerCase()
                  )
                  if (dep) {
                    filters.handleItemSelect('dependente', dep.nome, dep.id)
                  }
                }}
                list="dependentes-list"
                placeholder="Digite nome ou CPF..."
              />
              <datalist id="dependentes-list">
                {dependentesAutocomplete.suggestions.map(d => (
                  <option key={d.id} value={d.nome}>
                    {d.nome} - {d.cpf || 'Sem CPF'}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Data Abertura - De */}
            <div className="form-group">
              <label className="form-label">Abertura De</label>
              <input
                type="date"
                name="dataAberturaDe"
                className="form-input"
                value={filters.filters.dataAberturaDe}
                onChange={filters.handleFilterChange}
              />
            </div>

            {/* Data Abertura - Até */}
            <div className="form-group">
              <label className="form-label">Abertura Até</label>
              <input
                type="date"
                name="dataAberturaAte"
                className="form-input"
                value={filters.filters.dataAberturaAte}
                onChange={filters.handleFilterChange}
              />
            </div>

            {/* Data Fechamento - De */}
            <div className="form-group">
              <label className="form-label">Fechamento De</label>
              <input
                type="date"
                name="dataFechamentoDe"
                className="form-input"
                value={filters.filters.dataFechamentoDe}
                onChange={filters.handleFilterChange}
              />
            </div>

            {/* Data Fechamento - Até */}
            <div className="form-group">
              <label className="form-label">Fechamento Até</label>
              <input
                type="date"
                name="dataFechamentoAte"
                className="form-input"
                value={filters.filters.dataFechamentoAte}
                onChange={filters.handleFilterChange}
              />
            </div>

            {/* Valor Mínimo */}
            <div className="form-group">
              <label className="form-label">Valor Mínimo (R$)</label>
              <input
                type="number"
                name="valorMinimo"
                className="form-input"
                value={filters.filters.valorMinimo}
                onChange={filters.handleFilterChange}
                placeholder="0,00"
                step="0.01"
                min="0"
              />
            </div>

            {/* Valor Máximo */}
            <div className="form-group">
              <label className="form-label">Valor Máximo (R$)</label>
              <input
                type="number"
                name="valorMaximo"
                className="form-input"
                value={filters.filters.valorMaximo}
                onChange={filters.handleFilterChange}
                placeholder="0,00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="filter-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearFilters}
            >
              🗑️ Limpar Filtros
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSearch(1)}
            >
              🔍 Aplicar Filtros
            </button>
          </div>
        </details>
      </div>
    </div>
  )
}

export default OSPesquisaFilters
