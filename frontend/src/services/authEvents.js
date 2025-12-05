// Eventos customizados para autenticação
// Este arquivo existe para evitar dependências circulares entre api.js e AuthContext.jsx

export const SESSION_EXPIRED_EVENT = 'atlas-session-expired'

// Função para disparar evento de sessão expirada (usada pelo interceptor do axios)
export function dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}
