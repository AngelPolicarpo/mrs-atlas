/**
 * Componente de página protegida por permissões.
 * 
 * Bloqueia acesso a páginas inteiras e exibe uma mensagem de acesso negado.
 * Diferente do PermissionGuard que simplesmente oculta conteúdo, este
 * componente mostra uma interface completa de "acesso negado".
 * 
 * Uso:
 *   <ProtectedPage permission="admin">
 *     <ConfiguracoesContent />
 *   </ProtectedPage>
 */

import { usePermissions } from '../context/PermissionContext'
import { useNavigate } from 'react-router-dom'
import { PERMISSION_MESSAGES } from './PermissionGuard'
import './ProtectedPage.css'

function ProtectedPage({
  permission,
  sistema = null,
  title = 'Acesso Restrito',
  message = null,
  showBackButton = true,
  redirectTo = null,
  children,
}) {
  const { hasPermission, cargoAtivo, activeSystem } = usePermissions()
  const navigate = useNavigate()
  
  const allowed = hasPermission(permission, sistema)
  
  if (allowed) {
    return children
  }
  
  const displayMessage = message || PERMISSION_MESSAGES[permission] || PERMISSION_MESSAGES.default
  
  function handleBack() {
    if (redirectTo) {
      navigate(redirectTo)
    } else {
      navigate(-1)
    }
  }
  
  return (
    <div className="protected-page-denied">
      <div className="denied-container">
        <div className="denied-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h2 className="denied-title">{title}</h2>
        <p className="denied-message">{displayMessage}</p>
        
        {cargoAtivo && (
          <p className="denied-info">
            Seu cargo atual: <strong>{cargoAtivo}</strong>
            {activeSystem && <> • Sistema: <strong>{activeSystem.nome}</strong></>}
          </p>
        )}
        
        {showBackButton && (
          <button className="btn btn-secondary denied-back" onClick={handleBack}>
            ← Voltar
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Página protegida que exige permissão de admin
 */
function AdminPage({ children, title = 'Área Administrativa', ...props }) {
  return (
    <ProtectedPage 
      permission="admin" 
      title={title}
      message="Esta área é restrita a administradores do sistema."
      {...props}
    >
      {children}
    </ProtectedPage>
  )
}

/**
 * Página protegida que exige permissão de gestor ou superior
 */
function GestorPage({ children, title = 'Área de Gestão', ...props }) {
  return (
    <ProtectedPage 
      permission="add" 
      title={title}
      message="Esta área é restrita a gestores e administradores."
      {...props}
    >
      {children}
    </ProtectedPage>
  )
}

export { ProtectedPage, AdminPage, GestorPage }
export default ProtectedPage
