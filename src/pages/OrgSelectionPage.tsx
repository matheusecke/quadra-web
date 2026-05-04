import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function OrgSelectionPage() {
  const { organizations, chooseOrg } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSelect = async (organizationId: number) => {
    setLoading(true)
    try {
      await chooseOrg(organizationId)
      navigate('/home')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Selecione a organização</h1>
      <ul>
        {organizations.map((org) => (
          <li key={org.organizationId}>
            <button onClick={() => handleSelect(org.organizationId)} disabled={loading}>
              {org.organizationName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
