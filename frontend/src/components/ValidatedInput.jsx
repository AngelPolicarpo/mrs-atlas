import { useState, useCallback } from 'react'
import { formatters, validators, cleaners } from '../utils/validation'

/**
 * Input com validação e formatação automática
 */
function ValidatedInput({
  type = 'text',
  name,
  value,
  onChange,
  label,
  required = false,
  placeholder = '',
  className = 'form-control',
  fieldType = null, // 'nome', 'cpf', 'rnm', 'passaporte', 'ctps', 'cnh'
  disabled = false,
  ...props
}) {
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const handleChange = useCallback((e) => {
    let newValue = e.target.value
    
    // Aplica formatação se o fieldType estiver definido
    if (fieldType && formatters[fieldType]) {
      newValue = formatters[fieldType](newValue)
    }
    
    // Limpa erro ao digitar
    if (error) setError('')
    
    // Chama onChange do pai com o valor formatado
    onChange({
      target: {
        name,
        value: newValue,
      }
    })
  }, [fieldType, name, onChange, error])

  const handleBlur = useCallback(() => {
    setTouched(true)
    
    // Valida se o fieldType estiver definido
    if (fieldType && validators[fieldType]) {
      const result = validators[fieldType](value)
      if (!result.valid) {
        setError(result.error)
      } else {
        setError('')
      }
    }
  }, [fieldType, value])

  const hasError = touched && error
  const inputClassName = `${className}${hasError ? ' is-invalid' : ''}`

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name}>
          {label}
          {required && <span style={{ color: '#dc3545' }}> *</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={inputClassName}
        required={required}
        disabled={disabled}
        {...props}
      />
      {hasError && (
        <small className="text-danger" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
          {error}
        </small>
      )}
    </div>
  )
}

export default ValidatedInput
