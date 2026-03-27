import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth, logout } from 'wasp/client/auth'
import { apiFetch } from '../apiFetch'
import {
  Scale, Archive, BookMarked, BookOpen, FileText, ScrollText,
  Bell, Search, Menu, ChevronLeft, ChevronRight, LogOut, Settings,
} from 'lucide-react'

type NavItem = {
  label: string
  icon: React.ReactNode
  href: string
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Intelligence',  icon: <Scale size={16} />,       href: '/intelligence' },
  { label: 'Case Library',  icon: <BookMarked size={16} />,  href: '/library' },
  { label: 'Legislation',   icon: <ScrollText size={16} />,  href: '/legislation' },
  { label: 'Archive',       icon: <Archive size={16} />,     href: '/archive' },
  { label: 'Citations',     icon: <BookOpen size={16} />,    href: '/citations', disabled: true },
  { label: 'Reports',       icon: <FileText size={16} />,    href: '/reports',   disabled: true },
]

type NotifCase = {
  id: string
  significanceScore: number
  primaryArea: string
  case: { id: string; citation: string; caseName: string; courtCode?: string }
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [topSearch, setTopSearch] = useState('')

  // Sidebar collapse
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false)

  // Account dropdown
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [notifItems, setNotifItems] = useState<NotifCase[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onResize() {
      const w = window.innerWidth
      setIsDesktop(w >= 768)
      if (w < 1024) setCollapsed(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Fetch notification count on mount
  useEffect(() => {
    apiFetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => { setNotifItems(d.cases ?? []); setNotifCount(d.count ?? 0) })
      .catch(() => {})
  }, [])

  // Click-away for both dropdowns
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountOpen && accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [accountOpen, notifOpen])

  function openNotifications() {
    const opening = !notifOpen
    setNotifOpen(opening)
    if (opening && notifCount > 0) {
      apiFetch('/api/notifications/seen', { method: 'POST' }).catch(() => {})
      setNotifCount(0)
    }
  }

  const email = user?.getFirstProviderUserId() ?? ''
  const displayName = (user as any)?.displayName ?? null
  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()
  const plan = (user as any)?.plan ?? 'free'
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'team' ? 'Team' : 'Free'

  const sidebarWidth = collapsed ? '64px' : '220px'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,28,26,0.4)', zIndex: 40 }}
        />
      )}

      {/* ── Sidebar ── */}
      {(isDesktop || mobileOpen) && (
        <aside
          style={{
            width: mobileOpen ? '220px' : sidebarWidth,
            backgroundColor: 'var(--surface-container-low)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
            position: 'fixed', top: 0, bottom: 0,
            left: 0, zIndex: 50,
            transition: 'width 200ms ease',
            overflowX: 'hidden',
          }}
        >
          {/* Logo wordmark */}
          <div style={{
            padding: collapsed && !mobileOpen ? '22px 0' : '22px 16px',
            textAlign: collapsed && !mobileOpen ? 'center' : 'left',
          }}>
            {!collapsed || mobileOpen ? (
              <>
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--secondary-container)', lineHeight: 1, margin: 0,
                }}>
                  BenchWatch
                </p>
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 400,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--on-surface-variant)', marginTop: '5px', marginBottom: 0,
                }}>
                  Legal Intelligence
                </p>
              </>
            ) : (
              <Scale size={18} color="var(--secondary-container)" />
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '8px 0' }}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={location.pathname === item.href}
                collapsed={collapsed && !mobileOpen}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>

          {/* Bottom — collapse chevron only */}
          {isDesktop && (
            <div style={{ padding: collapsed ? '16px 0' : '16px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
              <button
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--on-surface-variant)', padding: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--rounded-md)',
                  opacity: 0.5,
                }}
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
          )}
        </aside>
      )}

      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          marginLeft: isDesktop ? sidebarWidth : '0px',
          display: 'flex', flexDirection: 'column', minHeight: '100vh',
          transition: 'margin-left 200ms ease',
        }}
      >
        {/* Top bar */}
        <header
          style={{
            height: 'var(--topbar-height)',
            backgroundColor: 'var(--surface-container-lowest)',
            display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: '16px',
            position: 'sticky', top: 0, zIndex: 30,
          }}
        >
          {/* Mobile hamburger */}
          {!isDesktop && (
            <button
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '4px' }}
            >
              <Menu size={20} />
            </button>
          )}

          {/* Page breadcrumb */}
          <span className="label-md" style={{ color: 'var(--on-surface-variant)', minWidth: '80px' }}>
            {NAV_ITEMS.find((n) => location.pathname.startsWith(n.href))?.label ?? 'BenchWatch'}
          </span>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', pointerEvents: 'none' }} />
            <input
              type="search"
              aria-label="Search case analyses"
              placeholder="Search case analyses..."
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && topSearch.trim()) {
                  navigate(`/library?q=${encodeURIComponent(topSearch.trim())}`)
                  setTopSearch('')
                }
              }}
              style={{
                width: '100%', padding: '7px 12px 7px 32px',
                backgroundColor: 'var(--surface-container-low)',
                border: '1px solid rgba(70,70,77,0.15)',
                borderRadius: 'var(--rounded-md)',
                fontFamily: 'var(--font-sans)', fontSize: '13px',
                color: 'var(--on-surface)', outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                aria-label="Notifications"
                onClick={openNotifications}
                style={{
                  width: '32px', height: '32px', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: notifOpen ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                  borderRadius: 'var(--rounded-md)',
                }}
              >
                <Bell size={16} />
                {notifCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: 'var(--secondary-container)',
                    border: '1.5px solid var(--surface-container-lowest)',
                  }} />
                )}
              </button>

              {/* Notifications dropdown */}
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '320px', maxHeight: '400px', overflowY: 'auto',
                  backgroundColor: 'var(--surface-container-lowest)',
                  border: '1px solid var(--surface-dim)',
                  borderRadius: 'var(--rounded-lg)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                  zIndex: 100,
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--surface-dim)' }}>
                    <p className="label-md" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>New Decisions</p>
                  </div>

                  {notifItems.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--on-surface-variant)', margin: 0 }}>
                        No new significant decisions since your last visit
                      </p>
                    </div>
                  ) : (
                    <>
                      {notifItems.map((item, i) => (
                        <Link
                          key={item.id}
                          to="/archive"
                          onClick={() => setNotifOpen(false)}
                          style={{
                            display: 'block', padding: '12px 16px', textDecoration: 'none',
                            borderBottom: i < notifItems.length - 1 ? '1px solid var(--surface-container-low)' : 'none',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <SignifBadge score={item.significanceScore} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                              {item.case.courtCode}
                            </span>
                          </div>
                          <p style={{
                            margin: 0, fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
                            color: 'var(--on-surface)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {item.case.caseName}
                          </p>
                          <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                            {item.case.citation}
                          </p>
                        </Link>
                      ))}
                      <Link
                        to="/archive"
                        onClick={() => setNotifOpen(false)}
                        style={{
                          display: 'block', padding: '10px 16px', textDecoration: 'none',
                          borderTop: '1px solid var(--surface-dim)',
                          fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
                          color: 'var(--secondary-container)', textAlign: 'center',
                        }}
                      >
                        View all in Archive →
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Account avatar + dropdown */}
            <div ref={accountRef} style={{ position: 'relative' }}>
              <button
                aria-label="Account menu"
                onClick={() => setAccountOpen((o) => !o)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: 'var(--primary-container)', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
                  flexShrink: 0, cursor: 'pointer', border: 'none',
                }}
              >
                {initials}
              </button>

              {/* Account dropdown */}
              {accountOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '200px',
                  backgroundColor: 'var(--surface-container-lowest)',
                  border: '1px solid var(--surface-dim)',
                  borderRadius: 'var(--rounded-lg)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                  zIndex: 100, overflow: 'hidden',
                }}>
                  {/* User info */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--surface-dim)' }}>
                    {displayName && (
                      <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)' }}>
                        {displayName}
                      </p>
                    )}
                    <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email}
                    </p>
                    <span className="label-sm" style={{ color: 'var(--secondary-container)', marginTop: '4px', display: 'inline-block' }}>
                      {planLabel} Plan
                    </span>
                  </div>

                  {/* Actions */}
                  <Link
                    to="/settings"
                    onClick={() => setAccountOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', textDecoration: 'none',
                      fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                      color: 'var(--on-surface)',
                    }}
                  >
                    <Settings size={14} color="var(--on-surface-variant)" />
                    Account Settings
                  </Link>
                  <button
                    onClick={() => { setAccountOpen(false); logout() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                      borderTop: '1px solid var(--surface-dim)',
                      fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                      color: 'var(--on-surface)', textAlign: 'left',
                    }}
                  >
                    <LogOut size={14} color="var(--on-surface-variant)" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '40px 32px', maxWidth: '960px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({
  item, isActive, collapsed, onNavigate,
}: {
  item: NavItem; isActive: boolean; collapsed: boolean; onNavigate: () => void
}) {
  const [hovered, setHovered] = useState(false)

  const inner = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={item.disabled ? 'Coming Soon' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: collapsed ? '10px 0' : '10px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        cursor: item.disabled ? 'default' : 'pointer',
        backgroundColor: hovered && !item.disabled ? 'var(--surface-container)' : 'transparent',
        transition: 'background-color 150ms',
        borderLeft: isActive ? '3px solid var(--secondary-container)' : '3px solid transparent',
        color: item.disabled
          ? 'var(--surface-dim)'
          : isActive
          ? 'var(--secondary-container)'
          : 'var(--on-surface-variant)',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
      {!collapsed && <span className="label-lg">{item.label}</span>}
      {!collapsed && item.disabled && (
        <span
          className="label-sm"
          style={{
            marginLeft: 'auto',
            backgroundColor: 'var(--surface-dim)',
            color: 'var(--on-surface-variant)',
            padding: '1px 6px',
            borderRadius: 'var(--rounded-sm)',
          }}
        >
          Soon
        </span>
      )}
    </div>
  )

  if (item.disabled) return <div aria-disabled="true">{inner}</div>

  return (
    <Link to={item.href} onClick={onNavigate} style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Link>
  )
}

function SignifBadge({ score }: { score: number }) {
  const label = score >= 9 ? 'PRECEDENT' : score >= 7 ? 'SIGNIFICANT' : 'NOTABLE'
  const bg = score >= 9 ? 'var(--error)' : score >= 7 ? 'var(--warning)' : 'var(--secondary-container)'
  return (
    <span style={{
      fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      backgroundColor: bg, color: '#fff',
      padding: '2px 6px', borderRadius: 'var(--rounded-sm)',
    }}>
      {label}
    </span>
  )
}
