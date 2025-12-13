import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'

/**
 * Context para gerenciamento de permissões.
 * 
 * Modelo Simplificado:
 * - Usuário escolhe apenas o SISTEMA
 * - Departamento é auto-selecionado pelo CARGO MAIS ALTO
 * - Permissões são do cargo mais alto no sistema
 * 
 * Estrutura de permissões do backend:
 * {
 *   "prazos": {
 *     "consular": { "cargo": "gestor", "permissoes": [...] },
 *     "juridico": { "cargo": "consultor", "permissoes": [...] }
 *   }
 * }
 */
const PermissionContext = createContext(null)

// Chave para localStorage
const STORAGE_KEY_SISTEMA = 'active_sistema'

// Hierarquia de cargos (maior número = mais permissões)
const CARGO_HIERARCHY = {
  consultor: 1,
  gestor: 2,
  diretor: 3,
}

/**
 * Obtém sistema salvo do localStorage
 */
function getStoredSistema() {
  try {
    return localStorage.getItem(STORAGE_KEY_SISTEMA)
  } catch {
    return null
  }
}

/**
 * Salva sistema no localStorage
 */
function setStoredSistema(sistema) {
  try {
    if (sistema) {
      localStorage.setItem(STORAGE_KEY_SISTEMA, sistema)
    } else {
      localStorage.removeItem(STORAGE_KEY_SISTEMA)
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function PermissionProvider({ children, user }) {
  // Extrair dados do usuário
  const permissoes = user?.permissoes || {}
  const sistemasDisponiveis = user?.sistemas_disponiveis || []
  const isSuperuser = user?.is_superuser || false
  
  // Permissões Django (app.model: {view, add, change, delete})
  const djangoPermissions = user?.permissoes_django || {}
  // Lista simplificada de permissões do cargo
  const cargoPermissions = user?.permissoes_lista || []

  // Inicializar sistema ativo
  const [activeSistema, setActiveSistemaState] = useState(() => {
    const stored = getStoredSistema()
    
    // Verificar se o sistema salvo está disponível para o usuário
    if (stored && sistemasDisponiveis.some(s => s.codigo === stored)) {
      return stored
    }
    
    // Se só tem um sistema, usar ele
    if (sistemasDisponiveis.length === 1) {
      return sistemasDisponiveis[0].codigo
    }
    
    // Múltiplos sistemas: não selecionar automaticamente
    return null
  })

  /**
   * Determina o departamento com cargo mais alto no sistema ativo
   * (auto-seleção baseada na hierarquia de cargos)
   */
  const activeDepartamento = useMemo(() => {
    if (!activeSistema) return null
    
    const sistemaPerms = permissoes[activeSistema]
    if (!sistemaPerms) return null
    
    // Encontrar o departamento com cargo mais alto
    let melhorDept = null
    let melhorNivel = 0
    
    for (const [deptCode, deptInfo] of Object.entries(sistemaPerms)) {
      const nivel = CARGO_HIERARCHY[deptInfo.cargo] || 0
      if (nivel > melhorNivel) {
        melhorNivel = nivel
        melhorDept = deptCode
      }
    }
    
    return melhorDept
  }, [activeSistema, permissoes])

  /**
   * Departamentos disponíveis no sistema ativo
   */
  const departamentosNoSistemaAtivo = useMemo(() => {
    if (!activeSistema) return []
    const sistemaInfo = sistemasDisponiveis.find(s => s.codigo === activeSistema)
    return sistemaInfo?.departamentos || []
  }, [activeSistema, sistemasDisponiveis])

  /**
   * Muda o sistema ativo
   * @param {string} sistemaCode - Código do sistema
   */
  const setActiveSistema = useCallback((sistemaCode) => {
    setActiveSistemaState(sistemaCode)
    setStoredSistema(sistemaCode)
  }, [])

  /**
   * Verifica se o usuário tem permissão para uma ação no sistema ativo.
   * Usa as permissões do cargo mais alto (departamento auto-selecionado).
   * 
   * @param {string} action - Ação: 'view', 'add', 'change', 'delete', 'export', 'admin'
   * @param {string|null} sistemaCode - Sistema (usa o ativo se não informado)
   */
  const hasPermission = useCallback((action, sistemaCode = null) => {
    // Superuser tem todas as permissões
    if (isSuperuser) return true

    const sistema = sistemaCode || activeSistema
    if (!sistema) return false

    // Buscar permissões do sistema
    const sistemaPerms = permissoes[sistema]
    if (!sistemaPerms) return false
    
    // Verificar se algum departamento no sistema tem a permissão
    // (usa o cargo mais alto disponível)
    for (const deptPerms of Object.values(sistemaPerms)) {
      if (deptPerms.permissoes?.includes(action)) {
        return true
      }
    }

    return false
  }, [isSuperuser, activeSistema, permissoes])

  /**
   * Verifica se o usuário tem permissão Django para um modelo específico.
   * Usa as permissões do cargo via Django Groups.
   * 
   * @param {string} app - App Django (ex: 'titulares', 'empresa')
   * @param {string} model - Modelo (ex: 'titular', 'dependente')
   * @param {string} action - Ação: 'view', 'add', 'change', 'delete'
   */
  const hasDjangoPermission = useCallback((app, model, action) => {
    // Superuser tem todas as permissões
    if (isSuperuser || djangoPermissions?.is_superuser) return true
    
    // Verificar nas permissões Django detalhadas
    const appPerms = djangoPermissions[app]
    if (appPerms?.[model]?.[action]) {
      return true
    }
    
    // Fallback: verificar nas permissões do cargo
    return cargoPermissions.includes(action)
  }, [isSuperuser, djangoPermissions, cargoPermissions])

  /**
   * Verifica se o usuário tem acesso a um sistema
   */
  const hasSistemaAccess = useCallback((sistemaCode) => {
    if (isSuperuser) return true
    return sistemasDisponiveis.some(s => s.codigo === sistemaCode)
  }, [isSuperuser, sistemasDisponiveis])

  /**
   * Helpers para permissões comuns (sistema ativo ou especificado)
   */
  const canView = useCallback(
    (sistema = null) => hasPermission('view', sistema), 
    [hasPermission]
  )
  const canAdd = useCallback(
    (sistema = null) => hasPermission('add', sistema), 
    [hasPermission]
  )
  const canEdit = useCallback(
    (sistema = null) => hasPermission('change', sistema), 
    [hasPermission]
  )
  const canDelete = useCallback(
    (sistema = null) => hasPermission('delete', sistema), 
    [hasPermission]
  )
  const canExport = useCallback(
    (sistema = null) => hasPermission('export', sistema), 
    [hasPermission]
  )
  const isAdmin = useCallback(
    (sistema = null) => hasPermission('admin', sistema), 
    [hasPermission]
  )

  /**
   * Helpers para permissões Django (modelo específico)
   */
  const canViewModel = useCallback(
    (app, model) => hasDjangoPermission(app, model, 'view'),
    [hasDjangoPermission]
  )
  const canAddModel = useCallback(
    (app, model) => hasDjangoPermission(app, model, 'add'),
    [hasDjangoPermission]
  )
  const canEditModel = useCallback(
    (app, model) => hasDjangoPermission(app, model, 'change'),
    [hasDjangoPermission]
  )
  const canDeleteModel = useCallback(
    (app, model) => hasDjangoPermission(app, model, 'delete'),
    [hasDjangoPermission]
  )

  /**
   * Retorna o cargo mais alto do usuário no sistema ativo
   */
  const currentCargo = useMemo(() => {
    if (!activeSistema || !activeDepartamento) return null
    
    const sistemaPerms = permissoes[activeSistema]
    if (!sistemaPerms) return null
    
    const deptPerms = sistemaPerms[activeDepartamento]
    return deptPerms ? {
      codigo: deptPerms.cargo,
      nome: deptPerms.cargo_nome,
      permissoes: deptPerms.permissoes,
    } : null
  }, [activeSistema, activeDepartamento, permissoes])

  /**
   * Informações do sistema ativo
   */
  const activeSistemaInfo = useMemo(() => {
    if (!activeSistema) return null
    return sistemasDisponiveis.find(s => s.codigo === activeSistema) || null
  }, [activeSistema, sistemasDisponiveis])

  /**
   * Flags de estado
   */
  const needsSistemaSelection = useMemo(() => {
    return sistemasDisponiveis.length > 1 && !activeSistema
  }, [sistemasDisponiveis, activeSistema])

  const hasCompleteContext = useMemo(() => {
    return !!activeSistema
  }, [activeSistema])

  const hasSingleSistema = useMemo(() => {
    return sistemasDisponiveis.length === 1
  }, [sistemasDisponiveis])

  /**
   * Verifica se o usuário tem acesso a ALGUM sistema
   * Usuários sem nenhum vínculo não devem acessar o sistema
   */
  const hasAccess = useMemo(() => {
    // Superuser sempre tem acesso
    if (isSuperuser) return true
    // Usuário precisa ter pelo menos um sistema disponível
    return sistemasDisponiveis.length > 0
  }, [isSuperuser, sistemasDisponiveis])

  // Efeito para auto-selecionar quando há apenas um sistema
  useEffect(() => {
    if (!activeSistema && sistemasDisponiveis.length === 1) {
      const sistema = sistemasDisponiveis[0]
      setActiveSistema(sistema.codigo)
    }
  }, [sistemasDisponiveis, activeSistema, setActiveSistema])

  const value = {
    // Estado do contexto ativo
    activeSistema,
    activeDepartamento, // Auto-selecionado pelo cargo mais alto
    activeSistemaInfo,
    currentCargo,
    
    // Dados do usuário
    permissoes,
    sistemasDisponiveis,
    departamentosNoSistemaAtivo,
    isSuperuser,
    
    // Permissões Django
    djangoPermissions,
    cargoPermissions,
    
    // Flags de estado
    needsSistemaSelection,
    hasCompleteContext,
    hasSingleSistema,
    hasAccess,
    
    // Ações
    setActiveSistema,
    
    // Verificações de permissão (sistema)
    hasPermission,
    hasSistemaAccess,
    canView,
    canAdd,
    canEdit,
    canDelete,
    canExport,
    isAdmin,
    
    // Verificações de permissão (modelo Django)
    hasDjangoPermission,
    canViewModel,
    canAddModel,
    canEditModel,
    canDeleteModel,
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

/**
 * Hook para acessar o contexto de permissões
 */
export function usePermissions() {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions deve ser usado dentro de PermissionProvider')
  }
  return context
}

/**
 * Hook simplificado para verificar permissão específica
 * @param {string} action - Ação a verificar
 * @param {string|null} sistema - Sistema (opcional, usa o ativo)
 */
export function useHasPermission(action, sistema = null) {
  const { hasPermission } = usePermissions()
  return hasPermission(action, sistema)
}

/**
 * Hook para obter o contexto ativo (sistema)
 */
export function useActiveContext() {
  const { 
    activeSistema, 
    activeDepartamento, // Auto-selecionado
    activeSistemaInfo,
    currentCargo,
    setActiveSistema, 
    hasCompleteContext,
  } = usePermissions()
  
  return { 
    activeSistema, 
    activeDepartamento,
    activeSistemaInfo,
    currentCargo,
    setActiveSistema, 
    hasCompleteContext,
  }
}

/**
 * Hook para verificar se precisa selecionar sistema
 */
export function useNeedsSelection() {
  const { 
    needsSistemaSelection, 
    hasCompleteContext,
    hasAccess,
  } = usePermissions()
  
  return { 
    needsSistemaSelection, 
    needsAnySelection: needsSistemaSelection,
    hasCompleteContext,
    hasAccess,
  }
}
