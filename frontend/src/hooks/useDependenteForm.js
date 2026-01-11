import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getDependente,
  createDependente,
  updateDependente,
  getTitulares,
  createVinculoDependente,
  updateVinculoDependente,
  deleteVinculoDependente,
} from '../services/titulares'
import { getAmparosLegais, getTiposAtualizacao } from '../services/core'
import useAutoComplete from './useAutoComplete'
import { cleanDataForSubmit, formatters, validateDocuments, validators } from '../utils/validation'
import { getErrorMessage } from '../utils/errorHandler'

const emptyVinculo = {
  id: null,
  amparo: '',
  amparo_nome: '',
  consulado: '',
  tipo_atualizacao: '',
  data_entrada: '',
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
  filiacao_um: 'Filiação 1',
  filiacao_dois: 'Filiação 2',
  data_nascimento: 'Data de Nascimento',
  data_validade_passaporte: 'Validade do Passaporte',
  status_visto: 'Status do Visto',
  titular: 'Titular',
  tipo_dependente: 'Tipo de Dependente',
  amparo: 'Amparo Legal',
  consulado: 'Consulado',
  pais_telefone: 'País (Telefone)',
}

function useDependenteForm({ dependenteId, titularIdFromUrl, onSaved }) {
  const isEditing = Boolean(dependenteId)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [tiposAtualizacao, setTiposAtualizacao] = useState([])

  const [titularSearchText, setTitularSearchText] = useState('')
  const [vinculoSearchTexts, setVinculoSearchTexts] = useState({})
  const [vinculos, setVinculos] = useState([])

  const [formData, setFormData] = useState({
    titular: titularIdFromUrl || '',
    nome: '',
    passaporte: '',
    data_validade_passaporte: '',
    rnm: '',
    cnh: '',
    status_visto: '',
    ctps: '',
    nacionalidade: '',
    tipo_dependente: '',
    sexo: '',
    data_nascimento: '',
    filiacao_um: '',
    filiacao_dois: '',
    pais_telefone: 'BR',
  })

  const fetchTitulares = useCallback((searchText) => getTitulares({ search: searchText, page_size: 15 }), [])
  const fetchAmparos = useCallback((searchText) => getAmparosLegais({ search: searchText, ativo: true, page_size: 15 }), [])

  const { suggestions: titularSuggestions, search: searchTitulares, clear: clearTitulares } = useAutoComplete(fetchTitulares)
  const { suggestions: amparosSuggestions, search: searchAmparos, clear: clearAmparos } = useAutoComplete(fetchAmparos)

  const tiposDependenteValidos = useMemo(() => ['CONJUGE', 'FILHO', 'ENTEADO', 'PAI_MAE', 'OUTRO'], [])
  const sexosValidos = useMemo(() => ['M', 'F', 'O'], [])

  const setVinculosFromApi = useCallback((items) => {
    setVinculos(items)
    setVinculoSearchTexts(() => {
      const texts = {}
      items.forEach((v, i) => {
        texts[`amparo_${i}`] = v.amparo_nome || ''
      })
      return texts
    })
  }, [])

  const loadDadosBasicos = useCallback(async () => {
    try {
      const tipoRes = await getTiposAtualizacao({ ativo: true })
      setTiposAtualizacao(tipoRes.data.results || tipoRes.data || [])

      if (titularIdFromUrl) {
        try {
          const titularRes = await getTitulares({ search: '', page_size: 100 })
          const titular = (titularRes.data.results || titularRes.data || []).find((t) => String(t.id) === String(titularIdFromUrl))
          if (titular) {
            setTitularSearchText(`${titular.nome}${titular.rnm ? ` - ${titular.rnm}` : ''}`)
            setFormData((prev) => ({ ...prev, titular: titular.id }))
          }
        } catch (innerErr) {
          console.error('Erro ao carregar titular inicial:', innerErr)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err)
    }
  }, [titularIdFromUrl])

  const loadDependente = useCallback(async () => {
    if (!dependenteId) return
    try {
      setLoading(true)
      const response = await getDependente(dependenteId)
      const data = response.data
      setFormData({
        titular: data.titular || '',
        nome: data.nome || '',
        passaporte: data.passaporte || '',
        data_validade_passaporte: data.data_validade_passaporte || '',
        rnm: data.rnm || '',
        cnh: data.cnh || '',
        status_visto: data.status_visto || '',
        ctps: data.ctps || '',
        nacionalidade: data.nacionalidade || '',
        tipo_dependente: data.tipo_dependente || '',
        sexo: data.sexo || '',
        data_nascimento: data.data_nascimento || '',
        filiacao_um: data.filiacao_um || '',
        filiacao_dois: data.filiacao_dois || '',
      })

      if (data.titular_nome) {
        setTitularSearchText(data.titular_nome)
      }

      if (data.vinculos && data.vinculos.length > 0) {
        const vinculosCarregados = data.vinculos.map((v) => ({
          id: v.id,
          amparo: v.amparo || '',
          amparo_nome: v.amparo_nome || '',
          consulado: v.consulado || '',
          tipo_atualizacao: v.tipo_atualizacao || '',
          data_entrada: v.data_entrada || '',
          data_fim_vinculo: v.data_fim_vinculo || '',
          atualizacao: v.atualizacao || '',
          observacoes: v.observacoes || '',
          status: v.status !== undefined ? v.status : true,
          tipo_status: v.tipo_status || '',
          isNew: false,
          isDeleted: false,
          isExpanded: false,
        }))
        setVinculosFromApi(vinculosCarregados)
      }
    } catch (err) {
      setError('Erro ao carregar dados do dependente')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [dependenteId, setVinculosFromApi])

  useEffect(() => {
    loadDadosBasicos()
    loadDependente()
  }, [loadDadosBasicos, loadDependente])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    let newValue = value
    if (formatters[name]) {
      newValue = formatters[name](value)
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
  }, [fieldErrors])

  const handleBlur = useCallback((e, customValidator) => {
    const { name, value } = e.target
    const validator = customValidator || validators[name]
    if (validator && value) {
      const result = validator(value)
      if (!result.valid) {
        setFieldErrors((prev) => ({ ...prev, [name]: result.error }))
      }
    }
  }, [])

  const handleTitularSearch = useCallback((text) => {
    setTitularSearchText(text)
    setFormData((prev) => ({ ...prev, titular: '' }))
    if (!text) {
      clearTitulares()
      return
    }
    searchTitulares(text)
  }, [clearTitulares, searchTitulares])

  const handleTitularSelect = useCallback((titular) => {
    setFormData((prev) => ({ ...prev, titular: titular.id }))
    setTitularSearchText(`${titular.nome}${titular.rnm ? ` - ${titular.rnm}` : ''}`)
    clearTitulares()
  }, [clearTitulares])

  const handleAmparoSearch = useCallback((index, text) => {
    setVinculoSearchTexts((prev) => ({ ...prev, [`amparo_${index}`]: text }))
    setVinculos((prev) => prev.map((v, i) => (i === index ? { ...v, amparo: '', amparo_nome: text } : v)))
    if (!text) {
      clearAmparos()
      return
    }
    searchAmparos(text)
  }, [clearAmparos, searchAmparos])

  const handleAmparoSelect = useCallback((index, amparo) => {
    setVinculos((prev) => prev.map((v, i) => (i === index ? { ...v, amparo: amparo.id, amparo_nome: amparo.nome } : v)))
    setVinculoSearchTexts((prev) => ({ ...prev, [`amparo_${index}`]: amparo.nome }))
    clearAmparos()
  }, [clearAmparos])

  const handleConsuladoChange = useCallback((index, value) => {
    setVinculos((prev) => prev.map((v, i) => (i === index ? { ...v, consulado: value } : v)))
  }, [])

  const handleVinculoChange = useCallback((index, e) => {
    const { name, value, type, checked } = e.target
    setVinculos((prev) => prev.map((v, i) => {
      if (i !== index) return v
      return { ...v, [name]: type === 'checkbox' ? checked : value }
    }))
  }, [])

  const toggleVinculoExpanded = useCallback((index) => {
    setVinculos((prev) => prev.map((v, i) => (i === index ? { ...v, isExpanded: !v.isExpanded } : v)))
  }, [])

  const addVinculo = useCallback(() => {
    setVinculos((prev) => {
      const newIndex = prev.length
      setVinculoSearchTexts((texts) => ({
        ...texts,
        [`amparo_${newIndex}`]: '',
      }))
      return [...prev, { ...emptyVinculo, id: `new-${Date.now()}` }]
    })
  }, [])

  const removeVinculo = useCallback((index) => {
    setVinculos((prev) => prev
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

  const normalizeEnum = useCallback((value, validList) => {
    if (!value) return null
    return validList.includes(value) ? value : null
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validation = validateDocuments(formData)
    if (!validation.valid) {
      setFieldErrors(validation.errors)
      const camposComErro = Object.keys(validation.errors)
        .map((field) => fieldLabels[field] || field)
        .join(', ')
      setError(`Por favor, corrija os erros nos campos: ${camposComErro}`)
      window.location.hash = 'mensagens'
      return
    }

    setSaving(true)

    try {
      const dataToSend = cleanDataForSubmit({ ...formData })
      dataToSend.tipo_dependente = normalizeEnum(dataToSend.tipo_dependente, tiposDependenteValidos)
      dataToSend.sexo = normalizeEnum(dataToSend.sexo, sexosValidos)

      Object.keys(dataToSend).forEach((key) => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null
        }
      })

      let dependenteIdRef = dependenteId
      if (isEditing) {
        await updateDependente(dependenteId, dataToSend)
      } else {
        const response = await createDependente(dataToSend)
        dependenteIdRef = response.data.id
      }

      for (const vinculo of vinculos) {
        const vinculoToSend = {
          dependente: dependenteIdRef,
          amparo: vinculo.amparo || null,
          consulado: vinculo.consulado || null,
          tipo_atualizacao: vinculo.tipo_atualizacao || null,
          data_entrada: vinculo.data_entrada || null,
          data_fim_vinculo: vinculo.data_fim_vinculo || null,
          atualizacao: vinculo.atualizacao || null,
          observacoes: vinculo.observacoes || null,
          status: vinculo.status,
          tipo_status: vinculo.tipo_status || null,
        }

        if (vinculo.isDeleted && !vinculo.isNew) {
          await deleteVinculoDependente(vinculo.id)
        } else if (vinculo.isNew && !vinculo.isDeleted) {
          await createVinculoDependente(vinculoToSend)
        } else if (!vinculo.isNew && !vinculo.isDeleted) {
          await updateVinculoDependente(vinculo.id, vinculoToSend)
        }
      }

      const successMessage = isEditing ? 'Dependente atualizado com sucesso!' : 'Dependente cadastrado com sucesso!'
      setSuccess(successMessage)
      window.location.hash = 'mensagens'

      if (onSaved) {
        onSaved({ dependenteId: dependenteIdRef, titular: formData.titular })
      }
    } catch (err) {
      // Usa o utilitário centralizado para formatar erros
      setError(getErrorMessage(err, 'Erro ao salvar dependente'))
      console.error(err)
      window.location.hash = 'mensagens'
    } finally {
      setSaving(false)
    }
  }, [dependenteId, formData, isEditing, normalizeEnum, onSaved, sexosValidos, tiposDependenteValidos, vinculos])

  return {
    isEditing,
    loading,
    saving,
    error,
    success,
    formData,
    fieldErrors,
    tiposAtualizacao,
    vinculos,
    vinculoSearchTexts,
    titularSearchText,
    titularSuggestions,
    amparosSuggestions,
    setTitularSearchText,
    setFormData,
    setError,
    handleChange,
    handleBlur,
    handleTitularSearch,
    handleTitularSelect,
    handleAmparoSearch,
    handleAmparoSelect,
    handleConsuladoChange,
    handleVinculoChange,
    toggleVinculoExpanded,
    addVinculo,
    removeVinculo,
    handleSubmit,
  }
}

export default useDependenteForm
