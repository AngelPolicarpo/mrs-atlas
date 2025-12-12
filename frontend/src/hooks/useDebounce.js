import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/**
 * useDebounce - Hook que retorna um valor com debounce
 * 
 * Princípios SOLID aplicados:
 * - Single Responsibility: Este hook tem apenas uma responsabilidade - atrasar a atualização de um valor
 * - Open/Closed: O hook é fechado para modificação mas aberto para extensão via parâmetros
 * - Liskov Substitution: Pode ser usado em qualquer lugar que precise de debounce de valores
 * - Interface Segregation: Interface mínima - apenas value e delay
 * - Dependency Inversion: Não depende de implementações concretas
 * 
 * @param {any} value - O valor a ser "debounced"
 * @param {number} delay - O tempo de delay em milissegundos (padrão: 300ms)
 * @returns {any} - O valor com debounce aplicado
 * 
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * 
 * useEffect(() => {
 *   // Este efeito só executa 300ms após o usuário parar de digitar
 *   fetchData(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Configura o timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: cancela o timer se o valor mudar antes do delay
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * useDebouncedCallback - Hook que retorna uma função com debounce
 * 
 * Princípios SOLID aplicados:
 * - Single Responsibility: Cria uma versão debounced de qualquer callback
 * - Open/Closed: Aceita qualquer função como parâmetro
 * - Interface Segregation: Interface mínima e clara
 * 
 * @param {Function} callback - A função a ser "debounced"
 * @param {number} delay - O tempo de delay em milissegundos (padrão: 300ms)
 * @param {Array} dependencies - Dependências para recriar o callback (similar ao useCallback)
 * @returns {Function} - A função com debounce aplicado
 * 
 * @example
 * const debouncedSearch = useDebouncedCallback((query) => {
 *   fetchResults(query)
 * }, 300, [])
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebouncedCallback(callback, delay = 300, dependencies = []) {
  const timeoutRef = useRef(null)
  const callbackRef = useRef(callback)

  // Mantém a referência do callback atualizada
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup quando o componente desmonta
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Retorna uma função memoizada que faz o debounce
  const debouncedCallback = useCallback((...args) => {
    // Cancela qualquer timer pendente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Configura novo timer
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay, ...dependencies])

  return debouncedCallback
}

/**
 * useDebouncedState - Hook que combina useState com debounce
 * 
 * Retorna tanto o valor imediato (para UI) quanto o valor debounced (para API calls)
 * 
 * @param {any} initialValue - O valor inicial
 * @param {number} delay - O tempo de delay em milissegundos (padrão: 300ms)
 * @returns {Array} - [immediateValue, debouncedValue, setImmediateValue]
 * 
 * @example
 * const [search, debouncedSearch, setSearch] = useDebouncedState('', 300)
 * 
 * // search atualiza imediatamente (para mostrar no input)
 * // debouncedSearch atualiza com delay (para fazer API call)
 * 
 * useEffect(() => {
 *   fetchData(debouncedSearch)
 * }, [debouncedSearch])
 * 
 * <input 
 *   value={search} 
 *   onChange={(e) => setSearch(e.target.value)} 
 * />
 */
export function useDebouncedState(initialValue, delay = 300) {
  const [value, setValue] = useState(initialValue)
  const debouncedValue = useDebounce(value, delay)

  return useMemo(
    () => [value, debouncedValue, setValue],
    [value, debouncedValue]
  )
}

// Export padrão para uso mais comum
export default useDebounce
