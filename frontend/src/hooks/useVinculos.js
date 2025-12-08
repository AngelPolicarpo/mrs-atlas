import { useCallback, useState } from 'react'

/**
 * Gerencia a lista de vínculos e textos de busca relacionados.
 */
function useVinculos(emptyVinculo) {
  const [vinculos, setVinculos] = useState([])
  const [vinculoSearchTexts, setVinculoSearchTexts] = useState({})

  const setVinculosFromApi = useCallback((items) => {
    setVinculos(items)
    setVinculoSearchTexts(() => {
      const texts = {}
      items.forEach((v, i) => {
        texts[`empresa_${i}`] = v.empresa_nome || ''
        texts[`amparo_${i}`] = v.amparo_nome || ''
        texts[`consulado_${i}`] = v.consulado_nome || ''
      })
      return texts
    })
  }, [])

  const setVinculoSearchText = useCallback((key, value) => {
    setVinculoSearchTexts(prev => ({ ...prev, [key]: value }))
  }, [])

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
  }, [emptyVinculo])

  const removeVinculo = useCallback((index) => {
    setVinculos(prev => prev
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
    setVinculos(prev => prev.map((v, i) => i === index ? { ...v, isExpanded: !v.isExpanded } : v))
  }, [])

  const handleVinculoChange = useCallback((index, e) => {
    const { name, value, type, checked } = e.target
    setVinculos(prev => prev.map((v, i) => {
      if (i !== index) return v
      return {
        ...v,
        [name]: type === 'checkbox' ? checked : value,
        ...(name === 'tipo_vinculo' && value === 'PARTICULAR' ? { empresa: '', empresa_nome: '' } : {}),
      }
    }))
  }, [])

  const updateVinculoItem = useCallback((index, updater) => {
    setVinculos(prev => prev.map((v, i) => {
      if (i !== index) return v
      return typeof updater === 'function' ? updater(v) : { ...v, ...updater }
    }))
  }, [])

  return {
    vinculos,
    vinculoSearchTexts,
    setVinculosFromApi,
    setVinculoSearchText,
    addVinculo,
    removeVinculo,
    toggleVinculoExpanded,
    handleVinculoChange,
    updateVinculoItem,
  }
}

export default useVinculos
