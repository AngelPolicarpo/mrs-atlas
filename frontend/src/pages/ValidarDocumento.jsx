import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import logo from '../img/oie_ADRZD4MM25hi.png'

/**
 * Página pública de validação de documentos de Ordem de Serviço.
 * Permite verificar a autenticidade e integridade de documentos emitidos.
 * 
 * Funcionalidades:
 * - Validação automática pelo ID do documento (via URL)
 * - Busca manual pelo código do documento
 * - Upload de PDF para verificação de integridade
 */
function ValidarDocumento() {
  const { documentoId } = useParams()
  
  // Estados
  const [loading, setLoading] = useState(false)
  const [documento, setDocumento] = useState(null)
  const [error, setError] = useState(null)
  const [codigoBusca, setCodigoBusca] = useState('')
  const [arquivoUpload, setArquivoUpload] = useState(null)
  const [resultadoIntegridade, setResultadoIntegridade] = useState(null)
  const [loadingIntegridade, setLoadingIntegridade] = useState(false)
  
  /**
   * Busca documento por ID
   */
  const buscarPorId = async (id) => {
    setLoading(true)
    setError(null)
    setDocumento(null)
    setResultadoIntegridade(null)
    
    try {
      const response = await api.get(`/api/v1/documentos-os/${id}/validar/`)
      
      if (response.data.valid) {
        setDocumento(response.data.documento)
      } else {
        setError(response.data.error || 'Documento não encontrado.')
      }
    } catch (err) {
      console.error('Erro ao validar documento:', err)
      if (err.response?.status === 404) {
        setError('Documento não encontrado. Verifique o código e tente novamente.')
      } else {
        setError('Erro ao validar documento. Tente novamente mais tarde.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Busca documento pelo código (ex: DOC-OS-000001-V001)
   */
  const buscarPorCodigo = async (codigo) => {
    setLoading(true)
    setError(null)
    setDocumento(null)
    setResultadoIntegridade(null)
    
    try {
      const response = await api.get(`/api/v1/documentos-os/validar-codigo/${codigo}/`)
      
      if (response.data.valid) {
        setDocumento(response.data.documento)
      } else {
        setError(response.data.error || 'Documento não encontrado.')
      }
    } catch (err) {
      console.error('Erro ao validar documento:', err)
      if (err.response?.status === 404) {
        setError('Documento não encontrado. Verifique o código e tente novamente.')
      } else {
        setError('Erro ao validar documento. Tente novamente mais tarde.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Valida integridade do documento por upload
   */
  const validarIntegridade = async () => {
    if (!arquivoUpload || !documento) return
    
    setLoadingIntegridade(true)
    setResultadoIntegridade(null)
    
    try {
      const formData = new FormData()
      formData.append('arquivo', arquivoUpload)
      
      const response = await api.post(
        `/api/v1/documentos-os/${documento.id}/validar-integridade/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      
      setResultadoIntegridade(response.data)
    } catch (err) {
      console.error('Erro ao validar integridade:', err)
      setResultadoIntegridade({
        integridade_valida: false,
        mensagem: 'Erro ao processar o arquivo. Verifique se é um PDF válido.'
      })
    } finally {
      setLoadingIntegridade(false)
    }
  }
  
  /**
   * Handler para busca manual
   */
  const handleBuscar = (e) => {
    e.preventDefault()
    if (codigoBusca.trim()) {
      // Verifica se parece com um UUID ou código
      if (codigoBusca.includes('DOC-OS-')) {
        buscarPorCodigo(codigoBusca.trim())
      } else {
        buscarPorId(codigoBusca.trim())
      }
    }
  }
  
  /**
   * Handler para upload de arquivo
   */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setArquivoUpload(file)
      setResultadoIntegridade(null)
    }
  }
  
  /**
   * Formata data para exibição
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }
  
  /**
   * Formata valor monetário
   */
  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  /**
   * Obtém valor total do snapshot
   */
  const getValorTotal = () => {
    if (!documento?.dados_snapshot) return null
    return documento.dados_snapshot.valor_total
  }
  
  // Busca automática se há ID na URL
  useEffect(() => {
    if (documentoId) {
      buscarPorId(documentoId)
    }
  }, [documentoId])
  
  return (
    <div className="auth-container" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Header */}
        <div className="auth-card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <img style={{ width: '30px', height: '30px', marginRight: '10px' }} src={logo} alt="MRS Logo" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }}>Validação de Documento</h1>
          </div>
          <p style={{ color: 'var(--color-text-light)', margin: 0 }}>
            Verifique a autenticidade de documentos emitidos pelo Sistema Atlas
          </p>
        </div>
        
        {/* Formulário de Busca */}
        <div className="auth-card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleBuscar}>
            <div className="form-group">
              <label className="form-label">Código ou ID do Documento</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: DOC-OS-000001-V001"
                  value={codigoBusca}
                  onChange={(e) => setCodigoBusca(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={loading || !codigoBusca.trim()}>
                  {loading ? 'Buscando...' : 'Validar'}
                </button>
              </div>
              <small style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', display: 'block' }}>
                O código do documento está localizado no rodapé do PDF
              </small>
            </div>
          </form>
        </div>
        
        {/* Loading */}
        {loading && (
          <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--color-text-light)', margin: 0 }}>Verificando documento...</p>
          </div>
        )}
        
        {/* Erro */}
        {error && !loading && (
          <div className="auth-card">
            <div className="alert alert-error" style={{ marginBottom: 0 }}>
              <strong>Documento Não Encontrado</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>{error}</p>
            </div>
          </div>
        )}
        
        {/* Documento Encontrado */}
        {documento && !loading && (
          <>
            {/* Status do Documento */}
            <div className="auth-card" style={{ marginBottom: '1.5rem' }}>
              <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>✅</span>
                  <div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                      Este registro consta no sistema.
                    </p>
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{ 
                  fontFamily: 'var(--font-family-mono)', 
                  fontSize: '1.25rem', 
                  fontWeight: '600',
                  color: 'var(--color-primary)',
                  background: 'var(--color-primary-light)',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px'
                }}>
                  {documento.codigo}
                </span>
              </div>
              
              {/* Metadados do Documento */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem' 
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem' }}>Ordem de Serviço</label>
                  <span style={{ fontWeight: '500' }}>#{documento.ordem_servico_numero}</span>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem' }}>Versão</label>
                  <span style={{ fontWeight: '500' }}>V{String(documento.versao).padStart(3, '0')}</span>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem' }}>Data de Emissão</label>
                  <span style={{ fontWeight: '500' }}>{formatDate(documento.data_emissao)}</span>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem' }}>Emitido por</label>
                  <span style={{ fontWeight: '500' }}>{documento.emitido_por_nome || '-'}</span>
                </div>
                
                {getValorTotal() && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Valor Total</label>
                    <span style={{ fontWeight: '500', color: 'var(--color-success-dark)' }}>
                      {formatCurrency(getValorTotal())}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Validação de Integridade */}
            <div className="auth-card">
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>
                🔐 Verificar Integridade do Arquivo
              </h3>
              <p style={{ color: 'var(--color-text-light)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Faça upload do PDF para verificar se o conteúdo não foi alterado após a emissão.
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    id="arquivo-upload"
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="arquivo-upload" 
                    className="btn btn-secondary"
                    style={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {arquivoUpload ? arquivoUpload.name : '📁 Selecionar arquivo PDF'}
                  </label>
                </div>
                
                {arquivoUpload && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={validarIntegridade}
                    disabled={loadingIntegridade}
                  >
                    {loadingIntegridade ? 'Verificando...' : 'Verificar'}
                  </button>
                )}
              </div>
              
              {/* Resultado da Validação de Integridade */}
              {resultadoIntegridade && (
                <div 
                  className={`alert ${resultadoIntegridade.integridade_valida ? 'alert-success' : 'alert-error'}`}
                  style={{ marginTop: '1rem', marginBottom: 0 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {resultadoIntegridade.integridade_valida ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        {resultadoIntegridade.mensagem}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Informações Adicionais */}
        {!documento && !loading && !error && (
          <div className="auth-card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>
              ℹ️ Sobre a Validação
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--color-text-light)' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                Este sistema permite verificar a autenticidade de documentos emitidos pelo Atlas.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                O código do documento está localizado no rodapé do PDF.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                A verificação de integridade compara o arquivo com o registro original.
              </li>
              <li>
                Documentos válidos possuem registro no sistema desde a data de emissão.
              </li>
            </ul>
          </div>
        )}
        
        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Sistema Atlas - Gestão de Clientes
        </div>
      </div>
    </div>
  )
}

export default ValidarDocumento
