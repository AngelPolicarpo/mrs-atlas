import { usePermissions, useActiveContext } from '../context/PermissionContext'

/**
 * Componente para exibir/trocar sistema ativo.
 * Aparece no header mostrando o contexto atual do usuário.
 * 
 * Modelo Simplificado:
 * - Exibe Sistema selecionado
 * - Exibe Cargo (auto-selecionado pelo maior)
 * - Permite trocar de sistema se tiver múltiplos
 * 
 * Props:
 *   compact: Exibe versão compacta
 *   showCargo: Exibe o cargo do usuário
 */
function DepartmentSwitcher({ compact = false, showCargo = true }) {
  const { 
    sistemasDisponiveis, 
    hasSingleSistema,
  } = usePermissions()
  
  const { 
    activeSistema,
    activeSistemaInfo,
    currentCargo,
    setActiveSistema,
  } = useActiveContext()

  // Não exibe se não tiver contexto ativo
  if (!activeSistema) {
    return null
  }

  const canChangeSistema = !hasSingleSistema && sistemasDisponiveis.length > 1

  /**
   * Muda o sistema ativo
   */
  const handleSistemaChange = (e) => {
    const novoCodigo = e.target.value
    if (novoCodigo !== activeSistema) {
      setActiveSistema(novoCodigo)
    }
  }

  if (compact) {
    return (
      <div className="context-switcher-compact">
        {/* Sistema */}
        {canChangeSistema ? (
          <select
            value={activeSistema}
            onChange={handleSistemaChange}
            className="context-select sistema-select"
            title="Trocar sistema"
          >
            {sistemasDisponiveis.map((sistema) => (
              <option key={sistema.codigo} value={sistema.codigo}>
                {sistema.icone} {sistema.nome}
              </option>
            ))}
          </select>
        ) : (
          <span className="current-sistema">
            <span className="sistema-icon">{activeSistemaInfo?.icone}</span>
            <span className="sistema-name">{activeSistemaInfo?.nome}</span>
          </span>
        )}

        {/* Cargo */}
        {showCargo && currentCargo && (
          <span className="cargo-badge" title={`Cargo: ${currentCargo.nome}`}>
            {currentCargo.nome}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="context-switcher">
      {/* Sistema */}
      <div className="context-section sistema-section">
        <span className="context-label">Sistema:</span>
        {canChangeSistema ? (
          <select
            value={activeSistema}
            onChange={handleSistemaChange}
            className="context-select"
            title="Trocar sistema"
          >
            {sistemasDisponiveis.map((sistema) => (
              <option key={sistema.codigo} value={sistema.codigo}>
                {sistema.icone} {sistema.nome}
              </option>
            ))}
          </select>
        ) : (
          <span className="current-context">
            <span className="context-icon">{activeSistemaInfo?.icone}</span>
            <span className="context-name">{activeSistemaInfo?.nome}</span>
          </span>
        )}
      </div>

      {/* Cargo */}
      {showCargo && currentCargo && (
        <div className="context-section cargo-section">
          <span className="cargo-badge-lg" title={`Permissões: ${currentCargo.permissoes?.join(', ')}`}>
            {currentCargo.nome}
          </span>
        </div>
      )}
    </div>
  )
}

export default DepartmentSwitcher
