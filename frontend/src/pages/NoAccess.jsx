import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

/**
 * Página exibida quando o usuário não tem acesso a nenhum sistema.
 * Isso acontece quando o usuário foi criado mas não tem vínculos configurados.
 */
function NoAccess() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="no-access-page">
      <div className="no-access-container">
        <div className="no-access-icon">🚫</div>
        <h1>Acesso Não Configurado</h1>
        <p>
          Olá, <strong>{user?.nome || user?.email}</strong>!
        </p>
        <p>
          Sua conta foi criada, mas você ainda não tem acesso a nenhum sistema.
        </p>
        <p className="text-muted">
          Entre em contato com o administrador para solicitar acesso aos sistemas necessários.
        </p>
        
        <div className="no-access-actions">
          <button className="btn btn-primary" onClick={handleLogout}>
            Sair e Tentar Novamente
          </button>
        </div>

        <div className="no-access-help">
          <p className="text-muted small">
            Se você acredita que isso é um erro, verifique com o administrador do sistema
            se seus vínculos de acesso foram configurados corretamente.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NoAccess
