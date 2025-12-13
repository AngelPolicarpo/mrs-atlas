import { usePermissions } from '../context/PermissionContext'

/**
 * Componente que protege conteúdo baseado em permissões.
 * 
 * Modelo Simplificado: Sistema × Ação
 * (Departamento é auto-selecionado pelo cargo mais alto)
 * 
 * Uso:
 *   // Usa sistema ativo
 *   <PermissionGuard permission="add">
 *     <button>Criar Novo</button>
 *   </PermissionGuard>
 * 
 *   // Especifica sistema
 *   <PermissionGuard permission="delete" sistema="prazos">
 *     <button>Excluir</button>
 *   </PermissionGuard>
 * 
 * Props:
 *   permission: 'view' | 'add' | 'change' | 'delete' | 'export' | 'admin'
 *   sistema: Código do sistema (opcional, usa o ativo)
 *   fallback: Elemento a renderizar se não tiver permissão (opcional)
 *   children: Conteúdo a proteger
 */
function PermissionGuard({ 
  permission, 
  sistema = null, 
  fallback = null, 
  children 
}) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission, sistema)) {
    return fallback
  }

  return children
}

/**
 * Botão que só aparece se o usuário tiver permissão
 */
function PermissionButton({ 
  permission, 
  sistema = null, 
  children, 
  ...buttonProps 
}) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission, sistema)) {
    return null
  }

  return <button {...buttonProps}>{children}</button>
}

/**
 * Link que só aparece se o usuário tiver permissão
 */
function PermissionLink({ 
  permission, 
  sistema = null, 
  children, 
  component: Component, 
  ...linkProps 
}) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission, sistema)) {
    return null
  }

  return <Component {...linkProps}>{children}</Component>
}

/**
 * Wrapper que desabilita o conteúdo se não tiver permissão
 */
function PermissionDisable({ 
  permission, 
  sistema = null, 
  children 
}) {
  const { hasPermission } = usePermissions()
  const allowed = hasPermission(permission, sistema)

  return (
    <div style={{ opacity: allowed ? 1 : 0.5, pointerEvents: allowed ? 'auto' : 'none' }}>
      {children}
    </div>
  )
}

/**
 * Guard que verifica acesso a um sistema específico
 */
function SistemaGuard({ codigo, fallback = null, children }) {
  const { hasSistemaAccess } = usePermissions()

  if (!hasSistemaAccess(codigo)) {
    return fallback
  }

  return children
}

/**
 * Guard que verifica se o contexto (sistema) está selecionado
 */
function ContextGuard({ fallback = null, children }) {
  const { hasCompleteContext } = usePermissions()

  if (!hasCompleteContext) {
    return fallback
  }

  return children
}

/**
 * Guard que verifica permissão Django para um modelo específico.
 * 
 * Uso:
 *   <ModelPermissionGuard app="titulares" model="titular" action="delete">
 *     <button>Excluir</button>
 *   </ModelPermissionGuard>
 */
function ModelPermissionGuard({ 
  app, 
  model, 
  action, 
  fallback = null, 
  children 
}) {
  const { hasDjangoPermission } = usePermissions()

  if (!hasDjangoPermission(app, model, action)) {
    return fallback
  }

  return children
}

/**
 * Mensagens de permissão negada em português
 */
export const PERMISSION_MESSAGES = {
  view: 'Você não tem permissão para visualizar este recurso.',
  add: 'Você não tem permissão para criar novos registros.',
  change: 'Você não tem permissão para editar este registro.',
  delete: 'Você não tem permissão para excluir este registro.',
  default: 'Você não tem permissão para realizar esta ação.',
}

/**
 * Componente que exibe uma mensagem de permissão negada
 */
function PermissionDeniedMessage({ action, message, className = '' }) {
  const displayMessage = message || PERMISSION_MESSAGES[action] || PERMISSION_MESSAGES.default
  
  return (
    <div className={`flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 ${className}`}>
      <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span>{displayMessage}</span>
    </div>
  )
}

export { 
  PermissionGuard, 
  PermissionButton, 
  PermissionLink, 
  PermissionDisable,
  SistemaGuard,
  ContextGuard,
  ModelPermissionGuard,
  PermissionDeniedMessage,
}
export default PermissionGuard
