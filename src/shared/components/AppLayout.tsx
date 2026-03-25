import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from 'wasp/client/auth'
import {
  Scale, Archive, BookOpen, FileText, HelpCircle, Bell, Settings, Search, Menu, X, ChevronRight,
} from 'lucide-react'

type NavItem = {
  label: string
  icon: React.ReactNode
  href: string
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Intelligence',  icon: <Scale size={16} />,    href: '/intelligence' },
  { label: 'Archive',       icon: <Archive size={16} />,  href: '/archive' },
  { label: 'Citations',     icon: <BookOpen size={16} />, href: '/citations', disabled: true },
  { label: 'Reports',       icon: <FileText size={16} />, href: '/reports',   disabled: true },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = (user?.getFirstProviderUserId() ?? '?').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(27,28,26,0.4)',
            zIndex: 40,
          }}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────── */}
      <aside
        style={{
          width: mobileOpen ? '220px' : collapsed ? '64px' : '220px',
          backgroundColor: 'var(--surface-container-low)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: mobileOpen ? 0 : undefined,
          zIndex: 50,
          transition: 'width 200ms ease',
          overflowX: 'hidden',
        }}
        className={!mobileOpen ? 'hidden md:flex' : 'flex'}
      >
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 0' : '20px 16px', textAlign: collapsed ? 'center' : 'left' }}>
          {!collapsed ? (
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
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: collapsed ? '16px 8px' : '16px', borderTop: 'none' }}>
          {!collapsed && (
            <Link
              to="/intelligence"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                color: '#ffffff',
                borderRadius: 'var(--rounded-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
                marginBottom: '8px',
              }}
            >
              + New Research
            </Link>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex"
            style={{
              width: '100%',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '8px',
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--on-surface-variant)',
              borderRadius: 'var(--rounded-md)',
            }}
          >
            <HelpCircle size={15} />
            {!collapsed && <span className="label-lg" style={{ color: 'var(--on-surface-variant)' }}>Help</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          marginLeft: collapsed ? '64px' : '220px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 200ms ease',
        }}
        className="md:ml-[220px]"
      >
        {/* Top bar */}
        <header
          style={{
            height: 'var(--topbar-height)',
            backgroundColor: 'var(--surface-container-lowest)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '16px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '4px' }}
          >
            <Menu size={20} />
          </button>

          {/* Page breadcrumb */}
          <span className="label-md" style={{ color: 'var(--on-surface-variant)', minWidth: '80px' }}>
            {NAV_ITEMS.find((n) => location.pathname.startsWith(n.href))?.label ?? 'BenchWatch'}
          </span>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
            <input
              type="text"
              placeholder="Search precedents..."
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                backgroundColor: 'var(--surface-container-low)',
                border: '1px solid rgba(70,70,77,0.15)',
                borderRadius: 'var(--rounded-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--on-surface)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TopBarIcon><Bell size={16} /></TopBarIcon>
            <Link to="/settings" style={{ textDecoration: 'none' }}>
              <TopBarIcon><Settings size={16} /></TopBarIcon>
            </Link>
            <div
              style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-container)',
                color: '#ffffff',
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '10px 0' : '10px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
        cursor: item.disabled ? 'default' : 'pointer',
        backgroundColor: hovered && !item.disabled ? 'var(--surface-container)' : 'transparent',
        transition: 'background-color 150ms',
        // 3px left accent bar for active
        borderLeft: isActive ? '3px solid var(--secondary-container)' : '3px solid transparent',
        color: item.disabled
          ? 'var(--surface-dim)'
          : isActive
          ? 'var(--secondary-container)'
          : 'var(--on-surface-variant)',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
      {!collapsed && (
        <span className="label-lg">{item.label}</span>
      )}
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

  if (item.disabled) return <div>{inner}</div>

  return (
    <Link to={item.href} onClick={onNavigate} style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Link>
  )
}

function TopBarIcon({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--on-surface-variant)',
        borderRadius: 'var(--rounded-md)',
      }}
    >
      {children}
    </button>
  )
}
