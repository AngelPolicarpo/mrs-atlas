import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PermissionProvider, usePermissions, useNeedsSelection } from './context/PermissionContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pesquisa from './pages/Pesquisa'
import PesquisaOS from './pages/PesquisaOS'
import TitularList from './pages/TitularList'
import TitularForm from './pages/TitularForm'
import DependenteList from './pages/DependenteList'
import DependenteForm from './pages/DependenteForm'
import EmpresaList from './pages/EmpresaList'
import EmpresaForm from './pages/EmpresaForm'
import OrdemServicoList from './pages/OrdemServicoList'
import OrdemServicoForm from './pages/OrdemServicoForm'
import Configuracoes from './pages/Configuracoes'
import UserList from './pages/UserList'
import UserForm from './pages/UserForm'
import SystemSelector from './pages/SystemSelector'
import NoAccess from './pages/NoAccess'
import ValidarDocumento from './pages/ValidarDocumento'

/**
 * Wrapper que fornece o PermissionContext após autenticação
 */
function PermissionWrapper({ children }) {
  const { user } = useAuth()
  return (
    <PermissionProvider user={user}>
      {children}
    </PermissionProvider>
  )
}

/**
 * Componente que verifica se precisa exibir seleção de sistema/departamento
 * 
 * Fluxo:
 * 1. Se NÃO tem acesso a nenhum sistema -> mostra NoAccess
 * 2. Se precisa selecionar sistema -> mostra SystemSelector
 * 3. Se contexto completo -> mostra children
 */
function SystemCheck({ children }) {
  const { needsAnySelection, hasAccess } = useNeedsSelection()

  // Usuário sem nenhum vínculo/sistema disponível
  if (!hasAccess) {
    return <NoAccess />
  }

  // Se precisa selecionar sistema, exibe a tela de seleção
  if (needsAnySelection) {
    return <SystemSelector />
  }

  return children
}

// Componente para rotas protegidas
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Carregando...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <PermissionWrapper>
      <SystemCheck>
        {children}
      </SystemCheck>
    </PermissionWrapper>
  )
}

// Componente para rotas públicas (redireciona se já logado)
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Carregando...</div>
  }
  
  if (user) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          {/* Página de validação de documentos (pública) */}
          <Route path="/validar-documento" element={<ValidarDocumento />} />
          <Route path="/validar-documento/:documentoId" element={<ValidarDocumento />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="pesquisa" element={<Pesquisa />} />
            <Route path="pesquisa-os" element={<PesquisaOS />} />
            <Route path="titulares" element={<TitularList />} />
            <Route path="titulares/new" element={<TitularForm />} />
            <Route path="titulares/:id" element={<TitularForm />} />
            <Route path="dependentes" element={<DependenteList />} />
            <Route path="dependentes/new" element={<DependenteForm />} />
            <Route path="dependentes/:id" element={<DependenteForm />} />
            <Route path="empresas" element={<EmpresaList />} />
            <Route path="empresas/new" element={<EmpresaForm />} />
            <Route path="empresas/:id" element={<EmpresaForm />} />
            <Route path="ordens-servico" element={<OrdemServicoList />} />
            <Route path="ordens-servico/new" element={<OrdemServicoForm />} />
            <Route path="ordens-servico/:id" element={<OrdemServicoForm />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="users" element={<UserList />} />
            <Route path="users/new" element={<UserForm />} />
            <Route path="users/:id" element={<UserForm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
