import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../img/oie_ADRZD4MM25hi.png'

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  async function handleLogout() {
    await logout()
    navigate('/login')
  }
  
  return (
    <div className="layout">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img style={{ width: '30px', height: '30px', marginRight: '10px' }} src={logo} alt="MRS Logo" />
          <h1 style={{ marginTop: '10px' }} className="auth-title">Atlas</h1>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/" end>
            📊 Dashboard
          </NavLink>
          <NavLink to="/titulares">
            👤 Titulares
          </NavLink>
          <NavLink to="/dependentes">
            👨‍👩‍👧 Dependentes
          </NavLink>
          <NavLink to="/empresas">
            🏢 Empresas
          </NavLink>
          <NavLink to="/configuracoes">
            ⚙️ Configurações
          </NavLink>
          <NavLink to="/users">
            🔑 Usuários
          </NavLink>
        </nav>
        
        <div className="sidebar-footer">
          <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <strong>{user?.nome || user?.email}</strong>
          </div>
          <button className="btn btn-outline" onClick={handleLogout} style={{ width: '100%' }}>
            Sair
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
