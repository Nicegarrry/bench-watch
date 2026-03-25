import { useAuth } from 'wasp/client/auth'
import { apiFetch } from '../shared/apiFetch'
import { Link } from 'react-router'
import { BriefHeader } from '../shared/components/BriefHeader'
import { AreaTag, AREA_LABELS } from '../shared/components/AreaTag'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

type UserArea = { areaSlug: string }

export function SettingsPage() {
  const { data: user } = useAuth()
  const [userAreas, setUserAreas] = useState<string[]>([])
  const [allAreas, setAllAreas] = useState<Array<{ slug: string; name: string }>>([])
  const [savingAreas, setSavingAreas] = useState(false)
  const [areasSaved, setAreasSaved] = useState(false)

  useEffect(() => {
    apiFetch('/api/areas').then((r) => r.json()).then(setAllAreas)
    // User areas come from the User object via auth context — not directly available
    // We derive them by reading the API
  }, [])

  async function saveAreas(slugs: string[]) {
    setSavingAreas(true)
    try {
      await apiFetch('/api/user/areas', { method: 'POST', body: JSON.stringify({ areaSlugs: slugs }) })
      setUserAreas(slugs)
      setAreasSaved(true)
      setTimeout(() => setAreasSaved(false), 2000)
    } finally {
      setSavingAreas(false)
    }
  }

  function toggleArea(slug: string) {
    const next = userAreas.includes(slug)
      ? userAreas.filter((s) => s !== slug)
      : [...userAreas, slug]
    if (next.length > 0) saveAreas(next)
  }

  const email = user?.getFirstProviderUserId() ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <BriefHeader label="Account" title="Account Management" subtitle="Personalise your digital chambers and security protocols." />
      </div>

      {/* Profile */}
      <Card title="Profile Identity">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'var(--primary-container)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <p className="title-sm" style={{ color: 'var(--on-surface)', margin: '0 0 4px' }}>{email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'capitalize' }}>
                Free Plan
              </span>
              <span
                className="label-sm"
                style={{
                  backgroundColor: '#dcfce7', color: '#166534',
                  padding: '1px 8px', borderRadius: 'var(--rounded-md)',
                }}
              >
                VERIFIED
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Practice Areas */}
      <Card
        title="Practice Areas"
        action={areasSaved ? (
          <span className="label-sm" style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} /> Saved
          </span>
        ) : undefined}
      >
        {allAreas.length === 0 ? (
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Loading areas…</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allAreas.map((a) => (
              <button
                key={a.slug}
                onClick={() => toggleArea(a.slug)}
                disabled={savingAreas}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--rounded-md)', cursor: 'pointer',
                  border: userAreas.includes(a.slug) ? '2px solid var(--secondary-container)' : '1px solid var(--surface-dim)',
                  backgroundColor: userAreas.includes(a.slug) ? 'var(--surface-container)' : 'transparent',
                  fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
                  color: userAreas.includes(a.slug) ? 'var(--secondary-container)' : 'var(--on-surface-variant)',
                  transition: 'all 150ms',
                }}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Subscription */}
      <div
        style={{
          backgroundColor: 'var(--primary-container)', borderRadius: 'var(--rounded-lg)',
          padding: '28px 32px', marginBottom: '24px',
        }}
      >
        <p className="label-md" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Current Plan</p>
        <h2 className="headline-md" style={{ color: '#fff', margin: '0 0 4px' }}>Free</h2>
        <p className="body-md" style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 24px' }}>
          3 runs/week · 1 practice area
        </p>
        <button
          style={{
            padding: '10px 24px', borderRadius: 'var(--rounded-md)', border: 'none',
            backgroundColor: 'var(--secondary-container)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            marginRight: '16px',
          }}
        >
          Upgrade to Pro →
        </button>
        <button
          style={{
            padding: '10px 24px', borderRadius: 'var(--rounded-md)',
            border: '1px solid rgba(255,255,255,0.3)', background: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer',
          }}
        >
          View Transaction History
        </button>
      </div>

      {/* Security */}
      <Card title="Security">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="label-lg" style={{ color: 'var(--on-surface)', margin: '0 0 2px' }}>Password</p>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '13px' }}>Last changed: unknown</p>
            </div>
            <Link to="/request-password-reset" className="label-lg" style={{ color: 'var(--secondary-container)', textDecoration: 'none' }}>
              Reset →
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="label-lg" style={{ color: 'var(--on-surface)', margin: '0 0 2px' }}>Active Sessions</p>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '13px' }}>Manage active login sessions</p>
            </div>
            <button className="label-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary-container)' }}>
              Review →
            </button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <div
        style={{
          backgroundColor: '#fef2f2', borderRadius: 'var(--rounded-lg)',
          padding: '24px 28px', marginBottom: '24px',
        }}
      >
        <p className="label-lg" style={{ color: 'var(--error)', margin: '0 0 4px' }}>Archive Account</p>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: '0 0 16px', fontSize: '13px' }}>
          This will archive your data and deactivate your account.
        </p>
        <button
          style={{
            padding: '8px 20px', borderRadius: 'var(--rounded-md)',
            border: '1px solid var(--error)', background: 'none',
            fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
            color: 'var(--error)', cursor: 'pointer',
          }}
        >
          Archive Data
        </button>
      </div>
    </div>
  )
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-container-lowest)',
        borderRadius: 'var(--rounded-lg)',
        padding: '24px 28px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p className="label-md" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}
