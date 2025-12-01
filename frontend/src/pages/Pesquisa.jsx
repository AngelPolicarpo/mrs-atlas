import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getTitulares, getVinculos, getDependentes } from '../services/titulares'
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
  
  // Função de busca unificada
  const handleSearch = useCallback(async () => {
    setLoading(true)
    
    try {
      const params = { page_size: 1000 }
      
      // Adicionar filtro de busca
      if (filters.searchTerm) {
        params.search = filters.searchTerm
      }
      
      // Filtros de titular
      if (filters.nacionalidade) params.nacionalidade = filters.nacionalidade
      if (filters.empresa) params.empresa = filters.empresa
      if (filters.tipoVinculo) params.tipo_vinculo = filters.tipoVinculo
      if (filters.status) params.vinculo_status = filters.status === 'ativo'
      
      // Filtros de prazo/período
      if (filters.tipoEvento && filters.periodo) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        let diasOffset = 0
        
        // Calcular offset em dias
        switch (filters.periodo) {
          case '15': diasOffset = 15; break
          case '30': diasOffset = 30; break
          case '60': diasOffset = 60; break
          case '90': diasOffset = 90; break
          case '120': diasOffset = 120; break
          case '180': diasOffset = 180; break
          case '365': diasOffset = 365; break
          default: diasOffset = 0
        }
        
        const dataLimite = new Date(hoje)
        if (filters.periodoPosterior) {
          dataLimite.setDate(dataLimite.getDate() + diasOffset)
        } else {
          dataLimite.setDate(dataLimite.getDate() - diasOffset)
        }
        
        const hojeStr = hoje.toISOString().split('T')[0]
        const dataLimiteStr = dataLimite.toISOString().split('T')[0]
        
        // Aplicar filtro baseado no tipo de evento
        if (filters.tipoEvento === 'vencimento') {
          if (filters.periodoPosterior) {
            params.data_fim_vinculo_gte = hojeStr
            params.data_fim_vinculo_lte = dataLimiteStr
          } else {
            params.data_fim_vinculo_gte = dataLimiteStr
            params.data_fim_vinculo_lte = hojeStr
          }
        } else if (filters.tipoEvento === 'entrada') {
          if (filters.periodoPosterior) {
            params.data_entrada_gte = hojeStr
            params.data_entrada_lte = dataLimiteStr
          } else {
            params.data_entrada_gte = dataLimiteStr
            params.data_entrada_lte = hojeStr
          }
        } else if (filters.tipoEvento === 'atualizacao') {
          if (filters.periodoPosterior) {
            params.ultima_atualizacao_gte = hojeStr
            params.ultima_atualizacao_lte = dataLimiteStr
          } else {
            params.ultima_atualizacao_gte = dataLimiteStr
            params.ultima_atualizacao_lte = hojeStr
          }
        }
      } else if (filters.tipoEvento && (filters.dataDe || filters.dataAte)) {
        // Filtro por De - Até (quando Período não está selecionado)
        if (filters.tipoEvento === 'vencimento') {
          if (filters.dataDe) params.data_fim_vinculo_gte = filters.dataDe
          if (filters.dataAte) params.data_fim_vinculo_lte = filters.dataAte
        } else if (filters.tipoEvento === 'entrada') {
          if (filters.dataDe) params.data_entrada_gte = filters.dataDe
          if (filters.dataAte) params.data_entrada_lte = filters.dataAte
        } else if (filters.tipoEvento === 'atualizacao') {
          if (filters.dataDe) params.ultima_atualizacao_gte = filters.dataDe
          if (filters.dataAte) params.ultima_atualizacao_lte = filters.dataAte
        }
      }
      
      // Buscar titulares
      const titularesRes = await getTitulares(params)
      const titulares = titularesRes.data.results || titularesRes.data || []
      
      // Buscar dependentes (com filtro de busca se houver)
      const dependentesParams = { page_size: 1000 }
      if (filters.searchTerm) {
        dependentesParams.search = filters.searchTerm
      }
      if (filters.nacionalidade) {
        dependentesParams.nacionalidade = filters.nacionalidade
      }
      
      const dependentesRes = await getDependentes(dependentesParams)
      const todosDependentes = dependentesRes.data.results || dependentesRes.data || []
      
      // Criar mapa de dependentes por titular_id
      const dependentesPorTitular = {}
      todosDependentes.forEach(dep => {
        const tid = dep.titular // ID do titular
        if (!dependentesPorTitular[tid]) {
          dependentesPorTitular[tid] = []
        }
        dependentesPorTitular[tid].push(dep)
      })
      
      // Montar resultado final: uma linha para cada vínculo do titular
      // Dependentes aparecem após o último vínculo do titular
      const finalResults = []
      
      // Função para verificar se um vínculo está dentro do filtro de data
      const vinculoDentroDoFiltro = (vinculo) => {
        // Se não há filtro de evento, mostrar todos
        if (!filters.tipoEvento) return true
        
        let dataParaFiltrar = null
        if (filters.tipoEvento === 'vencimento') {
          dataParaFiltrar = vinculo.data_fim_vinculo
        } else if (filters.tipoEvento === 'entrada') {
          dataParaFiltrar = vinculo.data_entrada_pais
        } else if (filters.tipoEvento === 'atualizacao') {
          dataParaFiltrar = vinculo.ultima_atualizacao
        }
        
        if (!dataParaFiltrar) return true // Se não tem a data, mostrar
        
        // Se está usando Período
        if (filters.periodo) {
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)
          let diasOffset = parseInt(filters.periodo) || 0
          
          const dataLimite = new Date(hoje)
          if (filters.periodoPosterior) {
            dataLimite.setDate(dataLimite.getDate() + diasOffset)
          } else {
            dataLimite.setDate(dataLimite.getDate() - diasOffset)
          }
          
          const dataVinculo = new Date(dataParaFiltrar)
          dataVinculo.setHours(0, 0, 0, 0)
          
          if (filters.periodoPosterior) {
            return dataVinculo >= hoje && dataVinculo <= dataLimite
          } else {
            return dataVinculo >= dataLimite && dataVinculo <= hoje
          }
        }
        
        // Se está usando De - Até
        if (filters.dataDe || filters.dataAte) {
          const dataVinculo = new Date(dataParaFiltrar)
          dataVinculo.setHours(0, 0, 0, 0)
          
          if (filters.dataDe) {
            const dataDe = new Date(filters.dataDe)
            dataDe.setHours(0, 0, 0, 0)
            if (dataVinculo < dataDe) return false
          }
          
          if (filters.dataAte) {
            const dataAte = new Date(filters.dataAte)
            dataAte.setHours(0, 0, 0, 0)
            if (dataVinculo > dataAte) return false
          }
          
          return true
        }
        
        return true
      }
      
      titulares.forEach(titular => {
        const todosVinculos = titular.vinculos || []
        // Filtrar vínculos que estão dentro do filtro de data
        const vinculos = todosVinculos.filter(vinculoDentroDoFiltro)
        const depsDesseTitular = dependentesPorTitular[titular.id] || []
        
        if (vinculos.length === 0) {
          // Titular sem vínculo - mostrar uma linha só
          finalResults.push({
            type: 'titular',
            id: titular.id,
            visibleId: `titular-${titular.id}-0`,
            nome: titular.nome,
            rnm: titular.rnm,
            cpf: titular.cpf,
            passaporte: titular.passaporte,
            nacionalidade: titular.nacionalidade_nome,
            tipoVinculo: null,
            empresa: null,
            amparo: null,
            dataFimVinculo: null,
            status: null,
            vinculoId: null,
            email: titular.email,
            telefone: titular.telefone,
            pai: titular.pai,
            mae: titular.mae,
            dataNascimento: titular.data_nascimento,
            isLastVinculo: true,
          })
          
          // Adicionar dependentes após titular sem vínculo
          depsDesseTitular.forEach(dep => {
            finalResults.push({
              type: 'dependente',
              id: dep.id,
              visibleId: `dependente-${dep.id}`,
              titularId: dep.titular,
              titularNome: dep.titular_nome,
              nome: dep.nome,
              rnm: dep.rnm,
              passaporte: dep.passaporte,
              nacionalidade: dep.nacionalidade_nome,
              tipoDependente: dep.tipo_dependente_display,
              dataNascimento: dep.data_nascimento,
              pai: dep.pai,
              mae: dep.mae,
            })
          })
        } else {
          // Titular com vínculos - uma linha para cada vínculo
          vinculos.forEach((vinculo, idx) => {
            const isLastVinculo = idx === vinculos.length - 1
            
            finalResults.push({
              type: 'titular',
              id: titular.id,
              visibleId: `titular-${titular.id}-${vinculo.id}`,
              nome: titular.nome,
              rnm: titular.rnm,
              cpf: titular.cpf,
              passaporte: titular.passaporte,
              nacionalidade: titular.nacionalidade_nome,
              tipoVinculo: vinculo.tipo_vinculo_display,
              empresa: vinculo.empresa_nome,
              amparo: vinculo.amparo_nome,
              dataFimVinculo: vinculo.data_fim_vinculo,
              status: vinculo.status,
              vinculoId: vinculo.id,
              email: titular.email,
              telefone: titular.telefone,
              pai: titular.pai,
              mae: titular.mae,
              dataNascimento: titular.data_nascimento,
              isLastVinculo,
            })
            
            // Adicionar dependentes após o último vínculo
            if (isLastVinculo) {
              depsDesseTitular.forEach(dep => {
                finalResults.push({
                  type: 'dependente',
                  id: dep.id,
                  visibleId: `dependente-${dep.id}`,
                  titularId: dep.titular,
                  titularNome: dep.titular_nome,
                  nome: dep.nome,
                  rnm: dep.rnm,
                  passaporte: dep.passaporte,
                  nacionalidade: dep.nacionalidade_nome,
                  tipoDependente: dep.tipo_dependente_display,
                  dataNascimento: dep.data_nascimento,
                  pai: dep.pai,
                  mae: dep.mae,
                })
              })
            }
          })
        }
      })
      
      // Se há termo de busca, adicionar dependentes órfãos (cujo titular não apareceu)
      if (filters.searchTerm) {
        const titularIdsNoResultado = new Set(titulares.map(t => t.id))
        todosDependentes.forEach(dep => {
          // Se o titular deste dependente não está nos resultados, adicionar como órfão
          if (!titularIdsNoResultado.has(dep.titular)) {
            finalResults.push({
              type: 'dependente-orphan',
              id: dep.id,
              visibleId: `dependente-orphan-${dep.id}`,
              titularId: dep.titular,
              titularNome: dep.titular_nome,
              nome: dep.nome,
              rnm: dep.rnm,
              passaporte: dep.passaporte,
              nacionalidade: dep.nacionalidade_nome,
              tipoDependente: dep.tipo_dependente_display,
              dataNascimento: dep.data_nascimento,
              pai: dep.pai,
              mae: dep.mae,
            })
          }
        })
      }
      
      setResults(finalResults)
      
    } catch (error) {
      console.error('Erro na busca:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [filters])
  
  // Buscar ao carregar
  useEffect(() => {
    handleSearch()
  }, [])
  
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
      handleSearch()
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
      <tr className="row-details">
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
      <tr className="row-details">
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
          <button className="btn btn-primary" onClick={handleSearch}>
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
              <button className="btn btn-primary" onClick={handleSearch}>
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
            {results.length} resultado(s) encontrado(s)
          </span>
        </div>
        
        {loading ? (
          <div className="loading-inline">Carregando...</div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum resultado encontrado.</p>
            <p>Tente ajustar os filtros de busca.</p>
          </div>
        ) : (
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
                  <>
                    <tr 
                      key={item.visibleId} 
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
                            {item.tipoVinculo || '-'}
                            {item.empresa && ` - ${item.empresa}`}
                          </>
                        )}
                        {(item.type === 'dependente' || item.type === 'dependente-orphan') && (
                          <span className="text-small">
                            {item.tipoDependente || 'Dependente'} de {item.titularNome}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.type === 'titular' ? (item.amparo || '-') : '-'}
                      </td>
                      <td>{item.rnm || '-'}</td>
                      <td>
                        {item.type === 'titular' && (
                          <>
                            {formatDate(item.dataFimVinculo)}
                            {(() => {
                              const dias = calcularDiasRestantes(item.dataFimVinculo)
                              if (dias !== null && dias <= 60) {
                                return (
                                  <span className={`badge ${dias < 0 ? 'badge-danger' : 'badge-warning'}`} style={{ marginLeft: '0.5rem' }}>
                                    {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
                                  </span>
                                )
                              }
                              return null
                            })()}
                          </>
                        )}
                        {(item.type === 'dependente' || item.type === 'dependente-orphan') && '-'}
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
                  </>
                ))}
              </tbody>
            </table>
          </div>
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
