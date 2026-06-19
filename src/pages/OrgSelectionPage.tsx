import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs } from '../components/ui/Tabs/Tabs'
import { useAuth } from '../hooks/useAuth'
import { InviteList } from './org-selection/InviteList'
import { getInitials } from './org-selection/orgSelectionUtils'
import { useScrollChrome } from './org-selection/useScrollChrome'
import { useOrgInvites } from './org-selection/useOrgInvites'
import type { InviteDecision } from '../types/api'
import type { OrgSelectionTab } from './org-selection/types'
import s from './OrgSelectionPage.module.css'

export function OrgSelectionPage() {
  const { organizations, user, chooseOrg, refreshOrganizations, logout } = useAuth()
  const navigate = useNavigate()
  const {
    pendingInvites,
    pendingCount,
    isLoading: invitesLoading,
    isError: invitesError,
    errorMessage: invitesErrorMessage,
    actionInviteId,
    actionError,
    refetch: refetchInvites,
    resolveInvite,
  } = useOrgInvites()

  const [query, setQuery] = useState('')
  const [selectingId, setSelectingId] = useState<number | null>(null)
  const [mainTab, setMainTab] = useState<OrgSelectionTab>('organizations')
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const {
    scrollRef: organizationsScrollRef,
    state: organizationsScrollState,
    refresh: refreshOrganizationsScroll,
  } = useScrollChrome()

  const filtered = query.trim()
    ? organizations.filter((o) =>
        o.organizationName.toLowerCase().includes(query.toLowerCase()),
      )
    : organizations

  useEffect(() => {
    refreshOrganizationsScroll(false)
  }, [filtered.length, refreshOrganizationsScroll])

  const handleSelect = async (organizationId: number) => {
    if (selectingId !== null) return
    setSelectingId(organizationId)
    try {
      await chooseOrg(organizationId)
      navigate('/home')
    } finally {
      setSelectingId(null)
    }
  }

  const handleRefreshOrganizations = async () => {
    setRefreshError(null)
    try {
      await refreshOrganizations()
    } catch {
      setRefreshError('Não foi possível atualizar a lista de organizações.')
    }
  }

  const handleResolveInvite = async (inviteId: number, decision: InviteDecision) => {
    try {
      const result = await resolveInvite(inviteId, decision)
      if (result === 'accepted') {
        await handleRefreshOrganizations()
      }
    } catch {
      // useOrgInvites owns the recoverable action error shown in InviteList.
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
  const mainTabs = [
    { id: 'organizations', label: 'Organizações' },
    { id: 'invites', label: `Convites (${pendingCount})` },
  ]

  const renderOrganizationPicker = () => (
    <>
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

      <p className={s.listMeta}>
        {filtered.length} {filtered.length === 1 ? 'organização' : 'organizações'}
      </p>

      <div
        className={`${s.listWrap} ${organizationsScrollState.fadeTop ? s.fadeTop : s.noFadeTop} ${
          organizationsScrollState.fadeBottom ? '' : s.noFadeBottom
        }`}
        role="region"
        aria-label="Lista de organizações"
      >
        <div ref={organizationsScrollRef} className={s.orgList}>
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

        {organizationsScrollState.canScroll && (
          <div
            className={`${s.scrollbar} ${
              organizationsScrollState.isScrolling ? s.scrollbarVisible : ''
            }`}
            aria-hidden="true"
          >
            <div
              className={s.scrollbarThumb}
              style={{
                height: organizationsScrollState.thumbHeight,
                transform: `translateY(${organizationsScrollState.thumbTop}px)`,
              }}
            />
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <div className={s.header}>
          <p className={s.brand}>Quadra</p>
          <h1 className={s.title}>Selecione a organização</h1>
          <p className={s.subtitle}>Escolha o contexto que deseja acessar nesta sessão.</p>
        </div>

        <Tabs
          tabs={mainTabs}
          activeTab={mainTab}
          onChange={(id) => setMainTab(id as OrgSelectionTab)}
        />

        {mainTab === 'organizations' ? (
          renderOrganizationPicker()
        ) : (
          <section className={s.inviteTab} aria-label="Convites pendentes" role="region">
            <div className={s.inviteHeader}>
              <div>
                <p className={s.kicker}>Convites</p>
                <h2 className={s.inviteTitle}>Afiliações pendentes</h2>
              </div>
            </div>
            <InviteList
              invites={pendingInvites}
              isLoading={invitesLoading}
              isError={invitesError}
              errorMessage={invitesErrorMessage}
              actionInviteId={actionInviteId}
              actionError={actionError}
              onRetry={refetchInvites}
              onResolveInvite={handleResolveInvite}
            />
          </section>
        )}

        {refreshError && (
          <p className={s.refreshError} role="alert">
            {refreshError}
            <button type="button" className={s.refreshErrorRetry} onClick={handleRefreshOrganizations}>
              Tentar atualizar
            </button>
          </p>
        )}

        <div className={s.footer}>
          <button type="button" className={s.logoutBtn} onClick={handleLogout}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
