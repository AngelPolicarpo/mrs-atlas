import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Componente de Autocomplete genérico para buscas
 * Segue o mesmo padrão visual do CountryAutocomplete
 * 
 * Props:
 * - value: valor selecionado (ID ou texto)
 * - displayValue: texto exibido no input
 * - onChange: callback quando seleciona um item (recebe { id, text })
 * - suggestions: array de sugestões do autocomplete
 * - onSearch: callback para buscar sugestões
 * - loading: se está carregando
 * - label: label do campo
 * - placeholder: placeholder do input
 * - getDisplayText: função para extrair texto de exibição de um item
 * - getSubText: função opcional para texto secundário
 * - getId: função para extrair ID de um item
 * - disabled: se está desabilitado
 * - error: mensagem de erro
 * - required: se é obrigatório
 * - id: id do input
 * - className: classes adicionais
 */

function SearchAutocomplete({
  value,
  displayValue = '',
  onChange,
  suggestions = [],
  onSearch,
  loading = false,
  label,
  placeholder = 'Digite para buscar...',
  getDisplayText = (item) => item?.nome || item?.numero || '',
  getSubText = null,
  getId = (item) => item?.id,
  disabled = false,
  error,
  required,
  id,
  className = '',
}) {
  const [inputValue, setInputValue] = useState(displayValue)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const isSelectingRef = useRef(false)

  // Sincroniza o valor do input com displayValue prop
  useEffect(() => {
    setInputValue(displayValue || '')
  }, [displayValue])

  // Handler para mudança no input
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    if (newValue.length >= 1) {
      onSearch?.(newValue)
      setShowSuggestions(true)
      setHighlightedIndex(-1)
    } else {
      setShowSuggestions(false)
    }
    
    // Limpa o valor selecionado quando o usuário digita
    onChange?.({ id: null, text: newValue })
  }, [onChange, onSearch])

  // Handler para seleção de item
  const handleSelect = useCallback((item) => {
    isSelectingRef.current = true
    const text = getDisplayText(item)
    const itemId = getId(item)
    
    setInputValue(text)
    onChange?.({ id: itemId, text })
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    
    setTimeout(() => {
      isSelectingRef.current = false
    }, 300)
  }, [onChange, getDisplayText, getId])

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
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (isSelectingRef.current) return
      
      setShowSuggestions(false)
      setHighlightedIndex(-1)
      
      // Se digitou algo mas não selecionou, tenta encontrar correspondência
      if (inputValue && !value) {
        const match = suggestions.find(
          item => getDisplayText(item).toLowerCase() === inputValue.toLowerCase()
        )
        if (match) {
          handleSelect(match)
        }
      }
    }, 200)
  }, [inputValue, value, suggestions, getDisplayText, handleSelect])

  // Handler para foco
  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }, [suggestions])

  // Scroll para item destacado
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current) {
      const highlighted = suggestionsRef.current.children[highlightedIndex]
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  return (
    <div className={`form-field ${className}`} style={{ position: 'relative' }}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
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
        
        {loading && (
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
          }}>
            ⏳
          </span>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="search-suggestions"
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
          {suggestions.map((item, index) => (
            <div
              key={getId(item) || index}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(item)
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                backgroundColor: highlightedIndex === index ? 'var(--background)' : 'transparent',
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500 }}>
                {getDisplayText(item)}
              </span>
              {getSubText && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {getSubText(item)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showSuggestions && suggestions.length === 0 && inputValue.length >= 2 && !loading && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 12px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            marginTop: '4px',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          Nenhum resultado encontrado
        </div>
      )}
      
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default SearchAutocomplete
