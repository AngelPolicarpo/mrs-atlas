import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getTitulares, importarTitulares } from '../services/titulares'
import { getEmpresas } from '../services/empresas'
import { formatLocalDate } from '../utils/dateUtils'
import * as XLSX from 'xlsx'

function Dashboard() {
  const [stats, setStats] = useState({
    totalTitulares: 0,
    totalEmpresas: 0,
    empresasAtivas: 0,
    recentTitulares: [],
  })
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)
  
  useEffect(() => {
    loadStats()
  }, [])
  
  async function loadStats() {
    try {
      const [titularesRes, empresasTotalRes, empresasAtivasRes] = await Promise.all([
        getTitulares({ ordering: '-ultima_atualizacao', page_size: 5 }), // Ordenar por última atualização
        getEmpresas({ page_size: 1 }),  // Só para pegar o count total
        getEmpresas({ status: true, page_size: 1 }),  // Só para pegar o count de ativas
      ])
      
      const titulares = titularesRes.data.results || titularesRes.data || []
      
      setStats({
        totalTitulares: titularesRes.data.count || titulares.length,
        totalEmpresas: empresasTotalRes.data.count || 0,
        empresasAtivas: empresasAtivasRes.data.count || 0,
        recentTitulares: titulares,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }
  
  async function handleExportExcel() {
    try {
      // Buscar todos os dados
      const [titularesRes, vinculosRes] = await Promise.all([
        getTitulares({ page_size: 10000 }),
        getVinculosTitular({ page_size: 10000 }),
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
          'Nacionalidade': titular.nacionalidade || '',
          'Nascimento': titular.data_nascimento || '',
          'Filiação 1': titular.filiacao_um || '',
          'Filiação 2': titular.filiacao_dois || '',
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
            'Nacionalidade': t.nacionalidade || '',
            'Nascimento': t.data_nascimento || '',
            'Filiação 1': t.filiacao_um || '',
            'Filiação 2': t.filiacao_dois || '',
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
      const hoje = formatLocalDate()
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
                  <th>Última Atualização</th>
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
                    <td>{titular.nacionalidade || '-'}</td>
                    <td>{formatDate(titular.ultima_atualizacao)}</td>
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
