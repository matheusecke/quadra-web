import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import api from '../services/api'
import type { ApiResponse, MePayload } from '../types/api'

async function fetchMe(): Promise<MePayload> {
  const { data } = await api.get<ApiResponse<MePayload>>('/auth/me')
  return data.data
}

export function HomePage() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  })

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1rem' }}>
        <h1>Home</h1>
        {isLoading && <p>Carregando...</p>}
        {isError && <p>Erro ao carregar dados do usuário.</p>}
        {user && (
          <div>
            <p><strong>Nome:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            {user.organizationId !== null && (
              <p><strong>Organização ID:</strong> {user.organizationId}</p>
            )}
            {user.role && <p><strong>Papel:</strong> {user.role}</p>}
            {user.isSystemAdmin && <p><strong>Admin do sistema</strong></p>}
          </div>
        )}
      </main>
    </div>
  )
}
