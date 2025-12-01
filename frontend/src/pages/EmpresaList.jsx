import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEmpresas, deleteEmpresa } from '../services/empresas'

function EmpresaList() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadEmpresas()
  }, [search])

  async function loadEmpresas() {
    try {
      setLoading(true)
      const params = search ? { search } : {}
      const response = await getEmpresas(params)
      setEmpresas(response.data.results || response.data)
    } catch (err) {
      setError('Erro ao carregar empresas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, nome) {
    if (!window.confirm(`Deseja realmente excluir a empresa "${nome}"?`)) {
      return
    }

    try {
      await deleteEmpresa(id)
      loadEmpresas()
    } catch (err) {
      setError('Erro ao excluir empresa')
      console.error(err)
    }
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
        </div>
      )}
    </div>
  )
}

export default EmpresaList
