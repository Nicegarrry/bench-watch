import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from 'wasp/client/auth'
import { apiFetch } from '../apiFetch'
import {
  Scale, Archive, BookMarked, BookOpen, FileText, HelpCircle, Bell, Settings, Search, Menu, Loader2,
} from 'lucide-react'

type NavItem = {
  label: string
  icon: React.ReactNode
  href: string
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Intelligence',  icon: <Scale size={16} />,      href: '/intelligence' },
  { label: 'Case Library',  icon: <BookMarked size={16} />, href: '/library' },
  { label: 'Archive',       icon: <Archive size={16} />,    href: '/archive' },
  { label: 'Citations',     icon: <BookOpen size={16} />,   href: '/citations', disabled: true },
  { label: 'Reports',       icon: <FileText size={16} />,   href: '/reports',   disabled: true },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [topSearch, setTopSearch] = useState('')
  const [briefRunning, setBriefRunning] = useState(false)
  const [briefMsg, setBriefMsg] = useState<string | null>(null)

  // Track desktop/tablet/mobile and collapsed state
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false)

  useEffect(() => {
    function onResize() {
      const w = window.innerWidth
      setIsDesktop(w >= 768)
      // Auto-collapse at <1024px; don't force expand when user manually toggled
      if (w < 1024) setCollapsed(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const initials = (user?.getFirstProviderUserId() ?? '?').slice(0, 2).toUpperCase()

  const sidebarWidth = collapsed ? '64px' : '220px'

  async function triggerNewBrief() {
    setBriefRunning(true); setBriefMsg(null)
    try {
      const res = await apiFetch('/api/run-digest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`)
      setBriefMsg('Brief started — ready in ~5 min')
    } catch {
      setBriefMsg('Failed to start')
    } finally {
      setBriefRunning(false)
    }
  }

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
          {/* Logo */}
          <div style={{ padding: collapsed && !mobileOpen ? '20px 0' : '20px 16px', textAlign: collapsed && !mobileOpen ? 'center' : 'left' }}>
            {!collapsed || mobileOpen ? (
              <>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>
                  BenchWatch
                </p>
                <p className="label-sm" style={{ color: 'var(--secondary-container)', marginTop: '4px' }}>
                  Legal Intelligence
                </p>
              </>
            ) : (
              <Scale size={20} color="var(--secondary-container)" />
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

          {/* Bottom */}
          <div style={{ padding: collapsed && !mobileOpen ? '16px 8px' : '16px' }}>
            {/* New Brief button */}
            {(!collapsed || mobileOpen) ? (
              <div style={{ marginBottom: '8px' }}>
                <button
                  onClick={triggerNewBrief}
                  disabled={briefRunning}
                  aria-label="Run a new briefing"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    width: '100%', padding: '10px 16px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                    color: '#ffffff', borderRadius: 'var(--rounded-md)', border: 'none',
                    fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600,
                    cursor: briefRunning ? 'wait' : 'pointer',
                    opacity: briefRunning ? 0.75 : 1,
                  }}
                >
                  {briefRunning
                    ? <><Loader2 size={13} style={{ animation: 'bw-spin 1s linear infinite' }} /> Starting…</>
                    : '+ New Briefing'}
                </button>
                {briefMsg && (
                  <p className="label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: '6px', textAlign: 'center' }}>
                    {briefMsg}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={triggerNewBrief}
                disabled={briefRunning}
                title="New Briefing"
                aria-label="Run a new briefing"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 0', marginBottom: '8px', border: 'none', borderRadius: 'var(--rounded-md)',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                  cursor: briefRunning ? 'wait' : 'pointer',
                }}
              >
                {briefRunning
                  ? <Loader2 size={14} color="#ffffff" style={{ animation: 'bw-spin 1s linear infinite' }} />
                  : <span style={{ color: '#ffffff', fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>+</span>}
              </button>
            )}

            {/* Collapse toggle (desktop only) */}
            {isDesktop && (
              <button
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: '8px', padding: '8px', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--on-surface-variant)',
                  borderRadius: 'var(--rounded-md)',
                }}
              >
                <HelpCircle size={15} />
                {!collapsed && <span className="label-lg" style={{ color: 'var(--on-surface-variant)' }}>Help</span>}
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          // On desktop: push right of sidebar. On mobile: no margin (sidebar overlays).
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

          {/* Search — navigates to /intelligence?q=... on Enter */}
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
            <TopBarIcon aria-label="Notifications"><Bell size={16} /></TopBarIcon>
            <Link to="/settings" aria-label="Settings" style={{ textDecoration: 'none' }}>
              <TopBarIcon aria-label="Settings"><Settings size={16} /></TopBarIcon>
            </Link>
            <div
              role="button"
              tabIndex={0}
              aria-label="Account menu"
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: 'var(--primary-container)', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              {initials}
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

function TopBarIcon({ children, 'aria-label': ariaLabel }: { children: React.ReactNode; 'aria-label'?: string }) {
  return (
    <button
      aria-label={ariaLabel}
      style={{
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--on-surface-variant)', borderRadius: 'var(--rounded-md)',
      }}
    >
      {children}
    </button>
  )
}
