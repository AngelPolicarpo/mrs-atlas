import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  getOrdemServico, 
  createOrdemServico, 
  updateOrdemServico,
  getOrdemServicoTitulares,
  getOrdemServicoDependentes,
  getOrdemServicoItens,
  getOrdemServicoDespesas,
  createOSItem,
  updateOSItem,
  deleteOSItem,
  createDespesaOS,
  updateDespesaOS,
  deleteDespesaOS,
  getTiposDespesaAtivos,
  recalcularOrdemServico,
  createOSTitular,
  deleteOSTitular,
  createOSDependente,
  deleteOSDependente
} from '../services/ordemServico'
import { getEmpresasPrestadoras } from '../services/ordemServico'
import { getEmpresas } from '../services/empresas'
import { getContratosAtivos, getContrato, getContratoServicos, getContratoServicosDisponiveis } from '../services/contratos'
import { formatLocalDate } from '../utils/dateUtils'

const emptyFormData = {
  data_abertura: formatLocalDate(),
  data_fechamento: '',
  status: 'ABERTA',
  observacao: '',
  contrato: '',           // FK para contrato
  empresa_solicitante: '',
  empresa_pagadora: '',
  solicitante: '',
  colaborador: '',
}

// Template para novo item de OS (serviço do contrato)
const emptyOSItem = {
  id: null,
  contrato_servico: '', // FK para ContratoServico
  servico_item: '',
  servico_descricao: '',
  valor_contrato: 0,    // valor do ContratoServico
  valor_aplicado: '',   // valor customizado nesta OS
  quantidade: 1,
  isNew: true,
  isDeleted: false,
}

// Template para nova despesa (agora com FK para tipo_despesa)
const emptyDespesa = {
  id: null,
  tipo_despesa: '',      // FK para TipoDespesa
  tipo_despesa_item: '', // Exibição
  valor: '',
  observacao: '',
  isNew: true,
  isDeleted: false,
}

// Status options (inclui novas fases de faturamento)
const statusOptions = [
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'FATURADA', label: 'Faturada' },
  { value: 'RECEBIDA', label: 'Recebida' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

/**
 * Hook gerencia toda a lógica de estado do formulário de Ordem de Serviço
 * Nova arquitetura: Contrato → ContratoServico → OrdemServico → OrdemServicoItem
 */
function useOrdemServicoForm(osId) {
  const isEditing = Boolean(osId)
  const [searchParams] = useSearchParams()

  // Estado do formulário
  const [formData, setFormData] = useState(emptyFormData)
  
  // Estado de carregamento e mensagens
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Dados carregados (para exibição em modo edição)
  const [ordemServico, setOrdemServico] = useState(null)
  const [contratoSelecionado, setContratoSelecionado] = useState(null)
  
  // Dados relacionados (para edição)
  const [titulares, setTitulares] = useState([])
  const [dependentes, setDependentes] = useState([])
  const [osItens, setOsItens] = useState([])         // Itens da OS
  const [despesas, setDespesas] = useState([])
  
  // Titulares e Dependentes para adicionar/remover (gerenciamento local antes de salvar)
  const [osTitulares, setOsTitulares] = useState([])       // [{id, titular, titular_nome, ...}]
  const [osDependentes, setOsDependentes] = useState([])   // [{id, dependente, dependente_nome, ...}]
  
  // Opções para selects
  const [empresas, setEmpresas] = useState([])
  const [empresasPrestadoras, setEmpresasPrestadoras] = useState([])
  const [contratos, setContratos] = useState([])     // Contratos ativos
  const [servicosContrato, setServicosContrato] = useState([]) // Serviços do contrato selecionado
  const [tiposDespesa, setTiposDespesa] = useState([]) // Tipos de despesa ativos

  // Carrega opções dos selects
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [empresasRes, prestadorasRes, contratosRes, tiposDespesaRes] = await Promise.all([
          getEmpresas({ status: true, page_size: 100 }),
          getEmpresasPrestadoras({ page_size: 100 }),
          getContratosAtivos(),
          getTiposDespesaAtivos()
        ])
        
        setEmpresas(empresasRes.data.results || empresasRes.data)
        setEmpresasPrestadoras(prestadorasRes.data.results || prestadorasRes.data)
        setContratos(contratosRes.data.results || contratosRes.data || [])
        setTiposDespesa(tiposDespesaRes.data || [])
      } catch (err) {
        console.error('Erro ao carregar opções:', err)
      }
    }
    
    loadOptions()
  }, [])

  // Verifica query param de contrato para criação com contrato pré-selecionado
  useEffect(() => {
    if (!isEditing) {
      const contratoId = searchParams.get('contrato')
      // Só usa se for um UUID válido (não 'undefined' ou vazio)
      if (contratoId && contratoId !== 'undefined' && contratoId.length > 10) {
        setFormData(prev => ({ ...prev, contrato: contratoId }))
      }
    }
  }, [isEditing, searchParams])

  // Carrega serviços do contrato quando contrato é selecionado
  useEffect(() => {
    const loadContratoData = async () => {
      // Valida que contrato é um UUID válido
      if (!formData.contrato || formData.contrato === 'undefined' || formData.contrato.length < 10) {
        setContratoSelecionado(null)
        setServicosContrato([])
        return
      }
      
      try {
        // Carrega dados do contrato e serviços disponíveis
        const [contratoRes, servicosRes] = await Promise.all([
          getContrato(formData.contrato),
          getContratoServicosDisponiveis(formData.contrato)
        ])
        
        const contrato = contratoRes.data
        setContratoSelecionado(contrato)
        setServicosContrato(servicosRes.data || [])
        
        // Preenche empresa solicitante e pagadora com base no contrato
        if (!isEditing && contrato) {
          setFormData(prev => ({
            ...prev,
            empresa_solicitante: prev.empresa_solicitante || contrato.empresa_contratante,
            empresa_pagadora: prev.empresa_pagadora || contrato.empresa_contratante,
          }))
        }
      } catch (err) {
        console.error('Erro ao carregar contrato:', err)
      }
    }
    
    loadContratoData()
  }, [formData.contrato, isEditing])

  // Carrega OS existente em modo edição
  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => ({
        ...emptyFormData,
        contrato: prev.contrato, // Mantém contrato se veio de query param
      }))
      setOsItens([])
      setDespesas([])
      return
    }

    const loadOrdemServico = async () => {
      setLoading(true)
      setError('')
      
      try {
        const [osRes, titRes, depRes, itensRes, despRes] = await Promise.all([
          getOrdemServico(osId),
          getOrdemServicoTitulares(osId),
          getOrdemServicoDependentes(osId),
          getOrdemServicoItens(osId),
          getOrdemServicoDespesas(osId)
        ])
        
        const os = osRes.data
        setOrdemServico(os)
        
        setFormData({
          data_abertura: os.data_abertura || '',
          data_fechamento: os.data_fechamento || '',
          status: os.status || 'ABERTA',
          observacao: os.observacao || '',
          contrato: os.contrato || '',
          empresa_solicitante: os.empresa_solicitante || '',
          empresa_pagadora: os.empresa_pagadora || '',
          solicitante: os.solicitante || '',
          colaborador: os.colaborador || '',
        })
        
        setTitulares(titRes.data || [])
        setDependentes(depRes.data || [])
        
        // Mapeia titulares e dependentes da OS para gerenciamento local
        setOsTitulares((titRes.data || []).map(t => ({
          ...t,
          isNew: false,
          isDeleted: false,
        })))
        setOsDependentes((depRes.data || []).map(d => ({
          ...d,
          isNew: false,
          isDeleted: false,
        })))
        
        // Mapeia itens existentes
        const itensData = (itensRes.data || []).map(item => ({
          ...item,
          isNew: false,
          isDeleted: false,
        }))
        setOsItens(itensData)
        
        // Mapeia despesas existentes
        const despesasData = (despRes.data || []).map(d => ({
          ...d,
          isNew: false,
          isDeleted: false,
        }))
        setDespesas(despesasData)
        
      } catch (err) {
        console.error('Erro ao carregar OS:', err)
        setError('Erro ao carregar ordem de serviço')
      } finally {
        setLoading(false)
      }
    }

    loadOrdemServico()
  }, [osId, isEditing])

  // Handler de mudança de campos
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Se mudou o contrato, limpa os itens de serviço
    if (name === 'contrato') {
      setOsItens([])
    }
  }, [])

  // =========================================================================
  // ITENS DA OS (serviços do contrato)
  // =========================================================================
  
  const addOSItem = useCallback(() => {
    setOsItens(prev => [...prev, { ...emptyOSItem, _tempId: Date.now() }])
  }, [])

  const removeOSItem = useCallback((index) => {
    setOsItens(prev => {
      const updated = [...prev]
      if (updated[index].isNew) {
        // Se é novo, apenas remove
        updated.splice(index, 1)
      } else {
        // Se existente, marca para deleção
        updated[index] = { ...updated[index], isDeleted: true }
      }
      return updated
    })
  }, [])

  const updateOSItemData = useCallback((index, updates) => {
    setOsItens(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
  }, [])

  const handleContratoServicoChange = useCallback((index, contratoServicoId) => {
    const contratoServico = servicosContrato.find(s => s.id === contratoServicoId)
    if (contratoServico) {
      updateOSItemData(index, {
        contrato_servico: contratoServicoId,
        servico_item: contratoServico.servico_item,
        servico_descricao: contratoServico.servico_descricao,
        valor_contrato: contratoServico.valor,
        valor_aplicado: contratoServico.valor, // Valor fixo do contrato
        quantidade_contratada: contratoServico.quantidade,
        quantidade: 1, // Reseta para 1 quando troca de serviço
      })
    }
  }, [servicosContrato, updateOSItemData])

  // Atualiza quantidade
  const handleQuantidadeChange = useCallback((index, quantidade) => {
    const valor = Math.max(1, parseInt(quantidade) || 1)
    updateOSItemData(index, { quantidade: valor })
  }, [updateOSItemData])

  // =========================================================================
  // DESPESAS
  // =========================================================================
  
  const addDespesa = useCallback(() => {
    setDespesas(prev => [...prev, { ...emptyDespesa, _tempId: Date.now() }])
  }, [])

  const removeDespesa = useCallback((index) => {
    setDespesas(prev => {
      const updated = [...prev]
      if (updated[index].isNew) {
        updated.splice(index, 1)
      } else {
        updated[index] = { ...updated[index], isDeleted: true }
      }
      return updated
    })
  }, [])

  const updateDespesaItem = useCallback((index, updates) => {
    setDespesas(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
  }, [])

  // =========================================================================
  // TITULARES DA OS
  // =========================================================================
  
  const addOSTitular = useCallback((titular) => {
    // Verifica se já está adicionado
    const jaAdicionado = osTitulares.some(t => 
      !t.isDeleted && t.titular === titular.id
    )
    if (jaAdicionado) return false
    
    setOsTitulares(prev => [...prev, {
      _tempId: Date.now(),
      titular: titular.id,
      titular_nome: titular.nome,
      titular_cpf: titular.cpf,
      observacao: '',
      isNew: true,
      isDeleted: false,
    }])
    return true
  }, [osTitulares])

  const removeOSTitular = useCallback((index) => {
    setOsTitulares(prev => {
      const updated = [...prev]
      if (updated[index].isNew) {
        // Se é novo, apenas remove
        updated.splice(index, 1)
      } else {
        // Se existente, marca para deleção
        updated[index] = { ...updated[index], isDeleted: true }
      }
      return updated
    })
  }, [])

  // =========================================================================
  // DEPENDENTES DA OS
  // =========================================================================
  
  const addOSDependente = useCallback((dependente) => {
    // Verifica se já está adicionado
    const jaAdicionado = osDependentes.some(d => 
      !d.isDeleted && d.dependente === dependente.id
    )
    if (jaAdicionado) return false
    
    setOsDependentes(prev => [...prev, {
      _tempId: Date.now(),
      dependente: dependente.id,
      dependente_nome: dependente.nome,
      dependente_cpf: dependente.cpf,
      titular_nome: dependente.titular_nome,
      observacao: '',
      isNew: true,
      isDeleted: false,
    }])
    return true
  }, [osDependentes])

  const removeOSDependente = useCallback((index) => {
    setOsDependentes(prev => {
      const updated = [...prev]
      if (updated[index].isNew) {
        // Se é novo, apenas remove
        updated.splice(index, 1)
      } else {
        // Se existente, marca para deleção
        updated[index] = { ...updated[index], isDeleted: true }
      }
      return updated
    })
  }, [])

  // =========================================================================
  // SUBMIT
  // =========================================================================

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    // Validação: contrato é obrigatório
    if (!formData.contrato) {
      setError('É necessário selecionar um contrato para criar a Ordem de Serviço')
      setSaving(false)
      return { success: false }
    }

    try {
      // Prepara dados para envio
      const dataToSend = {
        data_abertura: formData.data_abertura,
        data_fechamento: formData.data_fechamento || null,
        status: formData.status,
        observacao: formData.observacao || null,
        contrato: formData.contrato,
        empresa_solicitante: formData.empresa_solicitante || null,
        empresa_pagadora: formData.empresa_pagadora || null,
        solicitante: formData.solicitante || null,
        colaborador: formData.colaborador || null,
      }

      // Remove campos vazios (exceto contrato que é obrigatório)
      Object.keys(dataToSend).forEach(key => {
        if (key !== 'contrato' && (dataToSend[key] === '' || dataToSend[key] === null)) {
          delete dataToSend[key]
        }
      })

      let osResponse
      let currentOsId = osId
      
      if (isEditing) {
        osResponse = await updateOrdemServico(osId, dataToSend)
        currentOsId = osId
      } else {
        osResponse = await createOrdemServico(dataToSend)
        currentOsId = osResponse.data?.id
        
        // Verifica se o ID foi retornado
        if (!currentOsId) {
          console.error('ID da OS não retornado:', osResponse.data)
          setError('Erro: OS criada mas ID não foi retornado. Tente novamente.')
          setSaving(false)
          return { success: false }
        }
      }
      
      // Salvar itens da OS (apenas se tivermos um ID válido)
      for (const item of osItens) {
        if (item.isDeleted && item.id) {
          // Deletar existente
          await deleteOSItem(item.id)
        } else if (item.isNew && !item.isDeleted && item.contrato_servico) {
          // Criar novo (valor_aplicado vem do backend via contrato)
          await createOSItem({
            ordem_servico: currentOsId,
            contrato_servico: item.contrato_servico,
            quantidade: item.quantidade || 1,
          })
        } else if (!item.isNew && !item.isDeleted && item.id) {
          // Atualizar existente (só permite alterar quantidade)
          await updateOSItem(item.id, {
            contrato_servico: item.contrato_servico,
            quantidade: item.quantidade || 1,
          })
        }
      }
      
      // Salvar despesas
      for (const despesa of despesas) {
        if (despesa.isDeleted && despesa.id) {
          await deleteDespesaOS(despesa.id)
        } else if (despesa.isNew && !despesa.isDeleted && despesa.tipo_despesa && despesa.valor) {
          await createDespesaOS({
            ordem_servico: currentOsId,
            tipo_despesa: despesa.tipo_despesa,
            valor: despesa.valor,
            observacao: despesa.observacao || '',
          })
        } else if (!despesa.isNew && !despesa.isDeleted && despesa.id) {
          await updateDespesaOS(despesa.id, {
            tipo_despesa: despesa.tipo_despesa,
            valor: despesa.valor,
            observacao: despesa.observacao || '',
          })
        }
      }
      
      // Salvar titulares da OS
      for (const titular of osTitulares) {
        if (titular.isDeleted && titular.id) {
          await deleteOSTitular(titular.id)
        } else if (titular.isNew && !titular.isDeleted && titular.titular) {
          await createOSTitular({
            ordem_servico: currentOsId,
            titular: titular.titular,
            observacao: titular.observacao || '',
          })
        }
      }
      
      // Salvar dependentes da OS
      for (const dependente of osDependentes) {
        if (dependente.isDeleted && dependente.id) {
          await deleteOSDependente(dependente.id)
        } else if (dependente.isNew && !dependente.isDeleted && dependente.dependente) {
          await createOSDependente({
            ordem_servico: currentOsId,
            dependente: dependente.dependente,
            observacao: dependente.observacao || '',
          })
        }
      }
      
      // Recalcula totais
      if (currentOsId) {
        await recalcularOrdemServico(currentOsId)
      }
      
      setSuccess(isEditing ? 'Ordem de serviço atualizada com sucesso!' : 'Ordem de serviço criada com sucesso!')
      return { success: true, data: osResponse.data }
      
    } catch (err) {
      console.error('Erro ao salvar OS:', err)
      
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'object') {
          const messages = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n')
          setError(messages)
        } else {
          setError(String(errorData))
        }
      } else {
        setError('Erro ao salvar ordem de serviço')
      }
      
      return { success: false }
    } finally {
      setSaving(false)
    }
  }, [formData, isEditing, osId, osItens, despesas, osTitulares, osDependentes])

  // Calcula totais locais para preview
  const calcularTotaisLocais = useCallback(() => {
    let totalServicos = 0
    let totalDespesas = 0
    
    osItens
      .filter(item => !item.isDeleted)
      .forEach(item => {
        const valor = parseFloat(item.valor_aplicado) || parseFloat(item.valor_contrato) || 0
        const quantidade = parseInt(item.quantidade) || 1
        totalServicos += valor * quantidade
      })
    
    despesas
      .filter(d => !d.isDeleted)
      .forEach(d => {
        const valor = parseFloat(d.valor) || 0
        totalDespesas += valor
      })
    
    return {
      valor_servicos: totalServicos,
      valor_despesas: totalDespesas,
      valor_total: totalServicos + totalDespesas,
    }
  }, [osItens, despesas])

  return {
    // Form state
    formData,
    handleChange,
    handleSubmit,
    
    // Loading states
    loading,
    saving,
    error,
    success,
    
    // Mode
    isEditing,
    
    // Loaded data
    ordemServico,
    contratoSelecionado,
    titulares,
    dependentes,
    
    // Itens da OS (serviços do contrato)
    osItens,
    addOSItem,
    removeOSItem,
    updateOSItemData,
    handleContratoServicoChange,
    handleQuantidadeChange,
    
    // Despesas
    despesas,
    addDespesa,
    removeDespesa,
    updateDespesaItem,
    tiposDespesa,
    
    // Titulares da OS
    osTitulares,
    addOSTitular,
    removeOSTitular,
    
    // Dependentes da OS
    osDependentes,
    addOSDependente,
    removeOSDependente,
    
    // Options for selects
    empresas,
    empresasPrestadoras,
    contratos,
    servicosContrato,
    statusOptions,
    
    // Cálculos
    calcularTotaisLocais,
  }
}

export default useOrdemServicoForm
