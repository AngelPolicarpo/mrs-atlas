import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getEmpresas, deleteEmpresa } from '../services/empresas'

function EmpresaList() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  
  // Estados de paginação
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  })

  const loadEmpresas = useCallback(async (page = 1, customPageSize = null) => {
    try {
      setLoading(true)
      const params = { 
        page,
        page_size: customPageSize || pagination.pageSize,
      }
      if (search) params.search = search
      
      const response = await getEmpresas(params)
      const data = response.data
      
      setEmpresas(data.results || data)
      setPagination(prev => ({
        ...prev,
        page: page,
        pageSize: customPageSize || prev.pageSize,
        totalPages: Math.ceil((data.count || 0) / (customPageSize || prev.pageSize)),
        totalCount: data.count || 0,
        hasNext: !!data.next,
        hasPrevious: !!data.previous,
      }))
    } catch (err) {
      setError('Erro ao carregar empresas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, pagination.pageSize])

  useEffect(() => {
    loadEmpresas(1)
  }, [search])

  async function handleDelete(id, nome) {
    if (!window.confirm(`Deseja realmente excluir a empresa "${nome}"?`)) {
      return
    }

    try {
      await deleteEmpresa(id)
      loadEmpresas(pagination.page)
    } catch (err) {
      setError('Erro ao excluir empresa')
      console.error(err)
    }
  }

  // Navegação de páginas
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadEmpresas(page)
    }
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
      <div className="pagination" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => goToPage(1)}
          disabled={pagination.page === 1}
        >
          ⏮️
        </button>
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => goToPage(pagination.page - 1)}
          disabled={!pagination.hasPrevious}
        >
          ◀️
        </button>
        
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {startPage > 1 && (
            <>
              <button className="btn btn-sm btn-outline" onClick={() => goToPage(1)}>1</button>
              {startPage > 2 && <span style={{ padding: '0 0.5rem' }}>...</span>}
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
              {endPage < pagination.totalPages - 1 && <span style={{ padding: '0 0.5rem' }}>...</span>}
              <button className="btn btn-sm btn-outline" onClick={() => goToPage(pagination.totalPages)}>
                {pagination.totalPages}
              </button>
            </>
          )}
        </div>
        
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => goToPage(pagination.page + 1)}
          disabled={!pagination.hasNext}
        >
          ▶️
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
    <div className="page">
      <div className="page-header">
        <h1>🏢 Empresas</h1>
        <Link to="/empresas/new" className="btn btn-primary">
          + Nova Empresa
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span><strong>{pagination.totalCount}</strong> empresa(s) encontrada(s)</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Empresas por página:
              <select 
                className="form-select"
                value={pagination.pageSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value)
                  loadEmpresas(1, newSize)
                }}
                style={{ width: '80px' }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresas.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      Nenhuma empresa encontrada
                    </td>
                  </tr>
                ) : (
                  empresas.map((empresa) => (
                    <tr key={empresa.id}>
                      <td><strong>{empresa.nome}</strong></td>
                      <td>{empresa.cnpj || '-'}</td>
                      <td>
                        <span className={`badge ${empresa.status ? 'badge-success' : 'badge-danger'}`}>
                          {empresa.status ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <Link
                            to={`/empresas/${empresa.id}`}
                            className="btn btn-sm btn-outline"
                          >
                            ✏️ Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(empresa.id, empresa.nome)}
                            className="btn btn-sm btn-danger"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {renderPagination()}
        </div>
      )}
    </div>
  )
}

export default EmpresaList
