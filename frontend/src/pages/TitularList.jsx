import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTitulares, deleteTitular } from '../services/titulares'

function TitularList() {
  const [titulares, setTitulares] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadTitulares()
  }, [search])

  async function loadTitulares() {
    try {
      setLoading(true)
      const params = search ? { search } : {}
      const response = await getTitulares(params)
      setTitulares(response.data.results || response.data)
    } catch (err) {
      setError('Erro ao carregar titulares')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, nome) {
    if (!window.confirm(`Deseja realmente excluir o titular "${nome}"?`)) {
      return
    }

    try {
      await deleteTitular(id)
      loadTitulares()
    } catch (err) {
      setError('Erro ao excluir titular')
      console.error(err)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 Titulares</h1>
        <Link to="/titulares/new" className="btn btn-primary">
          + Novo Titular
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nome, RNM, CPF..."
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
                  <th>RNM</th>
                  <th>CPF</th>
                  <th>Nacionalidade</th>
                  <th>Email</th>
                  <th>Vínculos</th>
                  <th>Dependentes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {titulares.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      Nenhum titular encontrado
                    </td>
                  </tr>
                ) : (
                  titulares.map((titular) => (
                    <tr key={titular.id}>
                      <td><strong>{titular.nome}</strong></td>
                      <td>{titular.rnm || '-'}</td>
                      <td>{titular.cpf || '-'}</td>
                      <td>{titular.nacionalidade_nome || '-'}</td>
                      <td>{titular.email || '-'}</td>
                      <td>
                        <span className="badge badge-info">{titular.vinculos_count || 0}</span>
                      </td>
                      <td>
                        <Link to={`/dependentes?titular=${titular.id}`}>
                          <span className="badge badge-secondary">{titular.dependentes_count || 0}</span>
                        </Link>
                      </td>
                      <td>
                        <div className="btn-group">
                          <Link
                            to={`/titulares/${titular.id}`}
                            className="btn btn-sm btn-outline"
                            title="Editar"
                          >
                            ✏️ Editar
                          </Link>
                          <Link
                            to={`/dependentes/new?titular=${titular.id}`}
                            className="btn btn-sm btn-secondary"
                            title="Adicionar Dependente"
                          >
                            👨‍👧
                          </Link>
                          <button
                            onClick={() => handleDelete(titular.id, titular.nome)}
                            className="btn btn-sm btn-danger"
                            title="Excluir"
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

export default TitularList
