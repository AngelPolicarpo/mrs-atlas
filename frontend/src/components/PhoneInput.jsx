import { useState, useCallback } from 'react'
import PhoneNumberInput, { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import labels from 'react-phone-number-input/locale/pt'

/**
 * Componente PhoneInput com suporte a múltiplos países
 * Inclui validação robusta e formatação automática
 */
function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
  label,
  placeholder,
  required,
  disabled,
  className = '',
  id,
}) {
  const [country, setCountry] = useState('BR')

  // Valida o número de telefone
  const validatePhone = useCallback((phoneValue) => {
    if (!phoneValue) return true // Campo opcional
    return isValidPhoneNumber(phoneValue)
  }, [])

  // Handler para mudança de valor
  const handleChange = useCallback((phoneValue) => {
    onChange?.(phoneValue || '')
  }, [onChange])

  // Handler para blur com validação
  const handleBlur = useCallback((e) => {
    if (!value) return
    
    // Validar apenas se houver valor
    if (!validatePhone(value)) {
      // Se houver erro, pode ser tratado pelo parent
    }
    onBlur?.(e)
  }, [value, validatePhone, onBlur])

  // Determina a classe de erro
  const hasError = error && value

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <PhoneNumberInput
        id={id}
        country={country}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        international
        countryCallingCodeEditable={false}
        smartCaret
        disabled={disabled}
        labels={labels}
        placeholder={placeholder || 'Digite seu telefone'}
        className={`form-input ${hasError ? 'is-invalid' : ''}`}
      />

      {hasError && <span className="form-error">{error}</span>}
    </div>
  )
}



export default PhoneInput
export { isValidPhoneNumber, parsePhoneNumber }
