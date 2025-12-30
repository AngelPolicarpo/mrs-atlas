import { Link } from 'react-router-dom'
import useOrdemServicoList from '../hooks/useOrdemServicoList'
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
    ABERTA: 'badge-info',
    FINALIZADA: 'badge-success',
    CANCELADA: 'badge-danger',
  }
  
  return (
    <span className={`badge ${statusColors[status] || 'badge-secondary'}`}>
      {statusDisplay}
    </span>
  )
}

function OrdemServicoList() {
  const {
    ordensServico,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusOptions,
    error,
    handleDelete,
    // Paginação
    pagination,
    pageSizeOptions,
    goToPage,
    handlePageSizeChange,
  } = useOrdemServicoList()
  
  const { canEditModel, canDeleteModel } = usePermissions()
  
  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 Ordens de Serviço</h1>
        <ModelPermissionGuard app="ordem_servico" model="ordemservico" action="add">
          <Link to="/ordens-servico/new" className="btn btn-primary">
            + Nova OS
          </Link>
        </ModelPermissionGuard>
      </div>

      <div className="search-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por número, observação..."
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
            itemLabel="ordem de serviço"
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
          />
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Abertura</th>
                  <th>Contrato</th>
                  <th>Status</th>
                  <th>Solicitante</th>
                  <th>Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordensServico.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Nenhuma ordem de serviço encontrada
                    </td>
                  </tr>
                ) : (
                  ordensServico.map((os) => (
                    <tr key={os.id}>
                      <td><strong>#{os.numero}</strong></td>
                      <td>{os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                      <td>
                        {os.contrato_numero ? (
                          <Link 
                            to={`/empresas/${os.empresa_contratante}#contrato-${os.contrato}`} 
                            className="link"
                            title={`Ver contrato na empresa ${os.empresa_contratante_nome || ''}`}
                          >
                            {os.contrato_numero}
                          </Link>
                        ) : '-'}
                      </td>
                      <td>
                        <StatusBadge status={os.status} statusDisplay={os.status_display} />
                      </td>
                      <td>{os.empresa_solicitante_nome || '-'}</td>
                      <td><strong>{formatCurrency(os.valor_total)}</strong></td>
                      <td>
                        <div className="btn-group">
                          {canEditModel('ordem_servico', 'ordemservico') ? (
                            <Link
                              to={`/ordens-servico/${os.id}`}
                              className="btn btn-sm btn-outline"
                              title="Editar"
                            >
                              ✏️
                            </Link>
                          ) : (
                            <Link
                              to={`/ordens-servico/${os.id}`}
                              className="btn btn-sm btn-outline"
                              title="Visualizar"
                            >
                              👁️
                            </Link>
                          )}
                          <ModelPermissionGuard app="ordem_servico" model="ordemservico" action="delete">
                            <button
                              onClick={() => handleDelete(os.id, os.numero)}
                              className="btn btn-sm btn-danger"
                              title="Excluir"
                              disabled={os.status === 'FINALIZADA'}
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

export default OrdemServicoList
