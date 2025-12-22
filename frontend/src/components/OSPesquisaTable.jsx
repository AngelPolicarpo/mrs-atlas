import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Componente para renderizar tabela de resultados de Ordens de Serviço
 * Responsabilidades:
 * - Renderizar table com resultados de OS
 * - Renderizar detalhes expandidos (itens, titulares, dependentes)
 * - Aplicar estilos baseado em status
 */
function OSPesquisaTable({
  results,
  expandedItems,
  onToggleExpand,
  formatDate,
  formatCurrency,
  getStatusBadgeClass,
  getRowClass,
  getDiasAbertosBadgeClass,
  formatDiasAbertos,
}) {
  return (
    <div className="table-container">
      <table className="pesquisa-table">
        <thead>
          <tr>
            <th style={{ width: '30px' }}></th>
            <th>Número</th>
            <th>Abertura</th>
            <th>Status</th>
            <th>Contrato</th>
            <th>Solicitante</th>
            <th>Faturamento</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {results.map(os => (
            <React.Fragment key={os.id}>
              <tr className={getRowClass(os)}>
                <td>
                  <button
                    className="btn-expand"
                    onClick={() => onToggleExpand(os.id)}
                  >
                    {expandedItems[os.id] ? '▼' : '▶'}
                  </button>
                </td>
                <td>
                  <strong>{os.numero || '-'}</strong>
                </td>
                <td>
                  {formatDate(os.data_abertura)}
                  {os.status === 'ABERTA' && (
                    <span 
                      className={`badge ${getDiasAbertosBadgeClass(os.data_abertura, os.status)}`} 
                      style={{ marginLeft: '0.5rem' }}
                    >
                      {formatDiasAbertos(os.data_abertura)}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(os.status)}`}>
                    {os.status_display || os.status || '-'}
                  </span>
                </td>
                <td>{os.contrato_numero || '-'}</td>
                <td>{os.empresa_solicitante_nome || '-'}</td>
                <td>{os.centro_custos_nome || '-'}</td>
                <td>
                  <strong>{formatCurrency(os.valor_total)}</strong>
                </td>
                <td>
                  <div className="actions-buttons">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onToggleExpand(os.id)}
                    >
                      {expandedItems[os.id] ? 'Ocultar' : 'Ver mais'}
                    </button>
                    <Link
                      to={`/ordens-servico/${os.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Editar
                    </Link>
                  </div>
                </td>
              </tr>
              {expandedItems[os.id] && (
                <tr className="row-details">
                  <td colSpan="9">
                    <div className="details-content">
                      <div className="details-grid">
                        {/* Informações Gerais */}
                        <div className="details-section">
                          <h4>Informações Gerais</h4>
                          <p>
                            <strong>Data Abertura:</strong> {formatDate(os.data_abertura)}
                          </p>
                          <p>
                            <strong>Data Fechamento:</strong> {formatDate(os.data_fechamento)}
                          </p>
                          <p>
                            <strong>Responsável:</strong> {os.responsavel_nome || '-'}
                          </p>
                          <p>
                            <strong>Observação:</strong> {os.observacao || '-'}
                          </p>
                        </div>

                        {/* Empresas */}
                        <div className="details-section">
                          <h4>Empresas</h4>
                          <p>
                            <strong>Contratante:</strong> {os.empresa_contratante_nome || '-'}
                          </p>
                          <p>
                            <strong>Solicitante:</strong> {os.empresa_solicitante_nome || '-'}
                          </p>
                          <p>
                            <strong>Pagadora:</strong> {os.empresa_pagadora_nome || '-'}
                          </p>
                          <p>
                            <strong>Centro de Custos:</strong> {os.centro_custos_nome || '-'}
                          </p>
                        </div>

                        {/* Valores */}
                        <div className="details-section">
                          <h4>Valores</h4>
                          <p>
                            <strong>Serviços:</strong> {formatCurrency(os.valor_servicos)}
                          </p>
                          <p>
                            <strong>Despesas:</strong> {formatCurrency(os.valor_despesas)}
                          </p>
                          <p>
                            <strong>Total:</strong> <span className="text-primary">{formatCurrency(os.valor_total)}</span>
                          </p>
                        </div>

                        {/* Quantidades */}
                        <div className="details-section">
                          <h4>Quantidades</h4>
                          <p>
                            <strong>Itens:</strong> {os.qtd_itens || 0}
                          </p>
                          <p>
                            <strong>Titulares:</strong> {os.qtd_titulares || 0}
                          </p>
                          <p>
                            <strong>Dependentes:</strong> {os.qtd_dependentes || 0}
                          </p>
                        </div>
                      </div>

                      {/* Titulares Vinculados */}
                      {os.titulares_vinculados && os.titulares_vinculados.length > 0 && (
                        <div className="details-subsection">
                          <h5>👤 Titulares Vinculados</h5>
                          <div className="tags-list">
                            {os.titulares_vinculados.map(t => (
                              <Link 
                                key={t.id} 
                                to={`/titulares/${t.titular}`}
                                className="tag tag-primary"
                              >
                                {t.titular_nome}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dependentes Vinculados */}
                      {os.dependentes_vinculados && os.dependentes_vinculados.length > 0 && (
                        <div className="details-subsection">
                          <h5>👥 Dependentes Vinculados</h5>
                          <div className="tags-list">
                            {os.dependentes_vinculados.map(d => (
                              <Link 
                                key={d.id} 
                                to={`/dependentes/${d.dependente}`}
                                className="tag tag-secondary"
                              >
                                {d.dependente_nome}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Itens da OS */}
                      {os.itens && os.itens.length > 0 && (
                        <div className="details-subsection">
                          <h5>📋 Itens da OS</h5>
                          <table className="table-inline">
                            <thead>
                              <tr>
                                <th>Serviço</th>
                                <th>Quantidade</th>
                                <th>Valor Unit.</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {os.itens.map(item => (
                                <tr key={item.id}>
                                  <td>{item.servico_nome || '-'}</td>
                                  <td>{item.quantidade || 1}</td>
                                  <td>{formatCurrency(item.valor_unitario)}</td>
                                  <td>{formatCurrency(item.valor_total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Despesas */}
                      {os.despesas && os.despesas.length > 0 && (
                        <div className="details-subsection">
                          <h5>💰 Despesas</h5>
                          <table className="table-inline">
                            <thead>
                              <tr>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th>Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {os.despesas.map(despesa => (
                                <tr key={despesa.id}>
                                  <td>{despesa.tipo_despesa_nome || '-'}</td>
                                  <td>{despesa.descricao || '-'}</td>
                                  <td>{formatCurrency(despesa.valor)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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

export default OSPesquisaTable
