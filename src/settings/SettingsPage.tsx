import { useAuth } from 'wasp/client/auth'
import { apiFetch } from '../shared/apiFetch'
import { Link } from 'react-router'
import { BriefHeader } from '../shared/components/BriefHeader'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

export function SettingsPage() {
  const { data: user } = useAuth()
  const [userAreas, setUserAreas] = useState<string[]>([])
  const [allAreas, setAllAreas] = useState<Array<{ slug: string; name: string }>>([])
  const [savingAreas, setSavingAreas] = useState(false)
  const [areasSaved, setAreasSaved] = useState(false)

  // Display name editing
  const [displayName, setDisplayName] = useState<string>((user as any)?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    apiFetch('/api/areas').then((r) => r.json()).then(setAllAreas)
  }, [])

  // Sync display name from user when auth loads
  useEffect(() => {
    if ((user as any)?.displayName) setDisplayName((user as any).displayName)
  }, [user])

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

  async function saveName() {
    if (!displayName.trim()) return
    setSavingName(true)
    try {
      await apiFetch('/api/user/profile', { method: 'POST', body: JSON.stringify({ displayName: displayName.trim() }) })
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2000)
    } finally {
      setSavingName(false)
    }
  }

  const email = user?.getFirstProviderUserId() ?? ''
  const currentDisplayName = (user as any)?.displayName ?? displayName
  const initials = currentDisplayName
    ? currentDisplayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()
  const plan = (user as any)?.plan ?? 'free'
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'team' ? 'Team' : 'Free'

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <BriefHeader label="Account" title="Account Management" subtitle="Personalise your digital chambers and security protocols." />
      </div>

      {/* Profile */}
      <Card title="Profile">
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Avatar */}
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

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
                Email
              </p>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--on-surface)' }}>{email}</p>
            </div>

            <div>
              <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
                Display name
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', maxWidth: '320px' }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  placeholder="e.g. Sarah Chen"
                  style={{
                    flex: 1, padding: '7px 10px',
                    backgroundColor: 'var(--surface-container-low)',
                    border: '1px solid var(--surface-dim)',
                    borderRadius: 'var(--rounded-md)',
                    fontFamily: 'var(--font-sans)', fontSize: '14px',
                    color: 'var(--on-surface)', outline: 'none',
                  }}
                />
                <button
                  onClick={saveName}
                  disabled={savingName || !displayName.trim()}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--rounded-md)',
                    border: 'none', cursor: savingName || !displayName.trim() ? 'default' : 'pointer',
                    backgroundColor: nameSaved ? 'var(--color-success)' : 'var(--primary-container)',
                    color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
                    opacity: !displayName.trim() ? 0.5 : 1, transition: 'background-color 200ms',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  {nameSaved ? <><Check size={12} /> Saved</> : 'Save'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-sm" style={{
                backgroundColor: 'var(--primary-container)', color: '#fff',
                padding: '2px 10px', borderRadius: 'var(--rounded-md)',
              }}>
                {planLabel} Plan
              </span>
              <span className="label-sm" style={{
                backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)',
                padding: '2px 8px', borderRadius: 'var(--rounded-md)',
              }}>
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
          <span className="label-sm" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
        <h2 className="headline-md" style={{ color: '#fff', margin: '0 0 4px' }}>{planLabel}</h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 24px' }}>
          {plan === 'free' ? '3 runs/week · 1 practice area' : plan === 'pro' ? '10 runs/week · unlimited areas + archive' : 'Unlimited · team features'}
        </p>
        <button
          style={{
            padding: '10px 24px', borderRadius: 'var(--rounded-md)', border: 'none',
            backgroundColor: 'var(--secondary-container)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            marginRight: '16px',
          }}
        >
          {plan === 'free' ? 'Upgrade to Pro →' : 'Manage Plan →'}
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
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--on-surface-variant)', margin: 0 }}>
                Reset via email link
              </p>
            </div>
            <Link to="/request-password-reset" className="label-lg" style={{ color: 'var(--secondary-container)', textDecoration: 'none' }}>
              Reset →
            </Link>
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--surface-dim)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="label-lg" style={{ color: 'var(--on-surface)', margin: '0 0 2px' }}>Active Sessions</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--on-surface-variant)', margin: 0 }}>
                Manage active login sessions
              </p>
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
          backgroundColor: 'var(--color-error-bg)', borderRadius: 'var(--rounded-lg)',
          padding: '24px 28px', marginBottom: '24px',
          border: '1px solid rgba(184,50,48,0.12)',
        }}
      >
        <p className="label-lg" style={{ color: 'var(--error)', margin: '0 0 4px' }}>Deactivate Account</p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--on-surface-variant)', margin: '0 0 16px' }}>
          This will deactivate your account and archive your data.
        </p>
        <button
          style={{
            padding: '8px 20px', borderRadius: 'var(--rounded-md)',
            border: '1px solid var(--error)', background: 'none',
            fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
            color: 'var(--error)', cursor: 'pointer',
          }}
        >
          Deactivate Account
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
