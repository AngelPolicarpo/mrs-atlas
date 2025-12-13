import { Link, useSearchParams } from 'react-router-dom'
import useDependenteList from '../hooks/useDependenteList'
import { formatDate } from '../utils/uiHelpers'
import Pagination from '../components/Pagination'
import ResultsHeader from '../components/ResultsHeader'
import { usePermissions } from '../context/PermissionContext'
import { ModelPermissionGuard } from '../components/PermissionGuard'

function DependenteList() {
  const [searchParams] = useSearchParams()
  const titularIdFromUrl = searchParams.get('titular')
  const {
    dependentes,
    titulares,
    loading,
    search,
    titularFilter,
    error,
    setSearch,
    setTitularFilter,
    handleDelete,
    // Paginação
    pagination,
    pageSizeOptions,
    goToPage,
    handlePageSizeChange,
  } = useDependenteList(titularIdFromUrl)

  const { canEditModel } = usePermissions()

  return (
    <div className="page">
      <div className="page-header">
        <h1>👨‍👧 Dependentes</h1>
        <ModelPermissionGuard app="titulares" model="dependente" action="add">
          <Link to="/dependentes/new" className="btn btn-primary">
            + Novo Dependente
          </Link>
        </ModelPermissionGuard>
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
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="card">
          <ResultsHeader
            totalCount={pagination.totalCount}
            itemLabel="dependente"
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
          />
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Titular</th>
                  <th>RNM</th>
                  <th>Data Nascimento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {dependentes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Nenhum dependente encontrado
                    </td>
                  </tr>
                ) : (
                  dependentes.map((dep) => (
                    <tr key={dep.id}>
                      <td><strong>{dep.nome}</strong></td>
                      <td>{dep.titular_nome || '-'}</td>
                      <td>{dep.rnm || '-'}</td>
                      <td>{formatDate(dep.data_nascimento)}</td>
                      <td>
                        <div className="btn-group">
                          {canEditModel('titulares', 'dependente') ? (
                            <Link
                              to={`/dependentes/${dep.id}`}
                              className="btn btn-sm btn-outline"
                              title="Editar"
                            >
                              ✏️
                            </Link>
                          ) : (
                            <Link
                              to={`/dependentes/${dep.id}`}
                              className="btn btn-sm btn-outline"
                              title="Visualizar"
                            >
                              👁️
                            </Link>
                          )}
                          <ModelPermissionGuard app="titulares" model="dependente" action="delete">
                            <button
                              onClick={() => handleDelete(dep.id, dep.nome)}
                              className="btn btn-sm btn-danger"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </ModelPermissionGuard>
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

export default DependenteList
