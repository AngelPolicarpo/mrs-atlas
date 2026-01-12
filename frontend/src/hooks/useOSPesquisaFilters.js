import { useState, useCallback } from 'react'

const initialFilters = {
  // Busca geral
  searchTerm: '',
  searchField: 'todos',
  
  // Status
  status: '',
  
  // Contrato e Empresa
  contrato: '',
  contratoText: '',
  empresaSolicitante: '',
  empresaSolicitanteText: '',
  empresaPagadora: '',
  empresaPagadoraText: '',
  centroCustos: '',
  centroCustosText: '',
  
  // Usuários (Solicitante e Colaborador)
  solicitante: '',
  solicitanteText: '',
  colaborador: '',
  colaboradorText: '',
  
  // Titular/Dependente vinculado
  titular: '',
  titularText: '',
  dependente: '',
  dependenteText: '',
  
  // Período de abertura
  dataAberturaDe: '',
  dataAberturaAte: '',
  
  // Período de fechamento
  dataFechamentoDe: '',
  dataFechamentoAte: '',
  
  // Valores
  valorMinimo: '',
  valorMaximo: '',
}

/**
 * Hook para gerenciar estado de filtros da pesquisa de Ordens de Serviço
 * Responsabilidades:
 * - Estado dos filtros
 * - Handlers para mudança de filtros
 * - Limpeza de filtros
 */
function useOSPesquisaFilters() {
  const [filters, setFilters] = useState(initialFilters)

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleTextChange = useCallback((fieldName, value) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: value,
      // Limpar campo de ID correspondente quando texto muda
      [fieldName.replace('Text', '')]: '',
    }))
  }, [])

  const handleItemSelect = useCallback((fieldName, name, id) => {
    setFilters(prev => {
      const updates = { [fieldName]: id }
      // Adiciona o campo Text se existir
      const textFieldName = `${fieldName}Text`
      if (textFieldName in prev) {
        updates[textFieldName] = name
      }
      return { ...prev, ...updates }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  const setFilter = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }, [])

  return {
    filters,
    handleFilterChange,
    handleTextChange,
    handleItemSelect,
    clearFilters,
    setFilter,
  }
}

export default useOSPesquisaFilters
