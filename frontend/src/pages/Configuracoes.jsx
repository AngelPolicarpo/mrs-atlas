import { useState, useEffect, useCallback } from 'react'
import {
  getAmparosLegais, createAmparoLegal, updateAmparoLegal, deleteAmparoLegal,
  getTiposAtualizacao, createTipoAtualizacao, updateTipoAtualizacao, deleteTipoAtualizacao
} from '../services/core'
import usePagination from '../hooks/usePagination'
import { useDebounce } from '../hooks/useDebounce'
import Pagination from '../components/Pagination'
import { AdminPage } from '../components/ProtectedPage'
import { getErrorMessage } from '../utils/errorHandler'

function ConfiguracoesContent() {
  const [activeTab, setActiveTab] = useState('amparos')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})
  const [isCreating, setIsCreating] = useState(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  // Pagination hook
  const {
    pagination,
    setPage,
    setPageSize,
    updateFromResponse,
    reset: resetPagination,
  } = usePagination({ initialPageSize: 10 })

  const tabs = [
    { id: 'amparos', label: '⚖️ Amparos Legais', fields: ['nome', 'descricao'] },
    { id: 'tipos', label: '📋 Tipos de Atualização', fields: ['nome', 'descricao'] },
  ]

  const loadItems = useCallback(async (page = pagination.page, pageSize = pagination.pageSize, search = debouncedSearch) => {
    try {
      setLoading(true)
      setError('')
      
      const params = {
        page,
        page_size: pageSize,
      }
      
      // Add search if provided
      if (search && search.trim()) {
        params.search = search.trim()
      }
      
      let response
      switch (activeTab) {
        case 'amparos':
          response = await getAmparosLegais(params)
          break
        case 'tipos':
          response = await getTiposAtualizacao(params)
          break
      }
      
      const data = response.data
      setItems(data.results || data)
      
      // Update pagination from response
      updateFromResponse({
        count: data.count || (data.results ? data.results.length : data.length),
        next: data.next,
        previous: data.previous,
      }, page, pageSize)
    } catch (err) {
      setError('Erro ao carregar dados')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, updateFromResponse])

  // Load items when tab, page, pageSize, or search changes
  useEffect(() => {
    loadItems(pagination.page, pagination.pageSize, debouncedSearch)
  }, [activeTab, pagination.page, pagination.pageSize, debouncedSearch, loadItems])

  // Reset pagination when changing tabs
  useEffect(() => {
    resetPagination()
    setSearchTerm('')
  }, [activeTab, resetPagination])

  async function handleSave() {
    try {
      setError('')
      
      if (isCreating) {
        switch (activeTab) {
          case 'amparos':
            await createAmparoLegal(formData)
            break
          case 'tipos':
            await createTipoAtualizacao(formData)
            break
        }
      } else {
        switch (activeTab) {
          case 'amparos':
            await updateAmparoLegal(editingId, formData)
            break
          case 'tipos':
            await updateTipoAtualizacao(editingId, formData)
            break
        }
      }
      
      setEditingId(null)
      setIsCreating(false)
      setFormData({})
      loadItems(pagination.page, pagination.pageSize, debouncedSearch)
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar'))
      console.error(err)
    }
  }

  async function handleDelete(id, nome) {
    if (!window.confirm(`Deseja realmente excluir "${nome}"?`)) {
      return
    }

    try {
      switch (activeTab) {
        case 'amparos':
          await deleteAmparoLegal(id)
          break
        case 'tipos':
          await deleteTipoAtualizacao(id)
          break
      }
      loadItems(pagination.page, pagination.pageSize, debouncedSearch)
    } catch (err) {
      setError('Erro ao excluir. O item pode estar em uso.')
      console.error(err)
    }
  }

  function startEditing(item) {
    setEditingId(item.id)
    setIsCreating(false)
    setFormData({ ...item })
  }

  function startCreating() {
    setIsCreating(true)
    setEditingId(null)
    setFormData({ ativo: true })
  }

  function cancelEdit() {
    setEditingId(null)
    setIsCreating(false)
    setFormData({})
  }

  const currentTab = tabs.find(t => t.id === activeTab)

  function renderField(field) {
    if (field === 'descricao') {
      return (
        <textarea
          value={formData[field] || ''}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
          className="form-control"
          rows="2"
        />
      )
    }
    return (
      <input
        type="text"
        value={formData[field] || ''}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        className="form-control"
      />
    )
  }
  
  function handlePageChange(newPage) {
    setPage(newPage)
  }
  
  function handlePageSizeChange(e) {
    setPageSize(parseInt(e.target.value, 10))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Configurações</h1>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); cancelEdit(); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{currentTab?.label}</h2>
          {!isCreating && !editingId && (
            <button onClick={startCreating} className="btn btn-primary">
              + Adicionar
            </button>
          )}
        </div>
        
        {/* Search Bar */}
        <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
          <div className="search-bar" style={{ marginBottom: '0' }}>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {isCreating && (
          <div className="config-form" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem', margin: '0 1rem 1.5rem 1rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9375rem', fontWeight: '600' }}>Novo Item</h4>
            <div className="form-row">
              {currentTab?.fields.map(field => (
                <div key={field} className="form-group">
                  <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button onClick={cancelEdit} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary">Salvar</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <>
            {/* Results Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0 1rem', 
              marginBottom: '1rem',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              <span>
                {pagination.totalCount} {pagination.totalCount === 1 ? 'item encontrado' : 'itens encontrados'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Exibir:</span>
                <select
                  value={pagination.pageSize}
                  onChange={handlePageSizeChange}
                  className="form-control"
                  style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {currentTab?.fields.map(field => (
                      <th key={field}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </th>
                    ))}
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={currentTab?.fields.length + 2} className="text-center">
                        {searchTerm ? 'Nenhum item encontrado para a busca' : 'Nenhum item encontrado'}
                      </td>
                    </tr>
                  ) : (
                    items.map(item => (
                      <tr key={item.id}>
                        {editingId === item.id ? (
                          <>
                            {currentTab?.fields.map(field => (
                              <td key={field}>{renderField(field)}</td>
                            ))}
                            <td>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={formData.ativo ?? true}
                                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                />
                                Ativo
                              </label>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button onClick={handleSave} className="btn btn-sm btn-primary">✓</button>
                                <button onClick={cancelEdit} className="btn btn-sm btn-secondary">✕</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {currentTab?.fields.map(field => (
                              <td key={field}>
                                {field === 'descricao' 
                                  ? (item[field]?.substring(0, 50) + (item[field]?.length > 50 ? '...' : '') || '-')
                                  : (item[field] || '-')}
                              </td>
                            ))}
                            <td>
                              <span className={`badge ${item.ativo ? 'badge-success' : 'badge-danger'}`}>
                                {item.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() => startEditing(item)}
                                  className="btn btn-sm btn-outline"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, item.nome)}
                                  className="btn btn-sm btn-danger"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Página de Configurações - Protegida para Admin
 */
function Configuracoes() {
  return (
    <AdminPage title="Configurações do Sistema">
      <ConfiguracoesContent />
    </AdminPage>
  )
}

export default Configuracoes
