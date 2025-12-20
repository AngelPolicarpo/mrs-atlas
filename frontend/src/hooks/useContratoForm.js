import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  getContrato,
  createContrato,
  updateContrato,
  getContratoServicos,
  ativarContrato,
  finalizarContrato,
  cancelarContrato,
  createContratoServico,
  updateContratoServico,
  deleteContratoServico
} from '../services/contratos'
import { getEmpresas } from '../services/empresas'
import { getServicosAtivos } from '../services/ordemServico'

/**
 * Hook para gerenciar formulário de Contrato com serviços
 */
function useContratoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // Só é edição se tiver id e não for 'new'
  const isEditing = Boolean(id && id !== 'new')
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    numero: '',
    status: 'ATIVO',
    empresa_contratante: '',
    data_inicio: '',
    data_fim: '',
    observacao: ''
  })
  
  // Serviços do contrato
  const [servicosContrato, setServicosContrato] = useState([])
  const [servicosDisponiveis, setServicosDisponiveis] = useState([])
  
  // Dropdowns
  const [empresas, setEmpresas] = useState([])
  
  // Estado de UI
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Tab ativa
  const [activeTab, setActiveTab] = useState('resumo')

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadInitialData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Carregar empresas e serviços
      const [empresasRes, servicosRes] = await Promise.all([
        getEmpresas({ page_size: 1000 }),
        getServicosAtivos()
      ])
      
      setEmpresas(empresasRes.data.results || empresasRes.data)
      setServicosDisponiveis(servicosRes.data || [])
      
      // Se editando (id existe e não é 'new'), carregar dados do contrato
      if (id && id !== 'new' && id !== 'undefined') {
        const [contratoRes, servicosRes] = await Promise.all([
          getContrato(id),
          getContratoServicos(id)  // Carrega serviços via endpoint dedicado
        ])
        const contrato = contratoRes.data
        
        setFormData({
          numero: contrato.numero || '',
          status: contrato.status || 'ATIVO',
          empresa_contratante: contrato.empresa_contratante || '',
          data_inicio: contrato.data_inicio || '',
          data_fim: contrato.data_fim || '',
          observacao: contrato.observacao || ''
        })
        
        // Usa a resposta do endpoint dedicado para consistência
        setServicosContrato(servicosRes.data || [])
      } else {
        // Modo criação - resetar formulário e aplicar query params (ex: ?empresa_contratante=1)
        const params = new URLSearchParams(location.search)
        setFormData({
          numero: '',
          status: 'ATIVO',
          empresa_contratante: params.get('empresa_contratante') || '',
          data_inicio: '',
          data_fim: '',
          observacao: ''
        })
        setServicosContrato([])
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      // Só mostra erro se não for modo criação
      if (id && id !== 'new') {
        setError('Erro ao carregar dados do contrato')
      }
    } finally {
      setLoading(false)
    }
  }

  // Atualizar campo do formulário
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  // Salvar contrato
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      // Monta payload removendo campos vazios
      const payload = {}
      
      if (formData.numero) payload.numero = formData.numero
      if (formData.status) payload.status = formData.status
      if (formData.empresa_contratante) payload.empresa_contratante = formData.empresa_contratante
      if (formData.data_inicio) payload.data_inicio = formData.data_inicio
      if (formData.data_fim) payload.data_fim = formData.data_fim
      if (formData.observacao) payload.observacao = formData.observacao
      
      // Validações básicas no frontend
      if (!payload.numero) {
        setError('Número do contrato é obrigatório')
        setSaving(false)
        return
      }
      if (!payload.empresa_contratante) {
        setError('Empresa contratante é obrigatória')
        setSaving(false)
        return
      }
      if (!payload.data_inicio) {
        setError('Data de início é obrigatória')
        setSaving(false)
        return
      }
      
      if (isEditing) {
        await updateContrato(id, payload)
        setSuccess('Contrato atualizado com sucesso!')
      } else {
        const response = await createContrato(payload)
        const novoId = response.data?.id
        
        if (!novoId) {
          console.error('ID do contrato não retornado:', response.data)
          setError('Erro: contrato criado mas ID não foi retornado')
          setSaving(false)
          return
        }
        
        setSuccess('Contrato criado com sucesso!')
        // Redirecionar para edição do contrato criado
        setTimeout(() => {
          navigate(`/contratos/${novoId}`, { replace: true })
        }, 1500)
      }
    } catch (err) {
      console.error('Erro ao salvar contrato:', err.response?.data)
      const errorData = err.response?.data
      let msg = 'Erro ao salvar contrato'
      
      if (errorData) {
        if (typeof errorData === 'string') {
          msg = errorData
        } else if (errorData.detail) {
          msg = errorData.detail
        } else {
          // Extrai mensagens de erro de cada campo
          const errors = []
          for (const [field, messages] of Object.entries(errorData)) {
            const fieldMessages = Array.isArray(messages) ? messages.join(', ') : messages
            errors.push(`${field}: ${fieldMessages}`)
          }
          if (errors.length > 0) {
            msg = errors.join('\n')
          }
        }
      }
      
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  // Actions de status
  const handleAtivar = async () => {
    try {
      await ativarContrato(id)
      await loadInitialData()
      setSuccess('Contrato ativado!')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao ativar contrato')
    }
  }

  const handleFinalizar = async () => {
    if (!window.confirm('Deseja finalizar este contrato?')) return
    try {
      await finalizarContrato(id)
      await loadInitialData()
      setSuccess('Contrato finalizado!')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao finalizar contrato')
    }
  }

  const handleCancelar = async () => {
    if (!window.confirm('Deseja cancelar este contrato? Esta ação não pode ser desfeita.')) return
    try {
      await cancelarContrato(id)
      await loadInitialData()
      setSuccess('Contrato cancelado!')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cancelar contrato')
    }
  }

  // Gerenciar serviços do contrato
  const addServico = async (servicoId, valor, quantidade = 1) => {
    try {
      await createContratoServico({
        contrato: id,
        servico: servicoId,
        valor,
        quantidade,
        ativo: true
      })
      // Recarregar serviços
      const res = await getContratoServicos(id)
      setServicosContrato(res.data || [])
      setSuccess('Serviço adicionado!')
    } catch (err) {
      setError('Erro ao adicionar serviço')
    }
  }

  const updateServicoContrato = async (servicoContratoId, data) => {
    try {
      await updateContratoServico(servicoContratoId, data)
      const res = await getContratoServicos(id)
      setServicosContrato(res.data || [])
      setSuccess('Serviço atualizado!')
    } catch (err) {
      setError('Erro ao atualizar serviço')
    }
  }

  const removeServico = async (servicoContratoId) => {
    if (!window.confirm('Remover este serviço do contrato?')) return
    try {
      await deleteContratoServico(servicoContratoId)
      const res = await getContratoServicos(id)
      setServicosContrato(res.data || [])
      setSuccess('Serviço removido!')
    } catch (err) {
      setError('Erro ao remover serviço')
    }
  }

  return {
    id,  // ID do contrato (de useParams)
    formData,
    servicosContrato,
    servicosDisponiveis,
    empresas,
    loading,
    saving,
    error,
    success,
    isEditing,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
    handleAtivar,
    handleFinalizar,
    handleCancelar,
    addServico,
    updateServicoContrato,
    removeServico,
    setError,
    setSuccess
  }
}

export default useContratoForm
