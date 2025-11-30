import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import clientService from '../services/clients'

function ClientList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  useEffect(() => {
    loadClients()
  }, [page, search])
  
  async function loadClients() {
    setLoading(true)
    try {
      const response = await clientService.list({
        page,
        search: search || undefined,
      })
      setClients(response.results || [])
      setTotalPages(Math.ceil((response.count || 0) / 20))
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    
    try {
      await clientService.delete(id)
      loadClients()
    } catch (error) {
      alert('Erro ao excluir cliente')
    }
  }
  
  async function handleAnonymize(id) {
    if (!confirm('Tem certeza que deseja anonimizar os dados deste cliente? Esta ação é irreversível.')) return
    
    try {
      await clientService.anonymize(id)
      loadClients()
    } catch (error) {
      alert('Erro ao anonimizar dados')
    }
  }
  
  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    loadClients()
  }
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <Link to="/clients/new" className="btn btn-primary">
          + Novo Cliente
        </Link>
      </div>
      
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nome, email, CPF ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Buscar</button>
      </form>
      
      <div className="card">
        {loading ? (
          <p>Carregando...</p>
        ) : clients.length === 0 ? (
          <p style={{ color: 'var(--text-light)' }}>
            Nenhum cliente encontrado.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Empresa</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td>
                      <Link to={`/clients/${client.id}`}>{client.name}</Link>
                    </td>
                    <td>{client.email}</td>
                    <td>{client.phone || '-'}</td>
                    <td>{client.company || '-'}</td>
                    <td>
                      <span className={`badge ${client.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {client.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <Link to={`/clients/${client.id}`} className="action-btn" title="Editar">
                          ✏️
                        </Link>
                        <button
                          className="action-btn"
                          onClick={() => handleAnonymize(client.id)}
                          title="Anonimizar (LGPD)"
                        >
                          🔒
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => handleDelete(client.id)}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientList
