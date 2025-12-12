import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getEmpresas, deleteEmpresa } from '../services/empresas'
import { useDebounce } from '../hooks/useDebounce'
import usePagination from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import ResultsHeader from '../components/ResultsHeader'

function EmpresaList() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  
  // Debounce de 300ms para evitar requisições excessivas durante digitação
  const debouncedSearch = useDebounce(search, 300)
  
  // Hook de paginação reutilizável
  const {
    pagination,
    pageSizeOptions,
    setPage,
    setPageSize,
    updateFromResponse,
  } = usePagination({ initialPageSize: 20 })

  const loadEmpresas = useCallback(async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true)
      const params = { 
        page,
        page_size: pageSize,
      }
      if (debouncedSearch) params.search = debouncedSearch
      
      const response = await getEmpresas(params)
      const data = response.data
      
      setEmpresas(data.results || data)
      updateFromResponse(data, page, pageSize)
    } catch (err) {
      setError('Erro ao carregar empresas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, pagination.page, pagination.pageSize, updateFromResponse])

  useEffect(() => {
    loadEmpresas(1, pagination.pageSize)
  }, [debouncedSearch])

  async function handleDelete(id, nome) {
    if (!window.confirm(`Deseja realmente excluir a empresa "${nome}"?`)) {
      return
    }

    try {
      await deleteEmpresa(id)
      loadEmpresas(pagination.page, pagination.pageSize)
    } catch (err) {
      setError('Erro ao excluir empresa')
      console.error(err)
    }
  }

  // Navegação de páginas
  const goToPage = (page) => {
    setPage(page)
    loadEmpresas(page, pagination.pageSize)
  }

  // Mudar tamanho da página
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    loadEmpresas(1, newSize)
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
          <ResultsHeader
            totalCount={pagination.totalCount}
            itemLabel="empresa"
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
          />
          
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
                            ✏️
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
          
          <Pagination pagination={pagination} onPageChange={goToPage} />
        </div>
      )}
    </div>
  )
}

export default EmpresaList
