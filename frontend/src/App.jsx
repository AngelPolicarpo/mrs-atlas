import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pesquisa from './pages/Pesquisa'
import TitularList from './pages/TitularList'
import TitularForm from './pages/TitularForm'
import DependenteList from './pages/DependenteList'
import DependenteForm from './pages/DependenteForm'
import EmpresaList from './pages/EmpresaList'
import EmpresaForm from './pages/EmpresaForm'
import Configuracoes from './pages/Configuracoes'
import UserList from './pages/UserList'
import UserForm from './pages/UserForm'

// Componente para rotas protegidas
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Carregando...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
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
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="pesquisa" element={<Pesquisa />} />
            <Route path="titulares" element={<TitularList />} />
            <Route path="titulares/new" element={<TitularForm />} />
            <Route path="titulares/:id" element={<TitularForm />} />
            <Route path="dependentes" element={<DependenteList />} />
            <Route path="dependentes/new" element={<DependenteForm />} />
            <Route path="dependentes/:id" element={<DependenteForm />} />
            <Route path="empresas" element={<EmpresaList />} />
            <Route path="empresas/new" element={<EmpresaForm />} />
            <Route path="empresas/:id" element={<EmpresaForm />} />
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
