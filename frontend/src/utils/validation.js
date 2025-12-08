/**
 * Utilitários de validação e normalização de campos
 */

// ===== CONSTANTES =====

// Padrões inválidos - textos que devem ser rejeitados
const INVALID_PATTERNS = [
  /^n[aã]o\s*(tem|consta|possui|informado|declarado)?$/i,
  /^nenhum$/i,
  /^vazio$/i,
  /^null$/i,
  /^undefined$/i,
  /^-+$/,
  /^\.+$/,
  /^\*+$/,
  /^x+$/i,
  /^0+$/,
]

// ===== FUNÇÕES DE NORMALIZAÇÃO =====

/**
 * Normaliza nome: uppercase, apenas letras e espaços
 * Usado no submit para limpar antes de enviar ao backend
 */
export function normalizeNome(value) {
  if (!value) return ''
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^A-Z\s]/g, '') // Remove tudo exceto letras e espaços
    .replace(/\s+/g, ' ') // Múltiplos espaços -> um espaço
    .trim()
}

/**
 * Formata nome durante digitação: uppercase, permite espaços
 * NÃO faz trim() para permitir digitar espaços entre palavras
 */
export function formatNomeInput(value) {
  if (!value) return ''
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^A-Z\s]/g, '') // Remove tudo exceto letras e espaços
    .replace(/\s{2,}/g, ' ') // Apenas remove espaços DUPLOS (não trailing)
}

/**
 * Remove formatação de documento (pontos, hífens, espaços)
 */
export function removeFormatting(value) {
  if (!value) return ''
  return value.replace(/[\s.\-\/]/g, '')
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(value) {
  const digits = removeFormatting(value).replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Formata RNM: A000000-0 ou V000000-0 ou G000000-0 (letra + 6 dígitos + hífen + 1 dígito)
 */
export function formatRNM(value) {
  if (!value) return ''

  const clean = removeFormatting(value).toUpperCase()

  // Nova regex: letra + 0–7 alfanuméricos
  const match = clean.match(/^([A-Z])?([A-Z0-9]{0,6})([A-Z0-9])?$/)

  if (!match) {
    // Força extração correta mesmo em entradas "sujas"
    const letra = clean.match(/^[A-Z]/)?.[0] || ''
    const resto = clean.replace(/[^A-Z0-9]/g, '').slice(letra ? 1 : 0)
    
    const alfanum = resto.slice(0, 7)

    // RNM até 6 caracteres: sem hífen
    if (alfanum.length <= 6) return letra + alfanum

    // RNM com 7 caracteres: hífen antes do último
    return `${letra}${alfanum.slice(0, 6)}-${alfanum.slice(6)}`
  }

  const [, letra = '', parte1 = '', parte2 = ''] = match

  // Se ainda não tem o 7º caractere → sem hífen
  if (!parte2) return letra + parte1

  // 7 caracteres → insere hífen antes do último
  return `${letra}${parte1}-${parte2}`
}

/**
 * Formata CTPS: 0000000 00000-00 (7 dígitos número + 5 dígitos série + 2 dígitos UF)
 * Simplificado: apenas números, máximo 14 dígitos
 */
export function formatCTPS(value) {
  if (!value) return ''
  const digits = removeFormatting(value).replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 7) return digits
  if (digits.length <= 12) return `${digits.slice(0, 7)} ${digits.slice(7)}`
  return `${digits.slice(0, 7)} ${digits.slice(7, 12)}-${digits.slice(12)}`
}

/**
 * Formata CNH: 00000000000 (11 dígitos)
 */
export function formatCNH(value) {
  if (!value) return ''
  return removeFormatting(value).replace(/\D/g, '').slice(0, 11)
}

/**
 * Formata Passaporte: letras e números, uppercase
 */
export function formatPassaporte(value) {
  if (!value) return ''
  return removeFormatting(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)
}

/**
 * Formata Email: lowercase, sem espaços
 */
export function formatEmail(value) {
  if (!value) return ''
  return value.toLowerCase().trim().replace(/\s/g, '')
}

/**
 * Formata Telefone: remove tudo exceto dígitos e caracteres especiais (+, -, ())
 */
export function formatTelefone(value) {
  if (!value) return ''
  return value.replace(/[^0-9+()\-\s]/g, '')
}

/**
 * Formata Filiação: mesma regra do Nome (uppercase, apenas letras e espaços)
 */
export function formatFiliacao(value) {
  if (!value) return ''
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^A-Z\s]/g, '') // Remove tudo exceto letras e espaços
    .replace(/\s{2,}/g, ' ') // Apenas remove espaços DUPLOS
}

// ===== FUNÇÕES DE VALIDAÇÃO =====

/**
 * Verifica se o valor é um padrão inválido (ex: "NÃO CONSTA")
 */
export function isInvalidPattern(value) {
  if (!value) return false
  const trimmed = value.trim()
  return INVALID_PATTERNS.some(pattern => pattern.test(trimmed))
}

/**
 * Valida CPF (com dígitos verificadores)
 */
export function validateCPF(value) {
  const cpf = removeFormatting(value).replace(/\D/g, '')
  
  if (!cpf) return { valid: true, error: null } // Campo opcional vazio
  if (cpf.length !== 11) return { valid: false, error: 'CPF deve ter 11 dígitos' }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return { valid: false, error: 'CPF inválido' }
  
  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i)
  }
  let digit1 = (sum * 10) % 11
  if (digit1 === 10) digit1 = 0
  if (digit1 !== parseInt(cpf[9])) return { valid: false, error: 'CPF inválido' }
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i)
  }
  let digit2 = (sum * 10) % 11
  if (digit2 === 10) digit2 = 0
  if (digit2 !== parseInt(cpf[10])) return { valid: false, error: 'CPF inválido' }
  
  return { valid: true, error: null }
}

/**
 * Valida RNM
 * Formato: Letra + 6 dígitos + dígito verificador (ex: V123456-7)
 */
export function validateRNM(value) {
  if (!value) return { valid: true, error: null }

  const clean = removeFormatting(value).toUpperCase()

  if (isInvalidPattern(value)) {
    return {
      valid: false,
      error: 'Valor inválido. Digite o RNM corretamente ou deixe em branco.'
    }
  }

  // Novo formato válido: letra + 6-7 caracteres alfanuméricos
  const rnmRegex = /^[A-Z][A-Z0-9]{6,7}$/

  if (!rnmRegex.test(clean)) {
    return {
      valid: false,
      error: 'RNM deve ter formato: letra + 6-7 caracteres alfanuméricos (ex: V1234567 ou V123456A)'
    }
  }

  return { valid: true, error: null }
}


/**
 * Valida Passaporte
 */
export function validatePassaporte(value) {
  if (!value) return { valid: true, error: null }
  
  const clean = removeFormatting(value).toUpperCase()
  
  if (isInvalidPattern(value)) {
    return { valid: false, error: 'Valor inválido. Digite o passaporte corretamente ou deixe em branco.' }
  }
  
  // Passaporte: 6-15 caracteres alfanuméricos
  const passaporteRegex = /^[A-Z0-9]{6,15}$/
  if (!passaporteRegex.test(clean)) {
    return { valid: false, error: 'Passaporte deve ter 6-15 caracteres alfanuméricos' }
  }
  
  return { valid: true, error: null }
}

/**
 * Valida CTPS
 */
export function validateCTPS(value) {
  if (!value) return { valid: true, error: null }
  
  const clean = removeFormatting(value).replace(/\D/g, '')
  
  if (isInvalidPattern(value)) {
    return { valid: false, error: 'Valor inválido. Digite a CTPS corretamente ou deixe em branco.' }
  }
  
  // CTPS: 7-14 dígitos
  if (clean.length < 7 || clean.length > 14) {
    return { valid: false, error: 'CTPS deve ter entre 7 e 14 dígitos' }
  }
  
  return { valid: true, error: null }
}

/**
 * Valida CNH
 */
export function validateCNH(value) {
  if (!value) return { valid: true, error: null }
  
  const clean = removeFormatting(value).replace(/\D/g, '')
  
  if (isInvalidPattern(value)) {
    return { valid: false, error: 'Valor inválido. Digite a CNH corretamente ou deixe em branco.' }
  }
  
  // CNH: 11 dígitos
  if (clean.length !== 11) {
    return { valid: false, error: 'CNH deve ter 11 dígitos' }
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(clean)) {
    return { valid: false, error: 'CNH inválida' }
  }
  
  return { valid: true, error: null }
}

/**
 * Valida Nome
 */
export function validateNome(value) {
  if (!value) return { valid: false, error: 'Nome é obrigatório' }
  
  const normalized = normalizeNome(value)
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Nome deve ter pelo menos 3 caracteres' }
  }
  
  if (!/\s/.test(normalized)) {
    return { valid: false, error: 'Digite o nome completo (nome e sobrenome)' }
  }
  
  return { valid: true, error: null }
}

/**
 * Valida Filiação (mesmas regras do Nome)
 */
export function validateFiliacao(value) {
  if (!value) return { valid: true, error: null } // Campo opcional
  
  const normalized = normalizeNome(value)
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Filiação deve ter pelo menos 3 caracteres' }
  }
  
  if (!/\s/.test(normalized)) {
    return { valid: false, error: 'Digite a filiação completa (nome e sobrenome)' }
  }
  
  return { valid: true, error: null }
}

/**
 * Valida Email
 */
export function validateEmail(value) {
  if (!value) return { valid: true, error: null } // Campo opcional
  
  const normalized = value.toLowerCase().trim()
  
  if (isInvalidPattern(value)) {
    return { valid: false, error: 'Email inválido' }
  }
  
  // Email pattern simples mas eficaz
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: 'Email deve estar no formato correto (ex: usuario@dominio.com)' }
  }
  
  return { valid: true, error: null }
}

/**
 * Valida Telefone (aceita formato nacional e internacional)
 * Formatos aceitos:
 * - Celular: (11) 9 9999-9999 ou +55 11 99999-9999
 * - Fixo: (11) 3333-3333 ou +55 11 3333-3333
 */
export function validateTelefone(value) {
  if (!value) return { valid: true, error: null } // Campo opcional
  
  const clean = removeFormatting(value).replace(/\D/g, '')
  
  if (isInvalidPattern(value)) {
    return { valid: false, error: 'Telefone inválido' }
  }
  
  // Telefone: mínimo 10 dígitos (nacional) até 15 (internacional)
  if (clean.length < 10 || clean.length > 15) {
    return { valid: false, error: 'Telefone deve ter entre 10 e 15 dígitos' }
  }
  
  return { valid: true, error: null }
}

// ===== OBJETO DE VALIDADORES =====

export const validators = {
  nome: validateNome,
  filiacao_um: validateFiliacao,
  filiacao_dois: validateFiliacao,
  email: validateEmail,
  telefone: validateTelefone,
  cpf: validateCPF,
  rnm: validateRNM,
  passaporte: validatePassaporte,
  ctps: validateCTPS,
  cnh: validateCNH,
}

export const formatters = {
  nome: formatNomeInput, // Usa formatador sem trim para digitação
  filiacao_um: formatFiliacao,
  filiacao_dois: formatFiliacao,
  email: formatEmail,
  telefone: formatTelefone,
  cpf: formatCPF,
  rnm: formatRNM,
  passaporte: formatPassaporte,
  ctps: formatCTPS,
  cnh: formatCNH,
}

export const cleaners = {
  nome: normalizeNome,
  filiacao_um: normalizeNome,
  filiacao_dois: normalizeNome,
  email: (v) => v.toLowerCase().trim(),
  telefone: (v) => removeFormatting(v),
  cpf: (v) => removeFormatting(v).replace(/\D/g, ''),
  rnm: (v) => removeFormatting(v).toUpperCase(),
  passaporte: (v) => removeFormatting(v).toUpperCase().replace(/[^A-Z0-9]/g, ''),
  ctps: (v) => removeFormatting(v).replace(/\D/g, ''),
  cnh: (v) => removeFormatting(v).replace(/\D/g, ''),
}

/**
 * Valida todos os campos de documento
 */
export function validateDocuments(data) {
  const errors = {}
  
  if (data.nome !== undefined) {
    const result = validateNome(data.nome)
    if (!result.valid) errors.nome = result.error
  }
  
  if (data.filiacao_um !== undefined && data.filiacao_um) {
    const result = validateFiliacao(data.filiacao_um)
    if (!result.valid) errors.filiacao_um = result.error
  }
  
  if (data.filiacao_dois !== undefined && data.filiacao_dois) {
    const result = validateFiliacao(data.filiacao_dois)
    if (!result.valid) errors.filiacao_dois = result.error
  }
  
  if (data.email !== undefined && data.email) {
    const result = validateEmail(data.email)
    if (!result.valid) errors.email = result.error
  }
  
  if (data.telefone !== undefined && data.telefone) {
    const result = validateTelefone(data.telefone)
    if (!result.valid) errors.telefone = result.error
  }
  
  if (data.cpf !== undefined && data.cpf) {
    const result = validateCPF(data.cpf)
    if (!result.valid) errors.cpf = result.error
  }
  
  if (data.rnm !== undefined && data.rnm) {
    const result = validateRNM(data.rnm)
    if (!result.valid) errors.rnm = result.error
  }
  
  if (data.passaporte !== undefined && data.passaporte) {
    const result = validatePassaporte(data.passaporte)
    if (!result.valid) errors.passaporte = result.error
  }
  
  if (data.ctps !== undefined && data.ctps) {
    const result = validateCTPS(data.ctps)
    if (!result.valid) errors.ctps = result.error
  }
  
  if (data.cnh !== undefined && data.cnh) {
    const result = validateCNH(data.cnh)
    if (!result.valid) errors.cnh = result.error
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Limpa dados antes de enviar ao backend
 */
export function cleanDataForSubmit(data) {
  const cleaned = { ...data }
  
  if (cleaned.nome) cleaned.nome = cleaners.nome(cleaned.nome)
  if (cleaned.filiacao_um) cleaned.filiacao_um = cleaners.filiacao_um(cleaned.filiacao_um)
  if (cleaned.filiacao_dois) cleaned.filiacao_dois = cleaners.filiacao_dois(cleaned.filiacao_dois)
  if (cleaned.email) cleaned.email = cleaners.email(cleaned.email)
  if (cleaned.telefone) cleaned.telefone = cleaners.telefone(cleaned.telefone)
  if (cleaned.cpf) cleaned.cpf = cleaners.cpf(cleaned.cpf)
  if (cleaned.rnm) cleaned.rnm = cleaners.rnm(cleaned.rnm)
  if (cleaned.passaporte) cleaned.passaporte = cleaners.passaporte(cleaned.passaporte)
  if (cleaned.ctps) cleaned.ctps = cleaners.ctps(cleaned.ctps)
  if (cleaned.cnh) cleaned.cnh = cleaners.cnh(cleaned.cnh)
  
  return cleaned
}
