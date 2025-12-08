import { useCallback, useEffect, useState } from 'react'
import { deleteDependente, getDependentes, getTitulares } from '../services/titulares'

function useDependenteList(initialTitularId) {
  const [dependentes, setDependentes] = useState([])
  const [titulares, setTitulares] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [titularFilter, setTitularFilter] = useState(initialTitularId || '')
  const [error, setError] = useState('')

  const loadTitulares = useCallback(async () => {
    try {
      const response = await getTitulares()
      setTitulares(response.data.results || response.data || [])
    } catch (err) {
      console.error('Erro ao carregar titulares:', err)
    }
  }, [])

  const loadDependentes = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (titularFilter) params.titular = titularFilter
      const response = await getDependentes(params)
      setDependentes(response.data.results || response.data || [])
      setError('')
    } catch (err) {
      setError('Erro ao carregar dependentes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, titularFilter])

  const handleDelete = useCallback(async (id, nome) => {
    const confirmado = window.confirm(`Deseja realmente excluir o dependente "${nome}"?`)
    if (!confirmado) return

    try {
      await deleteDependente(id)
      await loadDependentes()
    } catch (err) {
      setError('Erro ao excluir dependente')
      console.error(err)
    }
  }, [loadDependentes])

  useEffect(() => {
    loadTitulares()
  }, [loadTitulares])

  useEffect(() => {
    loadDependentes()
  }, [loadDependentes])

  return {
    dependentes,
    titulares,
    loading,
    search,
    titularFilter,
    error,
    setSearch,
    setTitularFilter,
    reload: loadDependentes,
    handleDelete,
  }
}

export default useDependenteList
