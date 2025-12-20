/**
 * Configuração de rotas por sistema.
 * Define quais páginas/menus cada sistema deve exibir.
 */

export const SISTEMA_ROUTES = {
  // Sistema de Prazos - Gestão de titulares, dependentes, vínculos
  prazos: {
    nome: 'Sistema de Prazos',
    rotas: [
      { path: '/', label: 'Dashboard', icon: '📊', end: true },
      { path: '/pesquisa', label: 'Pesquisa', icon: '🔍' },
      { path: '/titulares', label: 'Titulares', icon: '👤' },
      { path: '/dependentes', label: 'Dependentes', icon: '👨‍👩‍👧' },
      { path: '/empresas', label: 'Empresas', icon: '🏢' },
    ],
    // Rotas de admin (só aparecem para quem tem permissão 'admin')
    rotasAdmin: [
      { path: '/configuracoes', label: 'Configurações', icon: '⚙️' },
      { path: '/users', label: 'Usuários', icon: '🔑' },
    ],
  },

  // Sistema de Ordens de Serviço - Gestão de OS e atendimentos
  ordem_servico: {
    nome: 'Ordens de Serviço',
    rotas: [
      { path: '/', label: 'Dashboard', icon: '📊', end: true },
      { path: '/contratos', label: 'Contratos', icon: '📝' },
      { path: '/ordens-servico', label: 'Ordens de Serviço', icon: '📋' },
      { path: '/empresas', label: 'Empresas', icon: '🏢' },
      { path: '/titulares', label: 'Titulares', icon: '👤' },
    ],
    rotasAdmin: [
      { path: '/configuracoes', label: 'Configurações', icon: '⚙️' },
      { path: '/users', label: 'Usuários', icon: '🔑' },
    ],
  },
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
 * @returns {boolean}
 */
export function isRotaDisponivel(sistemaCodigo, path) {
  const config = SISTEMA_ROUTES[sistemaCodigo]
  
  if (!config) return false
  
  const todasRotas = [...config.rotas, ...(config.rotasAdmin || [])]
  return todasRotas.some(r => r.path === path)
}

export default SISTEMA_ROUTES
