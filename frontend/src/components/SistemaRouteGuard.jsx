/**
 * Guard de rota por sistema.
 * 
 * Verifica se o usuário tem acesso ao sistema necessário para a rota atual.
 * Se não tiver, exibe uma página de acesso negado ao sistema.
 * 
 * Este componente deve envolver as rotas protegidas no App.jsx.
 */

import { useLocation, Navigate } from 'react-router-dom'
import { usePermissions } from '../context/PermissionContext'
import { getRequiredSistema, isRotaDisponivel, SISTEMA_ROUTES } from '../config/sistemasRoutes'
import './SistemaRouteGuard.css'

/**
 * Página de acesso negado ao sistema
 */
function SistemaAccessDenied({ requiredSistema, activeSistema, sistemasDisponiveis }) {
  const sistemaInfo = SISTEMA_ROUTES[requiredSistema]
  const sistemaAtualInfo = SISTEMA_ROUTES[activeSistema]
  
  // Verifica se o usuário tem acesso ao sistema necessário
  const temAcessoAoSistema = sistemasDisponiveis.some(s => s.codigo === requiredSistema)
  
  return (
    <div className="sistema-access-denied">
      <div className="denied-container">
        <div className="denied-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h2 className="denied-title">Acesso Negado ao Sistema</h2>
        
        {!temAcessoAoSistema ? (
          <>
            <p className="denied-message">
              Você não tem permissão para acessar o sistema <strong>{sistemaInfo?.nome || requiredSistema}</strong>.
            </p>
            <p className="denied-submessage">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </>
        ) : (
          <>
            <p className="denied-message">
              Esta página pertence ao sistema <strong>{sistemaInfo?.nome || requiredSistema}</strong>.
            </p>
            <p className="denied-submessage">
              Você está atualmente no sistema <strong>{sistemaAtualInfo?.nome || activeSistema}</strong>.
              Para acessar esta página, troque para o sistema correto.
            </p>
          </>
        )}
        
        <div className="denied-info">
          <span className="info-label">Sistema necessário:</span>
          <span className="info-value sistema-badge">
            {sistemaInfo?.nome || requiredSistema}
          </span>
        </div>
        
        {temAcessoAoSistema && (
          <div className="denied-info">
            <span className="info-label">Sistema atual:</span>
            <span className="info-value sistema-badge atual">
              {sistemaAtualInfo?.nome || activeSistema}
            </span>
          </div>
        )}
        
        <div className="denied-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => window.history.back()}
          >
            ← Voltar
          </button>
          {temAcessoAoSistema && (
            <a href="/" className="btn btn-primary">
              Ir para Dashboard
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Guard que verifica acesso ao sistema antes de renderizar a rota
 */
function SistemaRouteGuard({ children }) {
  const location = useLocation()
  const { activeSistema, sistemasDisponiveis, isSuperuser, isAdmin } = usePermissions()
  
  // Superuser tem acesso total
  if (isSuperuser) {
    return children
  }
  
  // Verificar qual sistema a rota atual requer
  const requiredSistema = getRequiredSistema(location.pathname)
  
  // Se a rota é compartilhada (não requer sistema específico), permite
  if (!requiredSistema) {
    // Ainda assim, verificar se a rota está disponível para o sistema ativo
    if (activeSistema && !isRotaDisponivel(activeSistema, location.pathname, isAdmin())) {
      // Rota não está no menu do sistema ativo - pode ser um acesso direto inválido
      return (
        <SistemaAccessDenied 
          requiredSistema={requiredSistema || 'desconhecido'}
          activeSistema={activeSistema}
          sistemasDisponiveis={sistemasDisponiveis}
        />
      )
    }
    return children
  }
  
  // Verificar se o usuário tem acesso ao sistema necessário
  const temAcessoAoSistema = sistemasDisponiveis.some(s => s.codigo === requiredSistema)
  
  // Verificar se o sistema ativo é o correto
  const sistemaCorreto = activeSistema === requiredSistema
  
  // Se não tem acesso ou não está no sistema correto, bloqueia
  if (!temAcessoAoSistema || !sistemaCorreto) {
    return (
      <SistemaAccessDenied 
        requiredSistema={requiredSistema}
        activeSistema={activeSistema}
        sistemasDisponiveis={sistemasDisponiveis}
      />
    )
  }
  
  return children
}

export { SistemaRouteGuard, SistemaAccessDenied }
export default SistemaRouteGuard
