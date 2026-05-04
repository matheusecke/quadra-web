import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Sidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside
      style={{
        width: '200px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1rem',
        borderRight: '1px solid #ccc',
      }}
    >
      <nav>
        <button onClick={() => navigate('/home')}>Home</button>
      </nav>
      <button onClick={handleLogout}>Logout</button>
    </aside>
  )
}
