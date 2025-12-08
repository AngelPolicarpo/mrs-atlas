import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../img/oie_ADRZD4MM25hi.png'

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }
  
  return (
    <div className="layout">
      {/* Hamburger Menu Button */}
      <button 
        className="hamburger-menu" 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img style={{ width: '30px', height: '30px', marginRight: '10px' }} src={logo} alt="MRS Logo" />
          <h1 style={{ marginTop: '10px' }} className="auth-title">Atlas</h1>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/" end onClick={closeSidebar}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/pesquisa" onClick={closeSidebar}>
            🔍 Pesquisa
          </NavLink>
          <NavLink to="/titulares" onClick={closeSidebar}>
            👤 Titulares
          </NavLink>
          <NavLink to="/dependentes" onClick={closeSidebar}>
            👨‍👩‍👧 Dependentes
          </NavLink>
          <NavLink to="/empresas" onClick={closeSidebar}>
            🏢 Empresas
          </NavLink>
          <NavLink to="/configuracoes" onClick={closeSidebar}>
            ⚙️ Configurações
          </NavLink>
          <NavLink to="/users" onClick={closeSidebar}>
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
