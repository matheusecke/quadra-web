import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import s from './OrgSelectionPage.module.css'

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  const a = words[0]?.[0] ?? ''
  const b = words[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

export function OrgSelectionPage() {
  const { organizations, user, chooseOrg, logout } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [selectingId, setSelectingId] = useState<number | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? organizations.filter((o) =>
        o.organizationName.toLowerCase().includes(query.toLowerCase()),
      )
    : organizations

  const updateFades = useCallback(() => {
    const list = listRef.current
    const wrap = wrapRef.current
    if (!list || !wrap) return

    const atTop = list.scrollTop <= 2
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 2

    wrap.classList.toggle(s.noFadeTop, atTop)
    wrap.classList.toggle(s.fadeTop, !atTop)
    wrap.classList.toggle(s.noFadeBottom, atBottom)
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.addEventListener('scroll', updateFades, { passive: true })
    window.addEventListener('resize', updateFades)
    updateFades()
    return () => {
      list.removeEventListener('scroll', updateFades)
      window.removeEventListener('resize', updateFades)
    }
  }, [updateFades])

  useEffect(() => {
    updateFades()
  }, [filtered.length, updateFades])

  const handleSelect = async (organizationId: number) => {
    if (selectingId !== null) return
    setSelectingId(organizationId)
    try {
      await chooseOrg(organizationId)
      navigate('/select-org')
    } finally {
      setSelectingId(null)
    }
  }

  const handleAdminEntry = () => {
    navigate('/admin')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isSelecting = selectingId !== null

  return (
    <div className={s.page}>
      <div className={s.shell}>
        {/* Header */}
        <div className={s.header}>
          <p className={s.brand}>Quadra</p>
          <h1 className={s.title}>Selecione a organização</h1>
          <p className={s.subtitle}>Escolha o contexto que deseja acessar nesta sessão.</p>
        </div>

        {/* Search */}
        <div className={s.searchWrap}>
          <span className={s.searchIcon} aria-hidden="true">⌕</span>
          <input
            className={s.searchInput}
            type="search"
            placeholder="Buscar organização"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar organização"
          />
          {query && (
            <button
              type="button"
              className={s.searchClear}
              onClick={() => setQuery('')}
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        {/* List count */}
        <p className={s.listMeta}>
          {filtered.length} {filtered.length === 1 ? 'organização' : 'organizações'}
        </p>

        {/* Scrollable list */}
        <div
          ref={wrapRef}
          className={`${s.listWrap} ${s.noFadeTop}`}
          role="region"
          aria-label="Lista de organizações"
        >
          <div ref={listRef} className={s.orgList}>
            {/* Admin entry — only when user is system admin */}
            {user?.isSystemAdmin && (
              <button
                type="button"
                className={s.adminEntry}
                onClick={handleAdminEntry}
                aria-label="Entrar como administrador do sistema"
              >
                <div className={s.adminEntryLeft}>
                  <div className={s.adminDot} aria-hidden="true" />
                  <span className={s.adminLabel}>Entrar como administrador do sistema</span>
                </div>
                <span className={s.adminArrow} aria-hidden="true">→</span>
              </button>
            )}

            {filtered.length === 0 ? (
              <div className={s.empty}>
                <p className={s.emptyText}>
                  {organizations.length === 0
                    ? 'Você não faz parte de nenhuma organização.'
                    : 'Nenhuma organização encontrada.'}
                </p>
              </div>
            ) : (
              filtered.map((org) => (
                <button
                  key={org.organizationId}
                  type="button"
                  className={s.orgCard}
                  onClick={() => handleSelect(org.organizationId)}
                  disabled={isSelecting}
                  aria-label={`Entrar em ${org.organizationName}`}
                >
                  <div className={s.orgCardLeft}>
                    <div className={s.avatar} aria-hidden="true">
                      {getInitials(org.organizationName)}
                    </div>
                    <p className={s.orgName}>{org.organizationName}</p>
                  </div>
                  <div className={s.orgCardRight}>
                    <span className={s.roleBadge}>{org.role}</span>
                    <span className={s.arrow} aria-hidden="true">→</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={s.footer}>
          <button type="button" className={s.logoutBtn} onClick={handleLogout}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
