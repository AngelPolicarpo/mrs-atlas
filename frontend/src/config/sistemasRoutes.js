/**
 * Configuração de rotas por sistema.
 * Define quais páginas/menus cada sistema deve exibir.
 * 
 * IMPORTANTE: Este arquivo define o isolamento de rotas por sistema.
 * Rotas exclusivas só podem ser acessadas por usuários com acesso ao sistema.
 */

export const SISTEMA_ROUTES = {
  // Sistema de Prazos - Gestão de titulares, dependentes, vínculos
  prazos: {
    nome: 'Sistema de Prazos',
    rotas: [
      { path: '/', label: 'Dashboard', icon: '📊', end: true, shared: true },
      { path: '/pesquisa', label: 'Pesquisa', icon: '🔍', exclusive: true },
      { path: '/titulares', label: 'Titulares', icon: '👤', shared: true },
      { path: '/dependentes', label: 'Dependentes', icon: '👨‍👩‍👧', shared: true },
      { path: '/empresas', label: 'Empresas', icon: '🏢', shared: true },
    ],
    // Rotas de admin (só aparecem para quem tem permissão 'admin')
    rotasAdmin: [
      { path: '/configuracoes', label: 'Configurações', icon: '⚙️', shared: true },
      { path: '/users', label: 'Usuários', icon: '🔑', shared: true },
    ],
    // Rotas exclusivas deste sistema (não aparecem em outros)
    rotasExclusivas: ['/pesquisa'],
  },

  // Sistema de Ordens de Serviço - Gestão de OS e atendimentos
  ordem_servico: {
    nome: 'Ordens de Serviço',
    rotas: [
      { path: '/', label: 'Dashboard', icon: '📊', end: true, shared: true },
      { path: '/ordens-servico', label: 'Ordens de Serviço', icon: '📋', exclusive: true },
      { path: '/pesquisa-os', label: 'Pesquisa OS', icon: '🔍', exclusive: true },
      { path: '/empresas', label: 'Empresas', icon: '🏢', shared: true },
      { path: '/titulares', label: 'Titulares', icon: '👤', shared: true },
    ],
    rotasAdmin: [
      { path: '/configuracoes', label: 'Configurações', icon: '⚙️', shared: true },
      { path: '/users', label: 'Usuários', icon: '🔑', shared: true },
    ],
    // Rotas exclusivas deste sistema
    rotasExclusivas: ['/ordens-servico', '/pesquisa-os'],
  },
}

/**
 * Mapeamento de rotas exclusivas para seus sistemas
 * Usado para verificação rápida de acesso
 */
export const EXCLUSIVE_ROUTE_MAP = {
  // Sistema de Prazos
  '/pesquisa': 'prazos',
  '/dependentes': 'prazos',  // Dependentes é exclusivo de prazos
  
  // Sistema de Ordem de Serviço
  '/ordens-servico': 'ordem_servico',
  '/pesquisa-os': 'ordem_servico',
}

/**
 * Rotas compartilhadas entre sistemas (não requerem verificação de sistema)
 */
export const SHARED_ROUTES = [
  '/',
  '/titulares',
  '/empresas',
  '/configuracoes',
  '/users',
]

/**
 * Verifica se uma rota requer um sistema específico
 * @param {string} path - Caminho da rota
 * @returns {string|null} Código do sistema necessário ou null se compartilhada
 */
export function getRequiredSistema(path) {
  // Normalizar path (remover parâmetros dinâmicos)
  const basePath = '/' + path.split('/').filter(Boolean)[0]
  
  // Verificar se é rota exclusiva
  if (EXCLUSIVE_ROUTE_MAP[basePath]) {
    return EXCLUSIVE_ROUTE_MAP[basePath]
  }
  
  // Verificar rotas com IDs (ex: /ordens-servico/123)
  for (const [route, sistema] of Object.entries(EXCLUSIVE_ROUTE_MAP)) {
    if (path.startsWith(route)) {
      return sistema
    }
  }
  
  return null // Rota compartilhada
}

/**
 * Verifica se o usuário pode acessar uma rota
 * @param {string} path - Caminho da rota
 * @param {string} activeSistema - Sistema ativo do usuário
 * @param {Array} sistemasDisponiveis - Sistemas que o usuário tem acesso
 * @returns {boolean}
 */
export function canAccessRoute(path, activeSistema, sistemasDisponiveis) {
  const requiredSistema = getRequiredSistema(path)
  
  // Rota compartilhada - sempre permite
  if (!requiredSistema) {
    return true
  }
  
  // Verificar se o usuário tem acesso ao sistema necessário
  const temAcesso = sistemasDisponiveis.some(s => s.codigo === requiredSistema)
  
  // Verificar se o sistema ativo é o correto
  const sistemaCorreto = activeSistema === requiredSistema
  
  return temAcesso && sistemaCorreto
}

/**
 * Retorna as rotas disponíveis para um sistema
 * @param {string} sistemaCodigo - Código do sistema
 * @param {boolean} isAdmin - Se o usuário tem permissão de admin
 * @returns {Array} Lista de rotas
 */
export function getRotasSistema(sistemaCodigo, isAdmin = false) {
  const config = SISTEMA_ROUTES[sistemaCodigo]
  
  if (!config) {
    // Sistema não configurado, retorna rotas padrão
    return [
      { path: '/', label: 'Dashboard', icon: '📊', end: true },
    ]
  }
  
  const rotas = [...config.rotas]
  
  if (isAdmin && config.rotasAdmin) {
    rotas.push(...config.rotasAdmin)
  }
  
  return rotas
}

/**
 * Verifica se uma rota está disponível para um sistema
 * @param {string} sistemaCodigo - Código do sistema
 * @param {string} path - Caminho da rota
 * @param {boolean} isAdmin - Se o usuário é admin
 * @returns {boolean}
 */
export function isRotaDisponivel(sistemaCodigo, path, isAdmin = false) {
  const config = SISTEMA_ROUTES[sistemaCodigo]
  
  if (!config) return false
  
  const todasRotas = [...config.rotas]
  if (isAdmin && config.rotasAdmin) {
    todasRotas.push(...config.rotasAdmin)
  }
  
  // Normalizar path
  const basePath = '/' + path.split('/').filter(Boolean)[0]
  
  return todasRotas.some(r => {
    const rotaBase = '/' + r.path.split('/').filter(Boolean)[0]
    return rotaBase === basePath || r.path === path
  })
}

export default SISTEMA_ROUTES
