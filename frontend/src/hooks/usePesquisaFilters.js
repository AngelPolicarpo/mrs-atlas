import { useState, useCallback } from 'react'

const initialFilters = {
  searchTerm: '',
  searchField: 'todos',
  nacionalidade: '',
  consulado: '',
  empresa: '',
  empresaText: '',
  tipoVinculo: '',
  status: '',
  tipoEvento: '',
  periodo: '',
  periodoAnterior: false,
  periodoPosterior: true,
  dataDe: '',
  dataAte: '',
}

/**
 * Hook para gerenciar estado de filtros da pesquisa
 * Responsabilidades:
 * - Estado dos filtros
 * - Handlers para mudança de filtros
 * - Limpeza de filtros
 */
function usePesquisaFilters() {
  const [filters, setFilters] = useState(initialFilters)

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleCheckboxChange = useCallback((e) => {
    const { name, checked } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: checked,
      // Se selecionar uma direção, desselecionar a outra
      ...(name === 'periodoPosterior' && checked && { periodoAnterior: false }),
      ...(name === 'periodoAnterior' && checked && { periodoPosterior: false }),
    }))
  }, [])

  const handleTextChange = useCallback((fieldName, value) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: value,
      // Limpar campo de ID correspondente
      [fieldName.replace('Text', '')]: '',
    }))
  }, [])

  const handleItemSelect = useCallback((fieldName, name, id) => {
    setFilters(prev => {
      const updates = { [fieldName]: id }
      // Só adiciona o campo Text se existir (para empresa)
      if (fieldName === 'empresa') {
        updates[`${fieldName}Text`] = name
      }
      return { ...prev, ...updates }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  const setPeriodoFieldsFromPeriodo = useCallback((periodo, dataDe, dataAte) => {
    setFilters(prev => ({
      ...prev,
      periodo: periodo ? '' : prev.periodo,
      dataDe: dataDe ? dataDe : (periodo ? '' : prev.dataDe),
      dataAte: dataAte ? dataAte : (periodo ? '' : prev.dataAte),
    }))
  }, [])

  return {
    filters,
    handleFilterChange,
    handleCheckboxChange,
    handleTextChange,
    handleItemSelect,
    clearFilters,
    setPeriodoFieldsFromPeriodo,
  }
}

export default usePesquisaFilters
