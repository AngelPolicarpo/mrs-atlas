import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { pesquisaUnificada } from '../services/titulares'
import { getEmpresas } from '../services/empresas'
import { getNacionalidades } from '../services/core'

function Pesquisa() {
  // Estados dos filtros
  const [filters, setFilters] = useState({
    searchTerm: '',
    searchField: 'todos',
    nacionalidade: '',
    nacionalidadeText: '',
    empresa: '',
    empresaText: '',
    tipoVinculo: '',
    status: '',
    tipoEvento: '',
    periodo: '',
    periodoAnterior: false,
    periodoPosterior: true,
    dataDe: '',
    dataAte: '',
  })
  
  // Estados de paginação
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  })
  
  // Estados da página
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})
  
  // Dados para combos
  const [nacionalidades, setNacionalidades] = useState([])
  const [empresas, setEmpresas] = useState([])
  
  // Carregar dados para combos
  useEffect(() => {
    async function loadCombos() {
      try {
        const [nacRes, empRes] = await Promise.all([
          getNacionalidades(),
          getEmpresas({ page_size: 1000 }),
        ])
        setNacionalidades(nacRes.data.results || nacRes.data || [])
        setEmpresas(empRes.data.results || empRes.data || [])
      } catch (error) {
        console.error('Erro ao carregar combos:', error)
      }
    }
    loadCombos()
  }, [])
  
  // Função para calcular datas do período
  const calcularDatasDoPerido = useCallback(() => {
    if (!filters.tipoEvento || !filters.periodo) {
      return { dataDe: null, dataAte: null }
    }
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const diasOffset = parseInt(filters.periodo) || 0
    
    const dataLimite = new Date(hoje)
    if (filters.periodoPosterior) {
      dataLimite.setDate(dataLimite.getDate() + diasOffset)
    } else {
      dataLimite.setDate(dataLimite.getDate() - diasOffset)
    }
    
    const hojeStr = hoje.toISOString().split('T')[0]
    const dataLimiteStr = dataLimite.toISOString().split('T')[0]
    
    if (filters.periodoPosterior) {
      return { dataDe: hojeStr, dataAte: dataLimiteStr }
    } else {
      return { dataDe: dataLimiteStr, dataAte: hojeStr }
    }
  }, [filters.tipoEvento, filters.periodo, filters.periodoPosterior])
  
  // Função de busca paginada
  const handleSearch = useCallback(async (page = 1, customPageSize = null) => {
    setLoading(true)
    
    try {
      const params = {
        page,
        page_size: customPageSize || pagination.pageSize,
      }
      
      // Adicionar filtro de busca
      if (filters.searchTerm) {
        params.search = filters.searchTerm
      }
      
      // Filtros de titular
      if (filters.nacionalidade) params.nacionalidade = filters.nacionalidade
      if (filters.empresa) params.empresa = filters.empresa
      if (filters.tipoVinculo) params.tipo_vinculo = filters.tipoVinculo
      if (filters.status) params.vinculo_status = filters.status === 'ativo' ? 'true' : 'false'
      
      // Filtros de data
      if (filters.tipoEvento) {
        params.tipo_evento = filters.tipoEvento
        
        // Se usa período, calcular datas
        if (filters.periodo) {
          const { dataDe, dataAte } = calcularDatasDoPerido()
          if (dataDe) params.data_de = dataDe
          if (dataAte) params.data_ate = dataAte
        } else {
          // Usar datas manuais
          if (filters.dataDe) params.data_de = filters.dataDe
          if (filters.dataAte) params.data_ate = filters.dataAte
        }
      }
      
      // Fazer requisição
      const response = await pesquisaUnificada(params)
      const data = response.data
      
      setResults(data.results || [])
      setPagination(prev => ({
        ...prev,
        page: data.page,
        totalPages: data.total_pages,
        totalCount: data.count,
        hasNext: data.has_next,
        hasPrevious: data.has_previous,
      }))
      
      // Limpar expansões ao mudar de página
      setExpandedItems({})
      
    } catch (error) {
      console.error('Erro na busca:', error)
      setResults([])
      setPagination(prev => ({
        ...prev,
        page: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
      }))
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.pageSize, calcularDatasDoPerido])
  
  // Buscar ao carregar
  useEffect(() => {
    handleSearch(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Navegação de páginas
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      handleSearch(page)
    }
  }
  
  const goToNextPage = () => {
    if (pagination.hasNext) {
      handleSearch(pagination.page + 1)
    }
  }
  
  const goToPreviousPage = () => {
    if (pagination.hasPrevious) {
      handleSearch(pagination.page - 1)
    }
  }
  
  // Mudar tamanho da página
  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, pageSize: newSize }))
    // Rebuscar imediatamente com o novo tamanho
    handleSearch(1, newSize)
  }
  
  // Função para calcular dias restantes
  function calcularDiasRestantes(dataFim) {
    if (!dataFim) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(0, 0, 0, 0)
    const diffTime = fim - hoje
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  
  // Função para obter classe da linha baseado no vencimento
  function getRowClass(dataFim, type) {
    let baseClass = type === 'dependente' ? 'row-dependente' : ''
    if (type === 'dependente-orphan') baseClass = 'row-dependente row-orphan'
    
    const dias = calcularDiasRestantes(dataFim)
    if (dias === null) return baseClass
    if (dias < 0) return `${baseClass} row-expired`
    if (dias <= 60) return `${baseClass} row-warning`
    return baseClass
  }
  
  // Função para formatar data
  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }
  
  // Handler para mudança de filtro
  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }
  
  // Limpar filtros
  function handleClearFilters() {
    setFilters({
      searchTerm: '',
      searchField: 'todos',
      nacionalidade: '',
      nacionalidadeText: '',
      empresa: '',
      empresaText: '',
      tipoVinculo: '',
      status: '',
      tipoEvento: '',
      periodo: '',
      periodoAnterior: false,
      periodoPosterior: true,
      dataDe: '',
      dataAte: '',
    })
  }
  
  // Handler para tecla Enter
  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleSearch(1)
    }
  }
  
  // Toggle expandir detalhes
  function toggleExpand(id) {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }
  
  // Render detalhes expandidos do titular
  function renderTitularDetails(item) {
    return (
      <tr className="row-details" key={`details-${item.visibleId}`}>
        <td colSpan="9">
          <div className="details-content">
            <div className="details-grid">
              <div className="details-section">
                <h4>Dados Pessoais</h4>
                <p><strong>CPF:</strong> {item.cpf || '-'}</p>
                <p><strong>Passaporte:</strong> {item.passaporte || '-'}</p>
                <p><strong>Nacionalidade:</strong> {item.nacionalidade || '-'}</p>
                <p><strong>Data Nascimento:</strong> {formatDate(item.dataNascimento)}</p>
              </div>
              <div className="details-section">
                <h4>Contato</h4>
                <p><strong>Email:</strong> {item.email || '-'}</p>
                <p><strong>Telefone:</strong> {item.telefone || '-'}</p>
              </div>
              <div className="details-section">
                <h4>Filiação</h4>
                <p><strong>Pai:</strong> {item.pai || '-'}</p>
                <p><strong>Mãe:</strong> {item.mae || '-'}</p>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )
  }
  
  // Render detalhes expandidos do dependente
  function renderDependenteDetails(item) {
    return (
      <tr className="row-details" key={`details-${item.visibleId}`}>
        <td colSpan="9">
          <div className="details-content">
            <div className="details-grid">
              <div className="details-section">
                <h4>Dados Pessoais</h4>
                <p><strong>Passaporte:</strong> {item.passaporte || '-'}</p>
                <p><strong>Nacionalidade:</strong> {item.nacionalidade || '-'}</p>
                <p><strong>Data Nascimento:</strong> {formatDate(item.dataNascimento)}</p>
              </div>
              <div className="details-section">
                <h4>Filiação</h4>
                <p><strong>Pai:</strong> {item.pai || '-'}</p>
                <p><strong>Mãe:</strong> {item.mae || '-'}</p>
              </div>
              <div className="details-section">
                <h4>Titular</h4>
                <p><strong>Nome:</strong> {item.titularNome}</p>
                <Link to={`/titulares/${item.titularId}`} className="btn btn-sm btn-outline">
                  Ver Titular
                </Link>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )
  }
  
  // Renderizar paginação
  function renderPagination() {
    if (pagination.totalPages <= 1) return null
    
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return (
      <div className="pagination">
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => goToPage(1)}
          disabled={pagination.page === 1}
        >
          ⏮️
        </button>
        <button 
          className="btn btn-sm btn-outline"
          onClick={goToPreviousPage}
          disabled={!pagination.hasPrevious}
        >
          ◀️ Anterior
        </button>
        
        <div className="pagination-pages">
          {startPage > 1 && (
            <>
              <button className="btn btn-sm btn-outline" onClick={() => goToPage(1)}>1</button>
              {startPage > 2 && <span className="pagination-ellipsis">...</span>}
            </>
          )}
          
          {pages.map(page => (
            <button
              key={page}
              className={`btn btn-sm ${page === pagination.page ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          
          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="pagination-ellipsis">...</span>}
              <button className="btn btn-sm btn-outline" onClick={() => goToPage(pagination.totalPages)}>
                {pagination.totalPages}
              </button>
            </>
          )}
        </div>
        
        <button 
          className="btn btn-sm btn-outline"
          onClick={goToNextPage}
          disabled={!pagination.hasNext}
        >
          Próxima ▶️
        </button>
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => goToPage(pagination.totalPages)}
          disabled={pagination.page === pagination.totalPages}
        >
          ⏭️
        </button>
      </div>
    )
  }
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔍 Pesquisa Avançada</h1>
      </div>
      
      {/* Filtros */}
      <div className="card filter-card">
        {/* Busca Unificada */}
        <div className="search-unified">
          <div className="search-field-selector">
            <select
              name="searchField"
              className="form-select"
              value={filters.searchField}
              onChange={handleFilterChange}
              style={{ border: '0px solid transparent' }}
            >
              <option value="todos">Todos os Campos</option>
              <option value="nome">Nome</option>
              <option value="rnm">RNM</option>
              <option value="cpf">CPF</option>
              <option value="passaporte">Passaporte</option>
            </select>
          </div>
          <div className="search-input-wrapper">
            <input
              type="text"
              name="searchTerm"
              className="form-input search-input"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              placeholder="Buscar titulares e dependentes..."
              style={{ border: '0px solid transparent' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleSearch(1)}>
            🔍 Buscar
          </button>
        </div>
        
        {/* Filtros Adicionais */}
        <div className="filter-toggle">
          <details>
            <summary className="filter-summary">Filtros Avançados</summary>
            <div className="filter-grid">
              <div className="form-group">
                <label className="form-label">Nacionalidade</label>
                <input
                  type="text"
                  name="nacionalidadeText"
                  className="form-input"
                  value={filters.nacionalidadeText || ''}
                  onChange={(e) => {
                    const text = e.target.value
                    const nac = nacionalidades.find(n => n.nome.toLowerCase() === text.toLowerCase())
                    setFilters(prev => ({ 
                      ...prev, 
                      nacionalidadeText: text,
                      nacionalidade: nac ? nac.id : '' 
                    }))
                  }}
                  list="nacionalidades-list"
                  placeholder="Digite a nacionalidade..."
                />
                <datalist id="nacionalidades-list">
                  {nacionalidades.map(nac => (
                    <option key={nac.id} value={nac.nome} />
                  ))}
                </datalist>
              </div>
              
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <input
                  type="text"
                  name="empresaText"
                  className="form-input"
                  value={filters.empresaText || ''}
                  onChange={(e) => {
                    const text = e.target.value
                    const emp = empresas.find(e => e.nome.toLowerCase() === text.toLowerCase())
                    setFilters(prev => ({ 
                      ...prev, 
                      empresaText: text,
                      empresa: emp ? emp.id : '' 
                    }))
                  }}
                  list="empresas-list"
                  placeholder="Digite o nome da empresa..."
                />
                <datalist id="empresas-list">
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.nome} />
                  ))}
                </datalist>
              </div>
              
              <div className="form-group">
                <label className="form-label">Tipo Vínculo</label>
                <select
                  name="tipoVinculo"
                  className="form-select"
                  value={filters.tipoVinculo}
                  onChange={handleFilterChange}
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
                  value={filters.status}
                  onChange={handleFilterChange}
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
                  value={filters.tipoEvento}
                  onChange={handleFilterChange}
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
                  value={filters.periodo}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    periodo: e.target.value,
                    dataDe: e.target.value ? '' : prev.dataDe,
                    dataAte: e.target.value ? '' : prev.dataAte,
                  }))}
                  disabled={!filters.tipoEvento || filters.dataDe || filters.dataAte}
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
                      checked={filters.periodoPosterior}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        periodoPosterior: e.target.checked,
                        periodoAnterior: e.target.checked ? false : prev.periodoAnterior
                      }))}
                      disabled={!filters.tipoEvento || !filters.periodo}
                    />
                    Posterior (próximos dias)
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="periodoAnterior"
                      checked={filters.periodoAnterior}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        periodoAnterior: e.target.checked,
                        periodoPosterior: e.target.checked ? false : prev.periodoPosterior
                      }))}
                      disabled={!filters.tipoEvento || !filters.periodo}
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
                  value={filters.dataDe}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dataDe: e.target.value,
                    periodo: e.target.value ? '' : prev.periodo,
                  }))}
                  disabled={!filters.tipoEvento || filters.periodo}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Até</label>
                <input
                  type="date"
                  name="dataAte"
                  className="form-input"
                  value={filters.dataAte}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dataAte: e.target.value,
                    periodo: e.target.value ? '' : prev.periodo,
                  }))}
                  disabled={!filters.tipoEvento || filters.periodo}
                />
              </div>
            </div>
            
            <div className="filter-actions">
              <button className="btn btn-secondary" onClick={handleClearFilters}>
                Limpar Filtros
              </button>
              <button className="btn btn-primary" onClick={() => handleSearch(1)}>
                Aplicar Filtros
              </button>
            </div>
          </details>
        </div>
      </div>
      
      {/* Resultados */}
      <div className="card">
        <div className="results-header">
          <span className="results-count">
            <strong>{pagination.totalCount}</strong> titular(es) encontrado(s)
            {pagination.totalPages > 1 && (
              <span className="text-muted"> — Página {pagination.page} de {pagination.totalPages}</span>
            )}
          </span>
          <div className="results-options">
            <label className="form-label-inline">
              Itens por página:
              <select 
                className="form-select form-select-sm"
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                style={{ width: '80px', marginLeft: '0.5rem' }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-inline">Carregando...</div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum resultado encontrado.</p>
            <p>Tente ajustar os filtros de busca.</p>
          </div>
        ) : (
          <>
          <div className="table-container">
            <table className="pesquisa-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}></th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Vínculo/Relação</th>
                  <th>Amparo</th>
                  <th>RNM</th>
                  <th>Data Fim Vínculo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {results.map(item => (
                  <React.Fragment key={item.visibleId}>
                    <tr 
                      className={getRowClass(item.dataFimVinculo, item.type)}
                    >
                      <td>
                        <button 
                          className="btn-expand"
                          onClick={() => toggleExpand(item.visibleId)}
                        >
                          {expandedItems[item.visibleId] ? '▼' : '▶'}
                        </button>
                      </td>
                      <td>
                        <strong>{item.nome}</strong>
                      </td>
                      <td>
                        {item.type === 'titular' && (
                          <span className="tipo-badge tipo-titular">Titular</span>
                        )}
                        {(item.type === 'dependente' || item.type === 'dependente-orphan') && (
                          <span className="tipo-badge tipo-dependente">Dependente</span>
                        )}
                      </td>
                      <td>
                        {item.type === 'titular' && (
                          <>
                            {item.tipoVinculo !== 'Empresa' && (item.tipoVinculo || '-')}
                            {item.empresa && ` ${item.empresa}`}
                          </>
                        )}
                        {(item.type === 'dependente' || item.type === 'dependente-orphan') && (
                          <span className="text-small">
                            {item.tipoDependente || 'Dependente'} de {item.titularNome}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.type === 'titular' ? (item.amparo || '-') : (item.amparo || '-')}
                      </td>
                      <td>{item.rnm || '-'}</td>
                      <td>
                        {item.type === 'titular' && (
                          <>
                            {formatDate(item.dataFimVinculo)}
                            {(() => {
                              const dias = calcularDiasRestantes(item.dataFimVinculo)
                              if (dias !== null) {
                                let badgeClass = 'badge-success'
                                if (dias < 0) badgeClass = 'badge-danger'
                                else if (dias <= 30) badgeClass = 'badge-warning'
                                else if (dias <= 90) badgeClass = 'badge-info'
                                
                                return (
                                  <span className={`badge ${badgeClass}`} style={{ marginLeft: '0.5rem' }}>
                                    {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
                                  </span>
                                )
                              }
                              return null
                            })()}
                          </>
                        )}
                        {(item.type === 'dependente' || item.type === 'dependente-orphan') && (
                          <>
                            {formatDate(item.dataFimVinculo)}
                            {(() => {
                              const dias = calcularDiasRestantes(item.dataFimVinculo)
                              if (dias !== null) {
                                let badgeClass = 'badge-success'
                                if (dias < 0) badgeClass = 'badge-danger'
                                else if (dias <= 30) badgeClass = 'badge-warning'
                                else if (dias <= 90) badgeClass = 'badge-info'
                                
                                return (
                                  <span className={`badge ${badgeClass}`} style={{ marginLeft: '0.5rem' }}>
                                    {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
                                  </span>
                                )
                              }
                              return null
                            })()}
                          </>
                        )}
                      </td>
                      <td>
                        {item.type === 'titular' && (
                          <span className={`badge ${item.status ? 'badge-success' : item.status === false ? 'badge-danger' : 'badge-secondary'}`}>
                            {item.status ? 'Ativo' : item.status === false ? 'Inativo' : 'Sem Vínculo'}
                          </span>
                        )}
                        {(item.type === 'dependente' || item.type === 'dependente-orphan') && (
                          <span className="badge badge-success">Ativo</span>
                        )}
                      </td>
                      <td>
                        <div className="actions-buttons">
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => toggleExpand(item.visibleId)}
                          >
                            {expandedItems[item.visibleId] ? 'Ocultar' : 'Ver mais'}
                          </button>
                          <Link 
                            to={item.type === 'titular' ? `/titulares/${item.id}` : `/dependentes/${item.id}`} 
                            className="btn btn-sm btn-primary"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {expandedItems[item.visibleId] && (
                      item.type === 'titular' 
                        ? renderTitularDetails(item) 
                        : renderDependenteDetails(item)
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          {renderPagination()}
          </>
        )}
      </div>
      
      {/* Legenda */}
      <div className="results-legend">
        <span className="legend-item">
          <span className="legend-color legend-expired"></span>
          Vencido
        </span>
        <span className="legend-item">
          <span className="legend-color legend-warning"></span>
          Vence em até 60 dias
        </span>
        <span className="legend-item">
          <span className="tipo-badge tipo-titular">Titular</span>
        </span>
        <span className="legend-item">
          <span className="tipo-badge tipo-dependente">Dependente</span>
        </span>
      </div>
    </div>
  )
}

export default Pesquisa
