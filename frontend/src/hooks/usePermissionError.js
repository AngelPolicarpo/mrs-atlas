/**
 * Hook para escutar erros de permissão (403) disparados pelo interceptor da API.
 * 
 * Uso:
 *   const { error, clearError } = usePermissionError()
 *   
 *   // Mostrar toast/snackbar quando error mudar
 *   useEffect(() => {
 *     if (error) {
 *       toast.error(error)
 *       clearError()
 *     }
 *   }, [error])
 */

import { useState, useEffect, useCallback } from 'react'

export function usePermissionError() {
  const [error, setError] = useState(null)
  
  useEffect(() => {
    function handlePermissionDenied(event) {
      const { message } = event.detail
      setError(message)
    }
    
    window.addEventListener('atlas:permission-denied', handlePermissionDenied)
    
    return () => {
      window.removeEventListener('atlas:permission-denied', handlePermissionDenied)
    }
  }, [])
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  return { error, clearError }
}

export default usePermissionError
