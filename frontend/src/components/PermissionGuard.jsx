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

export { 
  PermissionGuard, 
  PermissionButton, 
  PermissionLink, 
  PermissionDisable,
  SistemaGuard,
  ContextGuard,
}
export default PermissionGuard
