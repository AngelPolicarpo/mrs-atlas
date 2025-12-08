import { useState, useEffect, useCallback } from 'react'
import { getTitulares, deleteTitular } from '../services/titulares'

/**
 * Hook gerencia toda a lógica da lista de Titulares
 * Responsabilidades:
 * - Carregar lista de titulares (com busca)
 * - Deletar titular
 * - Gerenciar estado de carregamento e erros
 */
function useTitularList() {
  const [titulares, setTitulares] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadTitulares()
  }, [search])

  async function loadTitulares() {
    try {
      setLoading(true)
      const params = search ? { search } : {}
      const response = await getTitulares(params)
      setTitulares(response.data.results || response.data)
    } catch (err) {
      setError('Erro ao carregar titulares')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = useCallback(async (id, nome) => {
    if (!window.confirm(`Deseja realmente excluir o titular "${nome}"?`)) {
      return
    }

    try {
      await deleteTitular(id)
      loadTitulares()
    } catch (err) {
      setError('Erro ao excluir titular')
      console.error(err)
    }
  }, [])

  return {
    titulares,
    loading,
    search,
    setSearch,
    error,
    handleDelete,
  }
}

export default useTitularList
