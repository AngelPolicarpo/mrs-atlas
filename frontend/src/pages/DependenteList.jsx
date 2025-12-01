import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getDependentes, deleteDependente } from '../services/titulares'
import { getTitulares } from '../services/titulares'

function DependenteList() {
  const [searchParams] = useSearchParams()
  const titularIdFromUrl = searchParams.get('titular')
  
  const [dependentes, setDependentes] = useState([])
  const [titulares, setTitulares] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [titularFilter, setTitularFilter] = useState(titularIdFromUrl || '')
  const [error, setError] = useState('')

  useEffect(() => {
    loadTitulares()
  }, [])

  useEffect(() => {
    loadDependentes()
  }, [search, titularFilter])

  async function loadTitulares() {
    try {
      const response = await getTitulares()
      setTitulares(response.data.results || response.data)
    } catch (err) {
      console.error('Erro ao carregar titulares:', err)
    }
  }

  async function loadDependentes() {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (titularFilter) params.titular = titularFilter
      const response = await getDependentes(params)
      setDependentes(response.data.results || response.data)
    } catch (err) {
      setError('Erro ao carregar dependentes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, nome) {
    if (!window.confirm(`Deseja realmente excluir o dependente "${nome}"?`)) {
      return
    }

    try {
      await deleteDependente(id)
      loadDependentes()
    } catch (err) {
      setError('Erro ao excluir dependente')
      console.error(err)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>👨‍👧 Dependentes</h1>
        <Link to="/dependentes/new" className="btn btn-primary">
          + Novo Dependente
        </Link>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Buscar por nome, passaporte, RNM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        />
        <select
          value={titularFilter}
          onChange={(e) => setTitularFilter(e.target.value)}
          className="form-select"
          style={{ width: '300px' }}
        >
          <option value="">Todos os titulares</option>
          {titulares.map(t => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
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
                  <th>Titular</th>
                  <th>Tipo</th>
                  <th>Nacionalidade</th>
                  <th>RNM</th>
                  <th>Data Nascimento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {dependentes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Nenhum dependente encontrado
                    </td>
                  </tr>
                ) : (
                  dependentes.map((dep) => (
                    <tr key={dep.id}>
                      <td><strong>{dep.nome}</strong></td>
                      <td>{dep.titular_nome || '-'}</td>
                      <td>
                        <span className="badge badge-info">{dep.tipo_dependente_display || '-'}</span>
                      </td>
                      <td>{dep.nacionalidade_nome || '-'}</td>
                      <td>{dep.rnm || '-'}</td>
                      <td>{formatDate(dep.data_nascimento)}</td>
                      <td>
                        <div className="btn-group">
                          <Link
                            to={`/dependentes/${dep.id}`}
                            className="btn btn-sm btn-outline"
                          >
                            ✏️ Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(dep.id, dep.nome)}
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

export default DependenteList
