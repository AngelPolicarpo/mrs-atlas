import { useState, useEffect } from 'react'
import {
  getNacionalidades, createNacionalidade, updateNacionalidade, deleteNacionalidade,
  getAmparosLegais, createAmparoLegal, updateAmparoLegal, deleteAmparoLegal,
  getConsulados, createConsulado, updateConsulado, deleteConsulado,
  getTiposAtualizacao, createTipoAtualizacao, updateTipoAtualizacao, deleteTipoAtualizacao
} from '../services/core'

function Configuracoes() {
  const [activeTab, setActiveTab] = useState('nacionalidades')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})
  const [isCreating, setIsCreating] = useState(false)

  const tabs = [
    { id: 'nacionalidades', label: '🌍 Nacionalidades', fields: ['nome', 'codigo_iso'] },
    { id: 'amparos', label: '⚖️ Amparos Legais', fields: ['nome', 'descricao'] },
    { id: 'consulados', label: '🏛️ Consulados', fields: ['pais'] },
    { id: 'tipos', label: '📋 Tipos de Atualização', fields: ['nome', 'descricao'] },
  ]

  useEffect(() => {
    loadItems()
  }, [activeTab])

  async function loadItems() {
    try {
      setLoading(true)
      setError('')
      let response
      
      switch (activeTab) {
        case 'nacionalidades':
          response = await getNacionalidades()
          break
        case 'amparos':
          response = await getAmparosLegais()
          break
        case 'consulados':
          response = await getConsulados()
          break
        case 'tipos':
          response = await getTiposAtualizacao()
          break
      }
      
      setItems(response.data.results || response.data)
    } catch (err) {
      setError('Erro ao carregar dados')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setError('')
      
      if (isCreating) {
        switch (activeTab) {
          case 'nacionalidades':
            await createNacionalidade(formData)
            break
          case 'amparos':
            await createAmparoLegal(formData)
            break
          case 'consulados':
            await createConsulado(formData)
            break
          case 'tipos':
            await createTipoAtualizacao(formData)
            break
        }
      } else {
        switch (activeTab) {
          case 'nacionalidades':
            await updateNacionalidade(editingId, formData)
            break
          case 'amparos':
            await updateAmparoLegal(editingId, formData)
            break
          case 'consulados':
            await updateConsulado(editingId, formData)
            break
          case 'tipos':
            await updateTipoAtualizacao(editingId, formData)
            break
        }
      }
      
      setEditingId(null)
      setIsCreating(false)
      setFormData({})
      loadItems()
    } catch (err) {
      const errorData = err.response?.data
      if (errorData) {
        const messages = Object.entries(errorData)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n')
        setError(messages)
      } else {
        setError('Erro ao salvar')
      }
      console.error(err)
    }
  }

  async function handleDelete(id, nome) {
    if (!window.confirm(`Deseja realmente excluir "${nome}"?`)) {
      return
    }

    try {
      switch (activeTab) {
        case 'nacionalidades':
          await deleteNacionalidade(id)
          break
        case 'amparos':
          await deleteAmparoLegal(id)
          break
        case 'consulados':
          await deleteConsulado(id)
          break
        case 'tipos':
          await deleteTipoAtualizacao(id)
          break
      }
      loadItems()
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

  function renderField(field, value) {
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

      <div className="config-section">
        <div className="config-header">
          <h2>{currentTab?.label}</h2>
          {!isCreating && !editingId && (
            <button onClick={startCreating} className="btn btn-primary btn-sm">
              + Adicionar
            </button>
          )}
        </div>

        {isCreating && (
          <div className="config-form card">
            <h4>Novo Item</h4>
            <div className="form-row">
              {currentTab?.fields.map(field => (
                <div key={field} className="form-group">
                  <label>{field === 'codigo_iso' ? 'Código ISO' : field === 'pais' ? 'País' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button onClick={cancelEdit} className="btn btn-secondary btn-sm">Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary btn-sm">Salvar</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {currentTab?.fields.map(field => (
                    <th key={field}>
                      {field === 'codigo_iso' ? 'Código ISO' : 
                       field === 'pais' ? 'País' : 
                       field.charAt(0).toUpperCase() + field.slice(1)}
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
                      Nenhum item encontrado
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
                                className="btn btn-sm btn-secondary"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.nome || item.pais)}
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
        )}
      </div>
    </div>
  )
}

export default Configuracoes
