import { useState, useCallback, useRef, useEffect } from 'react'
import { searchCountries, getCountryByName } from '../data/countries'

/**
 * Componente de Autocomplete para países
 * Usa uma lista estática de países com bandeiras (sem chamadas ao backend)
 */
function CountryAutocomplete({
  value,
  onChange,
  onBlur,
  label,
  placeholder = 'Digite para buscar...',
  error,
  required,
  disabled,
  id,
  className = '',
}) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const isSelectingRef = useRef(false) // Flag para evitar race condition

  // Sincroniza o valor do input com o value prop
  useEffect(() => {
    if (value) {
      const country = getCountryByName(value)
      if (country) {
        setInputValue(`${country.flag} ${country.name}`)
      } else {
        setInputValue(value)
      }
    } else {
      setInputValue('')
    }
  }, [value])

  // Handler para mudança no input
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Remove emoji de bandeira para busca
    const cleanedValue = newValue.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '').trim()
    
    if (cleanedValue.length >= 1) {
      const results = searchCountries(cleanedValue, 8)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setHighlightedIndex(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    
    // Limpa o valor selecionado quando o usuário digita
    onChange?.('')
  }, [onChange])

  // Handler para seleção de país
  const handleSelect = useCallback((country) => {
    isSelectingRef.current = true // Marca que está selecionando
    setInputValue(`${country.flag} ${country.name}`)
    onChange?.(country.name)
    setShowSuggestions(false)
    setSuggestions([])
    setHighlightedIndex(-1)
    
    // Reseta a flag após um tempo
    setTimeout(() => {
      isSelectingRef.current = false
    }, 300)
  }, [onChange])

  // Handler para teclas especiais
  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }, [showSuggestions, suggestions, highlightedIndex, handleSelect])

  // Handler para blur
  const handleBlur = useCallback((e) => {
    // Delay para permitir clique na sugestão
    setTimeout(() => {
      // Se está selecionando, não faz nada
      if (isSelectingRef.current) {
        onBlur?.(e)
        return
      }
      
      setShowSuggestions(false)
      setHighlightedIndex(-1)
      
      // Se não tiver valor selecionado, limpa o input
      if (!value && inputValue) {
        // Tenta encontrar o país pelo texto digitado
        const cleanedValue = inputValue.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '').trim()
        const country = getCountryByName(cleanedValue)
        if (country) {
          setInputValue(`${country.flag} ${country.name}`)
          onChange?.(country.name)
        } else {
          // Se digitou algo mas não é um país válido, mantém como texto
          onChange?.(cleanedValue.toUpperCase())
        }
      }
      
      onBlur?.(e)
    }, 200)
  }, [value, inputValue, onChange, onBlur])

  // Handler para foco
  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }, [suggestions])

  return (
    <div className={`form-field ${className}`} style={{ position: 'relative' }}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={`form-input ${error ? 'is-invalid' : ''}`}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="country-suggestions"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            marginTop: '4px',
          }}
        >
          {suggestions.map((country, index) => (
            <div
              key={country.code}
              onMouseDown={(e) => {
                e.preventDefault() // Previne o blur do input
                handleSelect(country)
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: highlightedIndex === index ? 'var(--background)' : 'transparent',
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{country.flag}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{country.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default CountryAutocomplete
