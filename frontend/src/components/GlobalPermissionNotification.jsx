/**
 * Componente de notificação global para erros de permissão.
 * 
 * Escuta eventos 'atlas:permission-denied' e exibe um banner 
 * temporário com a mensagem de erro.
 * 
 * Uso: Incluir uma vez no App.jsx
 *   <GlobalPermissionNotification />
 */

import { useState, useEffect } from 'react'
import './GlobalPermissionNotification.css'

export function GlobalPermissionNotification() {
  const [notification, setNotification] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    function handlePermissionDenied(event) {
      const { message } = event.detail
      setNotification(message)
      setIsVisible(true)
      
      // Auto-hide após 5 segundos
      setTimeout(() => {
        setIsVisible(false)
        // Limpa após animação
        setTimeout(() => setNotification(null), 300)
      }, 3000)
    }
    
    window.addEventListener('atlas:permission-denied', handlePermissionDenied)
    
    return () => {
      window.removeEventListener('atlas:permission-denied', handlePermissionDenied)
    }
  }, [])
  
  if (!notification) {
    return null
  }
  
  return (
    <div 
      className={`global-permission-notification ${isVisible ? 'visible' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="notification-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="notification-content">
        <span>{notification}</span>
      </div>
      <button 
        className="notification-close"
        onClick={() => setIsVisible(false)}
        aria-label="Fechar notificação"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

export default GlobalPermissionNotification
