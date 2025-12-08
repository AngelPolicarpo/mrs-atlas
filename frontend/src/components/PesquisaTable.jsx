import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Componente puro para renderizar tabela de resultados
 * Responsabilidades:
 * - Renderizar table com resultados
 * - Renderizar detalhes expandidos
 * - Aplicar estilos baseado em dados
 */
function PesquisaTable({
  results,
  expandedItems,
  onToggleExpand,
  getRowClass,
  formatDate,
  calcularDiasRestantes,
  getBadgeClass,
  formatDiasRestantes,
  getStatusText,
  getStatusBadgeClass,
  getTypeText,
  getTypeBadgeClass,
}) {
  return (
    <div className="table-container">
      <table className="pesquisa-table">
        <thead>
          <tr>
            <th style={{ width: '30px' }}></th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Vínculo/Relação</th>
            <th>Amparo</th>
            <th>RNM</th>
            <th>Data Fim Vínculo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {results.map(item => (
            <React.Fragment key={item.visibleId}>
              <tr className={getRowClass(item.dataFimVinculo, item.type)}>
                <td>
                  <button
                    className="btn-expand"
                    onClick={() => onToggleExpand(item.visibleId)}
                  >
                    {expandedItems[item.visibleId] ? '▼' : '▶'}
                  </button>
                </td>
                <td>
                  <strong>{item.nome}</strong>
                </td>
                <td>
                  <span className={`tipo-badge ${getTypeBadgeClass(item)}`}>
                    {getTypeText(item)}
                  </span>
                </td>
                <td>
                  {item.type === 'titular' && (
                    <>
                      {item.tipoVinculo !== 'Empresa' && (item.tipoVinculo || '-')}
                      {item.empresa && ` ${item.empresa}`}
                    </>
                  )}
                  {(item.type === 'dependente' || item.type === 'dependente-orphan') && (
                    <span className="text-small">
                      {item.tipoDependente || 'Dependente'} de {item.titularNome}
                    </span>
                  )}
                </td>
                <td>{item.type === 'titular' ? (item.amparo || '-') : (item.amparo || '-')}</td>
                <td>{item.rnm || '-'}</td>
                <td>
                  {formatDate(item.dataFimVinculo)}
                  {(() => {
                    const dias = calcularDiasRestantes(item.dataFimVinculo)
                    if (dias !== null) {
                      return (
                        <span className={`badge ${getBadgeClass(item.dataFimVinculo)}`} style={{ marginLeft: '0.5rem' }}>
                          {formatDiasRestantes(item.dataFimVinculo)}
                        </span>
                      )
                    }
                    return null
                  })()}
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(item)}`}>
                    {getStatusText(item)}
                  </span>
                </td>
                <td>
                  <div className="actions-buttons">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onToggleExpand(item.visibleId)}
                    >
                      {expandedItems[item.visibleId] ? 'Ocultar' : 'Ver mais'}
                    </button>
                    <Link
                      to={item.type === 'titular' ? `/titulares/${item.id}` : `/dependentes/${item.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Editar
                    </Link>
                  </div>
                </td>
              </tr>
              {expandedItems[item.visibleId] && (
                <tr className="row-details">
                  <td colSpan="9">
                    <div className="details-content">
                      <div className="details-grid">
                        {item.type === 'titular' ? (
                          <>
                            <div className="details-section">
                              <h4>Dados Pessoais</h4>
                              <p>
                                <strong>CPF:</strong> {item.cpf || '-'}
                              </p>
                              <p>
                                <strong>Passaporte:</strong> {item.passaporte || '-'}
                              </p>
                              <p>
                                <strong>Nacionalidade:</strong> {item.nacionalidade || '-'}
                              </p>
                              <p>
                                <strong>Data Nascimento:</strong> {formatDate(item.dataNascimento)}
                              </p>
                            </div>
                            <div className="details-section">
                              <h4>Contato</h4>
                              <p>
                                <strong>Email:</strong> {item.email || '-'}
                              </p>
                              <p>
                                <strong>Telefone:</strong> {item.telefone || '-'}
                              </p>
                            </div>
                            <div className="details-section">
                              <h4>Filiação</h4>
                              <p>
                                <strong>Filiação 1:</strong> {item.filiacao_um || '-'}
                              </p>
                              <p>
                                <strong>Filiação 2:</strong> {item.filiacao_dois || '-'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="details-section">
                              <h4>Dados Pessoais</h4>
                              <p>
                                <strong>Passaporte:</strong> {item.passaporte || '-'}
                              </p>
                              <p>
                                <strong>Nacionalidade:</strong> {item.nacionalidade || '-'}
                              </p>
                              <p>
                                <strong>Data Nascimento:</strong> {formatDate(item.dataNascimento)}
                              </p>
                            </div>
                            <div className="details-section">
                              <h4>Filiação</h4>
                              <p>
                                <strong>Filiação 1:</strong> {item.filiacao_um || '-'}
                              </p>
                              <p>
                                <strong>Filiação 2:</strong> {item.filiacao_dois || '-'}
                              </p>
                            </div>
                            <div className="details-section">
                              <h4>Titular</h4>
                              <p>
                                <strong>Nome:</strong> {item.titularNome}
                              </p>
                              <Link to={`/titulares/${item.titularId}`} className="btn btn-sm btn-outline">
                                Ver Titular
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PesquisaTable
