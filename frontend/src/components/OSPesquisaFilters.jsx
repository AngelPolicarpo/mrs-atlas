import React, { useCallback } from 'react'
import SearchAutocomplete from './SearchAutocomplete'

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
                <option value="FATURADA">Faturada</option>
                <option value="RECEBIDA">Recebida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            {/* Contrato */}
            <div className="form-group">
              <SearchAutocomplete
                id="filter-contrato"
                label="Contrato"
                value={filters.filters.contrato}
                displayValue={filters.filters.contratoText || ''}
                onChange={({ id, text }) => {
                  filters.handleTextChange('contratoText', text)
                  if (id) {
                    filters.handleItemSelect('contrato', text, id)
                  }
                }}
                suggestions={contratosAutocomplete.suggestions}
                onSearch={contratosAutocomplete.search}
                loading={contratosAutocomplete.loading}
                placeholder="Digite para buscar..."
                getDisplayText={(c) => c?.numero || ''}
                getSubText={(c) => c?.empresa_contratante_nome || ''}
                getId={(c) => c?.id}
              />
            </div>

            {/* Empresa Solicitante */}
            <div className="form-group">
              <SearchAutocomplete
                id="filter-empresa-solicitante"
                label="Solicitante"
                value={filters.filters.empresaSolicitante}
                displayValue={filters.filters.empresaSolicitanteText || ''}
                onChange={({ id, text }) => {
                  filters.handleTextChange('empresaSolicitanteText', text)
                  if (id) {
                    filters.handleItemSelect('empresaSolicitante', text, id)
                  }
                }}
                suggestions={empresasAutocomplete.suggestions}
                onSearch={empresasAutocomplete.search}
                loading={empresasAutocomplete.loading}
                placeholder="Digite para buscar..."
                getDisplayText={(emp) => emp?.nome || ''}
                getSubText={(emp) => emp?.cnpj || ''}
                getId={(emp) => emp?.id}
              />
            </div>

            {/* Centro de Custos */}
            <div className="form-group">
              <SearchAutocomplete
                id="filter-centro-custos"
                label="Centro de Custos"
                value={filters.filters.centroCustos}
                displayValue={filters.filters.centroCustosText || ''}
                onChange={({ id, text }) => {
                  filters.handleTextChange('centroCustosText', text)
                  if (id) {
                    filters.handleItemSelect('centroCustos', text, id)
                  }
                }}
                suggestions={centroCustosAutocomplete.suggestions}
                onSearch={centroCustosAutocomplete.search}
                loading={centroCustosAutocomplete.loading}
                placeholder="Digite para buscar..."
                getDisplayText={(cc) => cc?.nome_fantasia || cc?.nome_juridico || ''}
                getSubText={(cc) => cc?.cnpj || ''}
                getId={(cc) => cc?.id}
              />
            </div>

            {/* Titular Vinculado */}
            <div className="form-group">
              <SearchAutocomplete
                id="filter-titular"
                label="Titular"
                value={filters.filters.titular}
                displayValue={filters.filters.titularText || ''}
                onChange={({ id, text }) => {
                  filters.handleTextChange('titularText', text)
                  if (id) {
                    filters.handleItemSelect('titular', text, id)
                  }
                }}
                suggestions={titularesAutocomplete.suggestions}
                onSearch={titularesAutocomplete.search}
                loading={titularesAutocomplete.loading}
                placeholder="Digite nome ou CPF..."
                getDisplayText={(t) => t?.nome || ''}
                getSubText={(t) => t?.cpf || 'Sem CPF'}
                getId={(t) => t?.id}
              />
            </div>

            {/* Dependente Vinculado */}
            <div className="form-group">
              <SearchAutocomplete
                id="filter-dependente"
                label="Dependente"
                value={filters.filters.dependente}
                displayValue={filters.filters.dependenteText || ''}
                onChange={({ id, text }) => {
                  filters.handleTextChange('dependenteText', text)
                  if (id) {
                    filters.handleItemSelect('dependente', text, id)
                  }
                }}
                suggestions={dependentesAutocomplete.suggestions}
                onSearch={dependentesAutocomplete.search}
                loading={dependentesAutocomplete.loading}
                placeholder="Digite nome..."
                getDisplayText={(d) => d?.nome || ''}
                getSubText={(d) => `${d?.tipo_dependente || ''} - Titular: ${d?.titular_nome || ''}`}
                getId={(d) => d?.id}
              />
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
