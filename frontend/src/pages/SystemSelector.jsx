import { usePermissions, useActiveContext } from '../context/PermissionContext'
import { useAuth } from '../context/AuthContext'

/**
 * Tela de seleção de sistema.
 * Exibida quando o usuário tem acesso a múltiplos sistemas.
 * 
 * Fluxo simplificado:
 * - Usuário escolhe apenas o SISTEMA
 * - Departamento e cargo são auto-selecionados pelo cargo mais alto
 */
function SystemSelector() {
  const { user } = useAuth()
  const { sistemasDisponiveis } = usePermissions()
  const { setActiveSistema } = useActiveContext()

  /**
   * Quando seleciona um sistema
   */
  const handleSelectSistema = (sistema) => {
    setActiveSistema(sistema.codigo)
  }

  return (
    <div className="system-selector-page">
      <div className="system-selector-container">
        <div className="system-selector-header">
          <h1>👋 Olá, {user?.nome?.split(' ')[0] || 'Usuário'}!</h1>
          <p>Selecione o sistema que deseja acessar:</p>
        </div>

        <div className="system-cards">
          {sistemasDisponiveis.map((sistema) => (
            <button
              key={sistema.codigo}
              className="system-card"
              onClick={() => handleSelectSistema(sistema)}
              style={{ '--system-color': sistema.cor }}
            >
              <div className="system-icon">{sistema.icone}</div>
              <div className="system-info">
                <h2 className="system-name">{sistema.nome}</h2>
                <p className="system-description">{sistema.descricao}</p>
                <div className="system-meta">
                </div>
              </div>
              <div className="system-arrow">→</div>
            </button>
          ))}
        </div>

        <div className="system-selector-footer">
          <p className="text-muted">
            Você tem acesso a {sistemasDisponiveis.length} sistema{sistemasDisponiveis.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SystemSelector
