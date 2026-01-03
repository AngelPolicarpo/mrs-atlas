import React from 'react'
import { Link } from 'react-router-dom'
import exportOSToPDF from '../utils/osPdfExport'

/**
 * Componente para renderizar tabela de resultados de Ordens de Serviço
 * Responsabilidades:
 * - Renderizar table com resultados de OS
 * - Renderizar detalhes expandidos (itens, titulares, dependentes)
 * - Aplicar estilos baseado em status
 * - Exportar OS individual para PDF (orçamento)
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
  /**
   * Exporta a OS para PDF no formato de orçamento
   * @param {Object} os - Dados da Ordem de Serviço
   */
  const handleExportPDF = async (os) => {
    try {
      await exportOSToPDF(os)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar o PDF. Tente novamente.')
    }
  }
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
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleExportPDF(os)}
                      title="Exportar Orçamento PDF"
                    >
                      📄 PDF
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
                      {/* Grid de informações principais */}
                      <div className="details-grid">
                        {/* Informações Gerais */}
                        <div className="details-section">
                          <h4>📋 Informações Gerais</h4>
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
                          <h4>🏢 Empresas</h4>
                          <p>
                            <strong>Contrato:</strong> {os.empresa_contratante_nome || '-'}
                          </p>
                          <p>
                            <strong>Solicitante:</strong> {os.empresa_solicitante_nome || '-'}
                          </p>
                          <p>
                            <strong>Faturamento:</strong> {os.empresa_pagadora_nome || '-'}
                          </p>
                          <p>
                            <strong>Centro de Custos:</strong> {os.centro_custos_nome || '-'}
                          </p>
                        </div>

                        {/* Valores */}
                        <div className="details-section">
                          <h4>💵 Valores</h4>
                          <p>
                            <strong>Serviços:</strong> {formatCurrency(os.valor_servicos)}
                          </p>
                          <p>
                            <strong>Despesas:</strong> {formatCurrency(os.valor_despesas)}
                          </p>
                          <p>
                            <strong>Total:</strong>{' '}
                            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                              {formatCurrency(os.valor_total)}
                            </span>
                          </p>
                        </div>

                        {/* Quantidades */}
                        <div className="details-section">
                          <h4>📊 Quantidades</h4>
                          <p>
                            <strong>Serviços:</strong> {os.qtd_itens || 0}
                          </p>
                          <p>
                            <strong>Titulares:</strong> {os.qtd_titulares || 0}
                          </p>
                          <p>
                            <strong>Dependentes:</strong> {os.qtd_dependentes || 0}
                          </p>
                        </div>
                      </div>

                      {/* Pessoas Vinculadas (Titulares + Dependentes) */}
                      {((os.titulares_vinculados && os.titulares_vinculados.length > 0) || 
                        (os.dependentes_vinculados && os.dependentes_vinculados.length > 0)) && (
                        <div className="details-subsection">
                          <h5>👥  ({(os.titulares_vinculados?.length || 0) + (os.dependentes_vinculados?.length || 0)})</h5>
                          <table className="table-inline">
                            <thead>
                              <tr>
                                <th style={{ width: '50%' }}>Nome</th>
                                <th style={{ width: '20%' }}>Tipo</th>
                                <th style={{ width: '30%' }}>Relação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Titulares */}
                              {os.titulares_vinculados?.map(t => (
                                <tr key={`titular-${t.id}`}>
                                  <td>
                                    <Link 
                                      to={`/titulares/${t.titular}`}
                                      style={{ textDecoration: 'none', fontWeight: 500 }}
                                    >
                                      {t.titular_nome}
                                    </Link>
                                    {t.titular_cpf && (
                                      <span style={{ marginLeft: '8px', color: 'var(--color-text-light)', fontSize: '0.75rem' }}>
                                        ({t.titular_cpf})
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Titular</span>
                                  </td>
                                  <td style={{ color: 'var(--color-text-light)' }}>-</td>
                                </tr>
                              ))}
                              {/* Dependentes */}
                              {os.dependentes_vinculados?.map(d => (
                                <tr key={`dependente-${d.id}`}>
                                  <td>
                                    <Link 
                                      to={`/dependentes/${d.dependente}`}
                                      style={{ textDecoration: 'none', fontWeight: 500 }}
                                    >
                                      {d.dependente_nome}
                                    </Link>
                                  </td>
                                  <td>
                                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Dependente</span>
                                  </td>
                                  <td style={{ color: 'var(--color-text-light)' }}>
                                    {d.titular_nome || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Itens da OS (Serviços) */}
                      {os.itens && os.itens.length > 0 && (
                        <div className="details-subsection">
                          <h5>📋 Serviços ({os.itens.length})</h5>
                          <table className="table-inline">
                            <thead>
                              <tr>
                                <th style={{ width: '40%' }}>Item</th>
                                <th style={{ width: '30%' }}>Descrição</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Qtd</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>Valor Unit.</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {os.itens.map(item => (
                                <tr key={item.id}>
                                  <td>
                                    <strong>{item.servico_item || '-'}</strong>
                                  </td>
                                  <td style={{ color: 'var(--color-text-light)' }}>
                                    {item.servico_descricao || '-'}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>{item.quantidade || 1}</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.valor_aplicado)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {formatCurrency(item.valor_total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Despesas */}
                      {os.despesas && os.despesas.length > 0 && (
                        <div className="details-subsection">
                          <h5>💰 Despesas ({os.despesas.length})</h5>
                          <table className="table-inline">
                            <thead>
                              <tr>
                                <th style={{ width: '30%' }}>Tipo</th>
                                <th style={{ width: '50%' }}>Observação</th>
                                <th style={{ width: '20%', textAlign: 'right' }}>Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {os.despesas.map(despesa => (
                                <tr key={despesa.id}>
                                  <td>
                                    <strong>{despesa.tipo_despesa_item || '-'}</strong>
                                    {despesa.tipo_despesa_descricao && (
                                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                                        {despesa.tipo_despesa_descricao}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ color: 'var(--color-text-light)' }}>
                                    {despesa.observacao || '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {formatCurrency(despesa.valor)}
                                  </td>
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
