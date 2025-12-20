import { Link } from 'react-router-dom'
import useContratoList from '../hooks/useContratoList'
import Pagination from '../components/Pagination'
import ResultsHeader from '../components/ResultsHeader'
import { usePermissions } from '../context/PermissionContext'
import { ModelPermissionGuard } from '../components/PermissionGuard'

/**
 * Formata valor em reais
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Badge de status com cores
 */
function StatusBadge({ status, statusDisplay }) {
  const statusColors = {
    RASCUNHO: 'badge-secondary',
    ATIVO: 'badge-success',
    SUSPENSO: 'badge-warning',
    ENCERRADO: 'badge-info',
    CANCELADO: 'badge-danger',
  }
  
  return (
    <span className={`badge ${statusColors[status] || 'badge-secondary'}`}>
      {statusDisplay}
    </span>
  )
}

function ContratoList() {
  const {
    contratos,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusOptions,
    error,
    handleDelete,
    pagination,
    pageSizeOptions,
    goToPage,
    handlePageSizeChange,
  } = useContratoList()
  
  const { canEditModel, canDeleteModel } = usePermissions()
  
  return (
    <div className="page">
      <div className="page-header">
        <h1>📝 Contratos</h1>
        <ModelPermissionGuard app="contratos" model="contrato" action="add">
          <Link to="/contratos/new" className="btn btn-primary">
            + Novo Contrato
          </Link>
        </ModelPermissionGuard>
      </div>

      <div className="search-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por número, empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: '1', minWidth: '200px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ minWidth: '150px' }}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      
      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="card">
          <ResultsHeader
            totalCount={pagination.totalCount}
            itemLabel="contrato"
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
          />
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Empresa Contratante</th>
                  <th>Status</th>
                  <th>Vigência</th>
                  <th>Serviços</th>
                  <th>OS</th>
                  <th>Valor Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {contratos.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Nenhum contrato encontrado
                    </td>
                  </tr>
                ) : (
                  contratos.map((contrato) => (
                    <tr key={contrato.id}>
                      <td><strong>{contrato.numero}</strong></td>
                      <td>{contrato.empresa_contratante_nome || '-'}</td>
                      <td>
                        <StatusBadge status={contrato.status} statusDisplay={contrato.status_display} />
                      </td>
                      <td>
                        {contrato.data_inicio ? new Date(contrato.data_inicio).toLocaleDateString('pt-BR') : '-'}
                        {contrato.data_fim && ` até ${new Date(contrato.data_fim).toLocaleDateString('pt-BR')}`}
                      </td>
                      <td>
                        <span className="badge badge-info">{contrato.qtd_servicos || 0}</span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{contrato.qtd_ordens_servico || 0}</span>
                      </td>
                      <td><strong>{formatCurrency(contrato.valor_total_servicos)}</strong></td>
                      <td>
                        <div className="btn-group">
                          {canEditModel('contratos', 'contrato') ? (
                            <Link
                              to={`/contratos/${contrato.id}`}
                              className="btn btn-sm btn-outline"
                              title="Editar"
                            >
                              ✏️
                            </Link>
                          ) : (
                            <Link
                              to={`/contratos/${contrato.id}`}
                              className="btn btn-sm btn-outline"
                              title="Visualizar"
                            >
                              👁️
                            </Link>
                          )}
                          {contrato.status === 'ATIVO' && (
                            <Link
                              to={`/ordens-servico/new?contrato=${contrato.id}`}
                              className="btn btn-sm btn-success"
                              title="Nova OS"
                            >
                              📋
                            </Link>
                          )}
                          <ModelPermissionGuard app="contratos" model="contrato" action="delete">
                            <button
                              onClick={() => handleDelete(contrato.id, contrato.numero)}
                              className="btn btn-sm btn-danger"
                              title="Excluir"
                              disabled={contrato.qtd_ordens_servico > 0}
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

export default ContratoList
