import { useState, useMemo } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermissions, useActiveContext } from '../context/PermissionContext'
import { getRotasSistema } from '../config/sistemasRoutes'
import DepartmentSwitcher from './DepartmentSwitcher'
import logo from '../img/oie_ADRZD4MM25hi.png'

function Layout() {
  const { user, logout } = useAuth()
  const { sistemasDisponiveis, isAdmin } = usePermissions()
  const { activeSistema, activeSistemaInfo, currentCargo } = useActiveContext()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Rotas disponíveis para o sistema ativo
  const rotasDisponiveis = useMemo(() => {
    if (!activeSistema) return []
    const userIsAdmin = isAdmin() || user?.is_superuser
    return getRotasSistema(activeSistema, userIsAdmin)
  }, [activeSistema, isAdmin, user?.is_superuser])
  
  async function handleLogout() {
    // Limpa o contexto ativo ao sair
    localStorage.removeItem('active_sistema')
    localStorage.removeItem('active_departamento')
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
        
        {/* Exibe Sistema ativo e Cargo */}
        {activeSistemaInfo && (
          <div className="sidebar-system-info">
            <span className="system-badge" style={{ '--system-color': activeSistemaInfo.cor }}>
              {activeSistemaInfo.icone} {activeSistemaInfo.nome}
            </span>
            {currentCargo && (
              <span className="cargo-badge-sidebar">
                {currentCargo.nome}
              </span>
            )}
          </div>
        )}
        
        <nav className="sidebar-nav">
          {rotasDisponiveis.map((rota) => (
            <NavLink 
              key={rota.path} 
              to={rota.path} 
              end={rota.end} 
              onClick={closeSidebar}
            >
              {rota.icon} {rota.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          {/* Switcher para trocar de sistema */}
          {sistemasDisponiveis.length > 1 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <DepartmentSwitcher compact showCargo={false} />
            </div>
          )}
          
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
