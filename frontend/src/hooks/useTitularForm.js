import { useState, useCallback, useEffect } from 'react'
import { getTitular, createTitular, updateTitular, createVinculo, updateVinculo, deleteVinculo } from '../services/titulares'
import { getNacionalidades, getTiposAtualizacao } from '../services/core'
import { validateDocuments, cleanDataForSubmit } from '../utils/validation'

const emptyFormData = {
  nome: '',
  cpf: '',
  cnh: '',
  passaporte: '',
  data_validade_passaporte: '',
  rnm: '',
  status_visto: '',
  ctps: '',
  nacionalidade: '',
  sexo: '',
  email: '',
  telefone: '',
  filiacao_um: '',
  filiacao_dois: '',
  data_nascimento: '',
  data_validade_cnh: '',
}

const emptyVinculo = {
  id: null,
  tipo_vinculo: '',
  empresa: '',
  empresa_nome: '',
  amparo: '',
  amparo_nome: '',
  consulado: '',
  consulado_nome: '',
  tipo_atualizacao: '',
  tipo_atualizacao_nome: '',
  data_entrada_pais: '',
  data_fim_vinculo: '',
  atualizacao: '',
  observacoes: '',
  status: true,
  tipo_status: '',
  isNew: true,
  isDeleted: false,
  isExpanded: true,
}

const fieldLabels = {
  nome: 'Nome',
  cpf: 'CPF',
  cnh: 'CNH',
  passaporte: 'Passaporte',
  rnm: 'RNM',
  ctps: 'CTPS',
  nacionalidade: 'Nacionalidade',
  sexo: 'Sexo',
  email: 'Email',
  telefone: 'Telefone',
  filiacao_um: 'Filiação 1',
  filiacao_dois: 'Filiação 2',
  data_nascimento: 'Data de Nascimento',
  data_validade_passaporte: 'Validade do Passaporte',
  data_validade_cnh: 'Validade da CNH',
  status_visto: 'Status do Visto',
  titular: 'Titular',
  tipo_vinculo: 'Tipo de Vínculo',
  empresa: 'Empresa',
  amparo: 'Amparo Legal',
  consulado: 'Consulado',
}

/**
 * Hook gerencia toda a lógica de estado do formulário de Titulares
 * Responsabilidades:
 * - Carregar dados (titular, nacionalidades, tipos de atualização)
 * - Gerenciar estado de formulário e vínculos
 * - Validação de dados
 * - Submissão (criar/editar titular e vínculos)
 */
function useTitularForm(titularId) {
  const isEditing = Boolean(titularId)

  // Estado do formulário
  const [formData, setFormData] = useState(emptyFormData)
  const [fieldErrors, setFieldErrors] = useState({})

  // Estado de carregamento e mensagens
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Dados da aplicação
  const [nacionalidades, setNacionalidades] = useState([])
  const [tiposAtualizacao, setTiposAtualizacao] = useState([])

  // Estado dos vínculos
  const [vinculos, setVinculos] = useState([])
  const [vinculoSearchTexts, setVinculoSearchTexts] = useState({})

  // Carrega dados iniciais (nacionalidades, tipos de atualização)
  useEffect(() => {
    loadApplicationData()
    if (isEditing) {
      loadTitular()
    }
  }, [titularId])

  async function loadApplicationData() {
    try {
      const [nacRes, tipoRes] = await Promise.all([
        getNacionalidades({ ativo: true }),
        getTiposAtualizacao({ ativo: true }),
      ])
      setNacionalidades(nacRes.data.results || nacRes.data)
      setTiposAtualizacao(tipoRes.data.results || tipoRes.data)
    } catch (err) {
      console.error('Erro ao carregar dados da aplicação:', err)
    }
  }

  async function loadTitular() {
    try {
      setLoading(true)
      const response = await getTitular(titularId)
      const data = response.data

      setFormData({
        nome: data.nome || '',
        cpf: data.cpf || '',
        cnh: data.cnh || '',
        passaporte: data.passaporte || '',
        data_validade_passaporte: data.data_validade_passaporte || '',
        rnm: data.rnm || '',
        status_visto: data.status_visto || '',
        ctps: data.ctps || '',
        nacionalidade: data.nacionalidade || '',
        sexo: data.sexo || '',
        email: data.email || '',
        telefone: data.telefone || '',
        filiacao_um: data.filiacao_um || '',
        filiacao_dois: data.filiacao_dois || '',
        data_nascimento: data.data_nascimento || '',
        data_validade_cnh: data.data_validade_cnh || '',
      })

      if (data.vinculos && data.vinculos.length > 0) {
        const vinculosCarregados = data.vinculos.map(v => ({
          id: v.id,
          tipo_vinculo: v.tipo_vinculo || '',
          empresa: v.empresa || '',
          empresa_nome: v.empresa_nome || '',
          amparo: v.amparo || '',
          amparo_nome: v.amparo_nome || '',
          consulado: v.consulado || '',
          consulado_nome: v.consulado_pais || '',
          tipo_atualizacao: v.tipo_atualizacao || '',
          tipo_atualizacao_nome: v.tipo_atualizacao_nome || '',
          data_entrada_pais: v.data_entrada_pais || '',
          data_fim_vinculo: v.data_fim_vinculo || '',
          atualizacao: v.atualizacao || '',
          observacoes: v.observacoes || '',
          status: v.status !== undefined ? v.status : true,
          tipo_status: v.tipo_status || '',
          isNew: false,
          isDeleted: false,
          isExpanded: false,
        }))
        setVinculos(vinculosCarregados)

        const searchTexts = {}
        vinculosCarregados.forEach((v, i) => {
          searchTexts[`empresa_${i}`] = v.empresa_nome
          searchTexts[`amparo_${i}`] = v.amparo_nome
          searchTexts[`consulado_${i}`] = v.consulado_nome
        })
        setVinculoSearchTexts(searchTexts)
      }
    } catch (err) {
      setError('Erro ao carregar dados do titular')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handlers para campos do formulário
  const handleFormChange = useCallback((e, formatter) => {
    const { name, value } = e.target
    let newValue = formatter ? formatter(value) : value

    setFormData(prev => ({ ...prev, [name]: newValue }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
  }, [fieldErrors])

  const handleFormBlur = useCallback((e, validator) => {
    const { name, value } = e.target
    if (validator && value) {
      const result = validator(value)
      if (!result.valid) {
        setFieldErrors(prev => ({ ...prev, [name]: result.error }))
      }
    }
  }, [])

  // Handlers para vínculos
  const addVinculo = useCallback(() => {
    setVinculos(prev => {
      const newIndex = prev.length
      setVinculoSearchTexts(textPrev => ({
        ...textPrev,
        [`empresa_${newIndex}`]: '',
        [`amparo_${newIndex}`]: '',
        [`consulado_${newIndex}`]: '',
      }))
      return [...prev, { ...emptyVinculo, id: `new-${Date.now()}` }]
    })
  }, [])

  const removeVinculo = useCallback((index) => {
    setVinculos(prev =>
      prev
        .map((v, i) => {
          if (i !== index) return v
          if (!v.isNew) {
            return { ...v, isDeleted: true }
          }
          return null
        })
        .filter(Boolean)
    )
  }, [])

  const toggleVinculoExpanded = useCallback((index) => {
    setVinculos(prev => prev.map((v, i) => (i === index ? { ...v, isExpanded: !v.isExpanded } : v)))
  }, [])

  const handleVinculoChange = useCallback((index, e) => {
    const { name, value, type, checked } = e.target
    setVinculos(prev =>
      prev.map((v, i) => {
        if (i !== index) return v
        return {
          ...v,
          [name]: type === 'checkbox' ? checked : value,
          ...(name === 'tipo_vinculo' && value === 'PARTICULAR' ? { empresa: '', empresa_nome: '' } : {}),
        }
      })
    )
  }, [])

  const updateVinculoItem = useCallback((index, updater) => {
    setVinculos(prev =>
      prev.map((v, i) => {
        if (i !== index) return v
        return typeof updater === 'function' ? updater(v) : { ...v, ...updater }
      })
    )
  }, [])

  const setVinculoSearchText = useCallback((key, value) => {
    setVinculoSearchTexts(prev => ({ ...prev, [key]: value }))
  }, [])

  // Validação de dados antes de enviar
  const validateForm = useCallback(() => {
    const validation = validateDocuments(formData)
    if (!validation.valid) {
      setFieldErrors(validation.errors)
      const camposComErro = Object.keys(validation.errors)
        .map(field => fieldLabels[field] || field)
        .join(', ')
      setError(`Por favor, corrija os erros nos campos: ${camposComErro}`)
      return false
    }

    const vinculosAtivos = vinculos.filter(v => !v.isDeleted && v.tipo_vinculo)
    for (let i = 0; i < vinculosAtivos.length; i++) {
      const vinculo = vinculosAtivos[i]
      if (vinculo.tipo_vinculo === 'EMPRESA' && !vinculo.empresa) {
        setError(`Vínculo ${i + 1}: O campo Empresa é obrigatório para vínculos do tipo Empresa.`)
        return false
      }
    }

    return true
  }, [formData, vinculos])

  // Submissão do formulário
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setError('')
      setSuccess('')

      if (!validateForm()) {
        return false
      }

      setSaving(true)

      try {
        const dataToSend = cleanDataForSubmit({ ...formData })

        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key] === '') {
            dataToSend[key] = null
          }
        })

        let titularIdToUse = isEditing ? titularId : null

        if (isEditing) {
          await updateTitular(titularIdToUse, dataToSend)
        } else {
          const response = await createTitular(dataToSend)
          titularIdToUse = response.data.id
        }

        if (!titularIdToUse) {
          throw new Error('Erro ao obter ID do titular')
        }

        // Processar vínculos
        for (const vinculo of vinculos) {
          if (!vinculo.tipo_vinculo) continue

          const vinculoToSend = {
            tipo_vinculo: vinculo.tipo_vinculo,
            empresa: vinculo.empresa || null,
            amparo: vinculo.amparo || null,
            consulado: vinculo.consulado || null,
            tipo_atualizacao: vinculo.tipo_atualizacao || null,
            data_entrada_pais: vinculo.data_entrada_pais || null,
            data_fim_vinculo: vinculo.data_fim_vinculo || null,
            atualizacao: vinculo.atualizacao || null,
            observacoes: vinculo.observacoes || null,
            status: vinculo.status,
            tipo_status: vinculo.tipo_status || null,
            titular: titularIdToUse,
          }

          if (vinculoToSend.tipo_vinculo === 'PARTICULAR') {
            vinculoToSend.empresa = null
          }

          if (vinculo.isDeleted && !vinculo.isNew) {
            await deleteVinculo(vinculo.id)
          } else if (vinculo.isNew && !vinculo.isDeleted) {
            await createVinculo(vinculoToSend)
          } else if (!vinculo.isNew && !vinculo.isDeleted) {
            await updateVinculo(vinculo.id, vinculoToSend)
          }
        }

        setSuccess(isEditing ? 'Titular atualizado com sucesso!' : 'Titular cadastrado com sucesso!')
        return { success: true, titularId }
      } catch (err) {
        console.error('Erro ao salvar titular:', err)
        const errorData = err.response?.data
        if (errorData) {
          const messages = Object.entries(errorData)
            .map(([field, errors]) => {
              const label = fieldLabels[field] || field
              let errorMsg = Array.isArray(errors) ? errors.join(', ') : String(errors)
              if (errorMsg.includes('already exists') || errorMsg.includes('já existe') || errorMsg.includes('unique')) {
                errorMsg = `Este ${label} já está cadastrado no sistema.`
              }
              return `${label}: ${errorMsg}`
            })
            .join('\n')
          setError(messages)
        } else {
          const errorMessage = err.message || 'Erro ao salvar titular'
          setError(errorMessage)
          console.error('Detalhes do erro:', err)
        }
        return { success: false }
      } finally {
        setSaving(false)
      }
    },
    [isEditing, formData, vinculos, validateForm, titularId]
  )

  return {
    // Estado do formulário
    formData,
    fieldErrors,
    handleFormChange,
    handleFormBlur,

    // Estado de carregamento e mensagens
    loading,
    saving,
    error,
    success,

    // Dados da aplicação
    nacionalidades,
    tiposAtualizacao,

    // Estado e handlers de vínculos
    vinculos,
    vinculoSearchTexts,
    addVinculo,
    removeVinculo,
    toggleVinculoExpanded,
    handleVinculoChange,
    updateVinculoItem,
    setVinculoSearchText,

    // Submissão
    handleSubmit,
  }
}

export default useTitularForm
