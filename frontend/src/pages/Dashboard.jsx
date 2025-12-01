import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getTitulares, getVinculos, importarTitulares } from '../services/titulares'
import { getEmpresas } from '../services/empresas'
import * as XLSX from 'xlsx'

function Dashboard() {
  const [stats, setStats] = useState({
    totalTitulares: 0,
    totalEmpresas: 0,
    empresasAtivas: 0,
    recentTitulares: [],
  })
  const [titularesExpirando, setTitularesExpirando] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)
  
  useEffect(() => {
    loadStats()
  }, [])
  
  function calcularDiasRestantes(dataFim) {
    if (!dataFim) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(0, 0, 0, 0)
    const diffTime = fim - hoje
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  function getNivelUrgencia(dias) {
    if (dias === null) return null
    if (dias <= 15) return { nivel: 'critico', label: 'Crítico', color: '#dc2626', bgColor: '#fef2f2' }
    if (dias <= 60) return { nivel: 'alto', label: 'Alto', color: '#ea580c', bgColor: '#fff7ed' }
    return { nivel: 'medio', label: 'Médio', color: '#ca8a04', bgColor: '#fefce8' }
  }
  
  async function loadStats() {
    try {
      const [titularesRes, empresasRes, vinculosRes] = await Promise.all([
        getTitulares(),
        getEmpresas(),
        getVinculos({ status: true })
      ])
      
      const titulares = titularesRes.data.results || titularesRes.data || []
      const empresas = empresasRes.data.results || empresasRes.data || []
      const vinculos = vinculosRes.data.results || vinculosRes.data || []
      
      // Processar vínculos expirando
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const vinculosComDias = vinculos
        .filter(v => v.data_fim_vinculo) // Só vínculos com data fim
        .map(v => {
          const dias = calcularDiasRestantes(v.data_fim_vinculo)
          const urgencia = getNivelUrgencia(dias)
          return {
            ...v,
            diasRestantes: dias,
            urgencia
          }
        })
        .filter(v => v.diasRestantes !== null && v.diasRestantes <= 90) // Próximos 90 dias
        .sort((a, b) => a.diasRestantes - b.diasRestantes) // Ordenar por dias restantes (menor primeiro)
      
      setTitularesExpirando(vinculosComDias)
      
      setStats({
        totalTitulares: titularesRes.data.count || titulares.length,
        totalEmpresas: empresasRes.data.count || empresas.length,
        empresasAtivas: empresas.filter(e => e.status).length,
        recentTitulares: titulares.slice(0, 5),
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }
  
  async function handleExportExcel() {
    try {
      // Buscar todos os dados
      const [titularesRes, vinculosRes] = await Promise.all([
        getTitulares({ page_size: 10000 }),
        getVinculos({ page_size: 10000 }),
      ])
      
      const titulares = titularesRes.data.results || titularesRes.data || []
      const vinculos = vinculosRes.data.results || vinculosRes.data || []
      
      // Criar mapa de titulares por ID
      const titularesMap = {}
      titulares.forEach(t => {
        titularesMap[t.id] = t
      })
      
      // Preparar dados - uma linha por vínculo
      const exportData = vinculos.map(v => {
        const titular = titularesMap[v.titular] || {}
        return {
          'Nome': titular.nome || v.titular_nome || '',
          'Nacionalidade': titular.nacionalidade_nome || '',
          'Nascimento': titular.data_nascimento || '',
          'Mãe': titular.mae || '',
          'Pai': titular.pai || '',
          'RNM': titular.rnm || '',
          'Amparo': v.amparo_nome || '',
          'Prazo': v.data_fim_vinculo || '',
          'Status': v.status ? 'Ativo' : 'Inativo',
        }
      })
      
      // Adicionar titulares sem vínculo
      const titularesComVinculo = new Set(vinculos.map(v => v.titular))
      titulares.forEach(t => {
        if (!titularesComVinculo.has(t.id)) {
          exportData.push({
            'Nome': t.nome,
            'Nacionalidade': t.nacionalidade_nome || '',
            'Nascimento': t.data_nascimento || '',
            'Mãe': t.mae || '',
            'Pai': t.pai || '',
            'RNM': t.rnm || '',
            'Amparo': '',
            'Prazo': '',
            'Status': 'Sem Vínculo',
          })
        }
      })
      
      // Criar workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      XLSX.utils.book_append_sheet(wb, ws, 'Titulares')
      
      // Gerar arquivo e fazer download
      const hoje = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `atlas_dados_${hoje}.xlsx`)
      
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      alert('Erro ao exportar dados. Tente novamente.')
    }
  }
  
  function handleImportClick() {
    fileInputRef.current?.click()
  }
  
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImporting(true)
    try {
      const response = await importarTitulares(file)
      const { titulares_criados, titulares_atualizados, erros } = response.data
      
      let message = `Importação concluída!\n\nCriados: ${titulares_criados}\nAtualizados: ${titulares_atualizados}`
      if (erros && erros.length > 0) {
        message += `\n\nErros:\n${erros.join('\n')}`
      }
      
      alert(message)
      loadStats() // Recarregar dados
    } catch (error) {
      console.error('Erro ao importar:', error)
      alert('Erro ao importar arquivo. Verifique o formato e tente novamente.')
    } finally {
      setImporting(false)
      e.target.value = '' // Limpar input para permitir reimportar mesmo arquivo
    }
  }
  
  if (loading) {
    return <div className="loading">Carregando...</div>
  }
  
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
          />
          <button 
            onClick={handleImportClick} 
            className="btn btn-secondary"
            disabled={importing}
          >
            {importing ? '⏳ Importando...' : '📤 Importar'}
          </button>
          <button onClick={handleExportExcel} className="btn btn-primary">
            📥 Exportar
          </button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalTitulares}</div>
          <div className="stat-label">Total de Titulares</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalEmpresas}</div>
          <div className="stat-label">Total de Empresas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.empresasAtivas}</div>
          <div className="stat-label">Empresas Ativas</div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🚨 Vínculos Expirando</h2>
        </div>
        
        {titularesExpirando.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum vínculo expirando nos próximos 90 dias.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Urgência</th>
                  <th>Titular</th>
                  <th>Empresa</th>
                  <th>Vencimento</th>
                  <th>Dias Restantes</th>
                </tr>
              </thead>
              <tbody>
                {titularesExpirando.map(vinculo => (
                  <tr key={vinculo.id} style={{ backgroundColor: vinculo.urgencia?.bgColor }}>
                    <td>
                      <span className={`badge`} style={{
                        color: '#fff',
                        backgroundColor: vinculo.urgencia?.color
                      }}>
                        {vinculo.urgencia?.label}
                      </span>
                    </td>
                    <td>
                      <strong>
                        <Link to={`/titulares/${vinculo.titular}`}>
                          {vinculo.titular_nome || 'Titular'}
                        </Link>
                      </strong>
                    </td>
                    <td>{vinculo.empresa_nome || '-'}</td>
                    <td>{formatDate(vinculo.data_fim_vinculo)}</td>
                    <td>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: vinculo.urgencia?.color 
                      }}>
                        {vinculo.diasRestantes <= 0 
                          ? `Vencido há ${Math.abs(vinculo.diasRestantes)} dia(s)` 
                          : `${vinculo.diasRestantes} dia(s)`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📋 Titulares Recentes</h2>
          <Link to="/titulares" className="btn btn-outline">Ver todos</Link>
        </div>
        
        {stats.recentTitulares.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum titular cadastrado ainda.</p>
            <Link to="/titulares/new" className="btn btn-primary">Cadastre o primeiro!</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>RNM</th>
                  <th>Nacionalidade</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTitulares.map(titular => (
                  <tr key={titular.id}>
                    <td>
                      <strong>
                        <Link to={`/titulares/${titular.id}`}>{titular.nome}</Link>
                      </strong>
                    </td>
                    <td>{titular.rnm || '-'}</td>
                    <td>{titular.nacionalidade_nome || '-'}</td>
                    <td>{titular.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
