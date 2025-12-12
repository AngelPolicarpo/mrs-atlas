import { Link } from 'react-router-dom'
import useTitularList from '../hooks/useTitularList'
import Pagination from '../components/Pagination'
import ResultsHeader from '../components/ResultsHeader'

function TitularList() {
  const {
    titulares,
    loading,
    search,
    setSearch,
    error,
    handleDelete,
    // Paginação
    pagination,
    pageSizeOptions,
    goToPage,
    handlePageSizeChange,
  } = useTitularList()
  
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
          <ResultsHeader
            totalCount={pagination.totalCount}
            itemLabel="titular"
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
          />
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>RNM</th>
                  <th>Vínculos</th>
                  <th>Dependentes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {titulares.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Nenhum titular encontrado
                    </td>
                  </tr>
                ) : (
                  titulares.map((titular) => (
                    <tr key={titular.id}>
                      <td><strong>{titular.nome}</strong></td>
                      <td>{titular.rnm || '-'}</td>
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
                            ✏️
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
          
          <Pagination pagination={pagination} onPageChange={goToPage} />
        </div>
      )}
    </div>
  )
}

export default TitularList
