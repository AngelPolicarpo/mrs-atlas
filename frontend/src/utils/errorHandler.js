/**
 * Utilitário centralizado para tratamento de erros do backend.
 * Garante mensagens amigáveis e consistentes em português.
 */

// Mapeamento de campos para labels em português
export const fieldLabels = {
  // Empresa
  nome: 'Nome',
  cnpj: 'CNPJ',
  email: 'Email',
  telefone: 'Telefone',
  endereco: 'Endereço',
  contato: 'Contato',
  controle: 'Controle',
  status: 'Status',
  data_registro: 'Data de Registro',
  
  // Titular/Dependente
  cpf: 'CPF',
  cnh: 'CNH',
  passaporte: 'Passaporte',
  rnm: 'RNM',
  ctps: 'CTPS',
  nacionalidade: 'Nacionalidade',
  sexo: 'Sexo',
  filiacao_um: 'Filiação 1',
  filiacao_dois: 'Filiação 2',
  data_nascimento: 'Data de Nascimento',
  data_validade_passaporte: 'Validade do Passaporte',
  data_validade_cnh: 'Validade da CNH',
  status_visto: 'Status do Visto',
  tipo_dependente: 'Tipo de Dependente',
  
  // Vínculo
  tipo_vinculo: 'Tipo de Vínculo',
  empresa: 'Empresa',
  amparo: 'Amparo Legal',
  consulado: 'Consulado',
  tipo_atualizacao: 'Tipo de Atualização',
  data_entrada_pais: 'Data de Entrada no País',
  data_fim_vinculo: 'Data Fim do Vínculo',
  atualizacao: 'Atualização',
  observacoes: 'Observações',
  tipo_status: 'Tipo de Status',
  
  // Contrato
  numero: 'Número do Contrato',
  tipo: 'Tipo',
  data_inicio: 'Data de Início',
  data_fim: 'Data de Término',
  prazo_faturamento: 'Prazo de Faturamento',
  observacao: 'Observação',
  empresa_contratante: 'Empresa Contratante',
  empresa_contratada: 'Empresa Contratada',
  
  // Serviço
  item: 'Código do Serviço',
  descricao: 'Descrição',
  valor_base: 'Valor Base',
  valor: 'Valor',
  
  // Ordem de Serviço
  contrato: 'Contrato',
  solicitante: 'Solicitante',
  colaborador: 'Colaborador',
  empresa_solicitante: 'Empresa Solicitante',
  empresa_pagadora: 'Empresa Pagadora',
  referencia: 'Referência',
  
  // Tipo de Despesa
  tipo_despesa: 'Tipo de Despesa',
  
  // Empresa Prestadora
  nome_juridico: 'Razão Social',
  nome_fantasia: 'Nome Fantasia',
  ativo: 'Ativo',
  
  // Genéricos
  titular: 'Titular',
  dependente: 'Dependente',
  servico: 'Serviço',
  quantidade: 'Quantidade',
}

// Padrões de mensagens genéricas do Django/DRF que devem ser traduzidas
const errorPatterns = [
  // Unicidade
  {
    pattern: /already exists|já existe|já está cadastrado/i,
    getMessage: (field) => `Já existe um registro com este ${(fieldLabels[field] || field).toLowerCase()}.`
  },
  {
    pattern: /unique constraint|must be unique/i,
    getMessage: (field) => `Já existe um registro com este ${(fieldLabels[field] || field).toLowerCase()}.`
  },
  // Campos obrigatórios
  {
    pattern: /this field is required|campo.*obrigatório/i,
    getMessage: (field) => `O campo ${(fieldLabels[field] || field).toLowerCase()} é obrigatório.`
  },
  {
    pattern: /this field may not be blank|não pode estar em branco/i,
    getMessage: (field) => `O campo ${(fieldLabels[field] || field).toLowerCase()} não pode estar vazio.`
  },
  {
    pattern: /this field may not be null/i,
    getMessage: (field) => `O campo ${(fieldLabels[field] || field).toLowerCase()} é obrigatório.`
  },
  // Validações de formato
  {
    pattern: /enter a valid email|email.*inválido/i,
    getMessage: () => `Digite um endereço de email válido.`
  },
  {
    pattern: /invalid date|data.*inválid/i,
    getMessage: (field) => `A data informada em ${(fieldLabels[field] || field).toLowerCase()} não é válida.`
  },
  {
    pattern: /invalid.*format|formato.*inválido/i,
    getMessage: (field) => `O formato de ${(fieldLabels[field] || field).toLowerCase()} não é válido.`
  },
  // Validações numéricas
  {
    pattern: /ensure this value is greater than|valor.*maior/i,
    getMessage: (field) => `O valor de ${(fieldLabels[field] || field).toLowerCase()} deve ser maior.`
  },
  {
    pattern: /ensure this value is less than|valor.*menor/i,
    getMessage: (field) => `O valor de ${(fieldLabels[field] || field).toLowerCase()} deve ser menor.`
  },
  {
    pattern: /must be a positive|deve ser positivo/i,
    getMessage: (field) => `O valor de ${(fieldLabels[field] || field).toLowerCase()} deve ser positivo.`
  },
  // Validações de tamanho
  {
    pattern: /at least (\d+) character|pelo menos (\d+) caractere/i,
    getMessage: (field, match) => {
      const num = match[1] || match[2]
      return `O campo ${(fieldLabels[field] || field).toLowerCase()} deve ter pelo menos ${num} caracteres.`
    }
  },
  {
    pattern: /no more than (\d+) character|máximo.*(\d+) caractere/i,
    getMessage: (field, match) => {
      const num = match[1] || match[2]
      return `O campo ${(fieldLabels[field] || field).toLowerCase()} pode ter no máximo ${num} caracteres.`
    }
  },
  // Permissões
  {
    pattern: /permission denied|permissão negada|não autorizado/i,
    getMessage: () => `Você não tem permissão para realizar esta ação.`
  },
  {
    pattern: /not found|não encontrado/i,
    getMessage: () => `O registro solicitado não foi encontrado.`
  },
]

/**
 * Traduz uma mensagem de erro individual para português.
 * @param {string} field - Nome do campo
 * @param {string|object} message - Mensagem de erro original
 * @returns {string} Mensagem traduzida
 */
function translateErrorMessage(field, message) {
  // Se for objeto, converte para string
  if (typeof message === 'object' && message !== null) {
    if (message.message) {
      message = message.message
    } else {
      message = JSON.stringify(message)
    }
  }
  
  // Garante que é string
  message = String(message)
  
  // Verifica se é uma mensagem já em português bem formatada (do backend)
  // Detecta mensagens que começam com padrões conhecidos de frases em português
  const ptBrPatterns = [
    /^este\s/i,
    /^esta\s/i,
    /^o campo\s/i,
    /^a data\s/i,
    /^já existe/i,
    /^não foi possível/i,
    /^você não tem/i,
    /^preencha/i,
    /^digite/i,
    /^informe/i,
    /^selecione/i,
  ]
  
  if (ptBrPatterns.some(p => p.test(message))) {
    return message
  }
  
  // Tenta encontrar um padrão conhecido
  for (const { pattern, getMessage } of errorPatterns) {
    const match = message.match(pattern)
    if (match) {
      return getMessage(field, match)
    }
  }
  
  // Se não encontrou padrão, retorna a mensagem original
  return message
}

/**
 * Formata erros de campos (fields) em mensagens amigáveis.
 * @param {Object} fields - Objeto com erros por campo
 * @returns {string[]} Array de mensagens formatadas
 */
function formatFieldErrors(fields) {
  if (!fields || typeof fields !== 'object') {
    return []
  }
  
  const results = []
  
  for (const [field, errorValue] of Object.entries(fields)) {
    // Ignora campos especiais
    if (field === 'non_field_errors' || field === 'warnings') {
      continue
    }
    
    const label = fieldLabels[field] || field
    let errorMsg = ''
    
    try {
      // O erro pode ser string, array ou objeto
      if (typeof errorValue === 'string') {
        errorMsg = translateErrorMessage(field, errorValue)
      } else if (Array.isArray(errorValue)) {
        // Processa cada item do array e junta
        const messages = errorValue.map(e => {
          if (typeof e === 'string') {
            return translateErrorMessage(field, e)
          } else if (typeof e === 'object' && e !== null) {
            return translateErrorMessage(field, e.message || e.detail || JSON.stringify(e))
          }
          return String(e)
        })
        errorMsg = messages.join(', ')
      } else if (typeof errorValue === 'object' && errorValue !== null) {
        // Erro aninhado (ex: objetos dentro de fields)
        errorMsg = translateErrorMessage(field, errorValue.message || errorValue.detail || JSON.stringify(errorValue))
      } else {
        errorMsg = String(errorValue)
      }
      
      // Garante que errorMsg é string
      if (typeof errorMsg !== 'string') {
        errorMsg = String(errorMsg)
      }
      
      // Se a mensagem já menciona o campo (contexto já está claro), retorna só a mensagem
      const labelLower = label.toLowerCase()
      const errorMsgLower = errorMsg.toLowerCase()
      if (errorMsgLower.includes(labelLower) || 
          errorMsgLower.includes(field.toLowerCase()) ||
          errorMsgLower.startsWith('este ') ||
          errorMsgLower.startsWith('esta ') ||
          errorMsgLower.startsWith('o campo') ||
          errorMsgLower.startsWith('a data') ||
          errorMsgLower.startsWith('digite') ||
          errorMsgLower.startsWith('preencha') ||
          errorMsgLower.startsWith('informe') ||
          errorMsgLower.startsWith('já existe') ||
          errorMsgLower.startsWith('número é obrigatório')) {
        results.push(errorMsg)
      } else {
        results.push(`${label}: ${errorMsg}`)
      }
    } catch (e) {
      console.error(`Erro ao processar campo ${field}:`, e)
      results.push(`${label}: Erro de validação`)
    }
  }
  
  return results
}

/**
 * Formata os erros do backend em mensagens amigáveis.
 * @param {Object|string} errorData - Dados de erro do backend (err.response?.data)
 * @returns {string} Mensagem de erro formatada
 */
export function formatBackendErrors(errorData) {
  if (!errorData) {
    return 'Ocorreu um erro. Tente novamente.'
  }
  
  // Se for uma string simples
  if (typeof errorData === 'string') {
    return errorData
  }
  
  // IMPORTANTE: O backend retorna erros no formato { error: { message, code, fields } }
  // Precisamos extrair o conteúdo do wrapper 'error' primeiro
  if (errorData.error && typeof errorData.error === 'object') {
    errorData = errorData.error
  }
  
  // Formato estruturado: { message, code, fields }
  // Este é o formato mais comum do nosso backend
  if (errorData.fields && typeof errorData.fields === 'object') {
    const fieldMessages = formatFieldErrors(errorData.fields)
    if (fieldMessages.length > 0) {
      return fieldMessages.join('\n')
    }
    // Se não conseguiu extrair mensagens dos fields, usa a mensagem geral
    if (errorData.message) {
      return errorData.message
    }
  }
  
  // Se tiver detail (padrão DRF)
  if (errorData.detail) {
    return typeof errorData.detail === 'string' ? errorData.detail : String(errorData.detail)
  }
  
  // Se tiver message sem fields
  if (errorData.message && !errorData.fields) {
    return typeof errorData.message === 'string' ? errorData.message : String(errorData.message)
  }
  
  // Se for um objeto com erros por campo (formato antigo DRF)
  if (typeof errorData === 'object') {
    // Filtra chaves que são campos de erro
    const errorKeys = Object.keys(errorData).filter(
      key => !['message', 'code', 'status', 'warnings', 'non_field_errors'].includes(key)
    )
    
    if (errorKeys.length > 0) {
      const messages = formatFieldErrors(errorData)
      
      // Adiciona erros não relacionados a campos específicos
      if (errorData.non_field_errors) {
        const nonFieldErrors = Array.isArray(errorData.non_field_errors) 
          ? errorData.non_field_errors.map(e => typeof e === 'string' ? e : String(e))
          : [String(errorData.non_field_errors)]
        messages.unshift(...nonFieldErrors)
      }
      
      if (messages.length > 0) {
        return messages.join('\n')
      }
    }
  }
  
  return 'Ocorreu um erro ao processar sua solicitação.'
}

/**
 * Extrai mensagem de erro de uma exceção HTTP.
 * @param {Error} err - Erro capturado
 * @param {string} fallbackMessage - Mensagem padrão se não conseguir extrair
 * @returns {string} Mensagem de erro formatada
 */
export function getErrorMessage(err, fallbackMessage = 'Erro ao processar a requisição.') {
  try {
    if (err.response?.data) {
      const result = formatBackendErrors(err.response.data)
      // Garantir que sempre retorna string
      return typeof result === 'string' ? result : String(result)
    }
    
    if (err.message) {
      return typeof err.message === 'string' ? err.message : String(err.message)
    }
    
    return fallbackMessage
  } catch (e) {
    console.error('Erro ao processar mensagem de erro:', e)
    return fallbackMessage
  }
}

export default {
  fieldLabels,
  formatBackendErrors,
  getErrorMessage,
}
