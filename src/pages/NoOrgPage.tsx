import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function NoOrgPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <h1>Sem organização</h1>
      <p>
        Seu usuário não está vinculado a nenhuma organização.
        Entre em contato com um administrador.
      </p>
      <button onClick={handleLogout}>Sair</button>
    </div>
  )
}
