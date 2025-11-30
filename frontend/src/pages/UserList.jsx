import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import userService from '../services/users'

function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  useEffect(() => {
    loadUsers()
  }, [])
  
  async function loadUsers() {
    setLoading(true)
    try {
      const response = await userService.list({
        search: search || undefined,
      })
      setUsers(response.results || response || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return
    
    try {
      await userService.delete(id)
      loadUsers()
    } catch (error) {
      alert('Erro ao desativar usuário')
    }
  }
  
  function handleSearch(e) {
    e.preventDefault()
    loadUsers()
  }
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Perfis de Usuário</h1>
        <Link to="/users/new" className="btn btn-primary">
          + Novo Usuário
        </Link>
      </div>
      
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Buscar</button>
      </form>
      
      <div className="card">
        {loading ? (
          <p>Carregando...</p>
        ) : users.length === 0 ? (
          <p style={{ color: 'var(--text-light)' }}>
            Nenhum usuário encontrado.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <Link to={`/users/${user.id}`}>
                        {user.nome || user.email}
                      </Link>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.is_staff ? 'badge-warning' : 'badge-info'}`}>
                        {user.is_staff ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {user.data_criacao ? new Date(user.data_criacao).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td>
                      <div className="actions">
                        <Link to={`/users/${user.id}`} className="action-btn" title="Editar">
                          ✏️
                        </Link>
                        <button
                          className="action-btn"
                          onClick={() => handleDelete(user.id)}
                          title="Desativar"
                        >
                          🚫
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserList
