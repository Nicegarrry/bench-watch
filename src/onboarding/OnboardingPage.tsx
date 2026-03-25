import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { apiFetch } from '../shared/apiFetch'
import { Check, Loader2 } from 'lucide-react'

type LawArea = { slug: string; name: string; icon: string | null; description: string | null }

const AREA_ICONS: Record<string, string> = {
  administrative: '⚖️', constitutional: '📜', contract: '🤝', employment: '👷',
  criminal: '🔒', corporations: '🏢', property: '🏠', planning: '🌳',
  tax: '📊', tort: '⚕️', ip: '💡', competition: '📈',
  migration: '✈️', privacy: '🛡️', family: '👨‍👩‍👧',
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [areas, setAreas] = useState<LawArea[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [emailDigest, setEmailDigest] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/areas')
      .then((r) => r.json())
      .then(setAreas)
      .catch(() => setError('Failed to load areas'))
      .finally(() => setLoading(false))
  }, [])

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  async function handleSubmit() {
    if (selected.size === 0) { setError('Select at least one area.'); return }
    setSaving(true); setError(null)
    try {
      await apiFetch('/api/user/areas', { method: 'POST', body: JSON.stringify({ areaSlugs: Array.from(selected), emailFrequency: emailDigest ? 'weekly' : 'never' }) })
      navigate('/intelligence')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh', backgroundColor: 'var(--surface)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '64px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '720px' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 24px' }}>
            BenchWatch
          </p>
          <h1 className="headline-md" style={{ color: 'var(--on-surface)', margin: '0 0 8px' }}>
            What areas of law matter to you?
          </h1>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
            Select as many as you like. We'll personalise your weekly digest accordingly.
          </p>
        </div>

        {/* Area grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Loader2 size={24} color="var(--on-surface-variant)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '40px',
            }}
          >
            {areas.map((area) => {
              const isSelected = selected.has(area.slug)
              return (
                <button
                  key={area.slug}
                  onClick={() => toggle(area.slug)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '16px',
                    backgroundColor: isSelected ? 'var(--surface-container)' : 'var(--surface-container-lowest)',
                    border: isSelected ? '2px solid var(--secondary-container)' : '1px solid var(--surface-dim)',
                    borderRadius: 'var(--rounded-lg)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 150ms',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>
                    {AREA_ICONS[area.slug] ?? '⚖️'}
                  </span>
                  <span className="label-lg" style={{ color: isSelected ? 'var(--secondary-container)' : 'var(--on-surface)' }}>
                    {area.name}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '18px', height: '18px',
                        backgroundColor: 'var(--secondary-container)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Email toggle */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px',
            backgroundColor: 'var(--surface-container-lowest)',
            borderRadius: 'var(--rounded-lg)',
            marginBottom: '24px',
          }}
        >
          <div>
            <p className="label-lg" style={{ color: 'var(--on-surface)', margin: '0 0 4px' }}>Send me a weekly email digest</p>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '13px' }}>
              Delivered every Monday morning with your top cases.
            </p>
          </div>
          <button
            onClick={() => setEmailDigest((v) => !v)}
            style={{
              width: '44px', height: '24px', flexShrink: 0,
              backgroundColor: emailDigest ? 'var(--secondary-container)' : 'var(--surface-dim)',
              borderRadius: '12px', border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'background-color 200ms',
            }}
          >
            <span
              style={{
                position: 'absolute', top: '2px',
                left: emailDigest ? '22px' : '2px',
                width: '20px', height: '20px',
                backgroundColor: '#fff', borderRadius: '50%',
                transition: 'left 200ms',
              }}
            />
          </button>
        </div>

        {error && (
          <p className="label-lg" style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={saving || selected.size === 0}
          style={{
            width: '100%', padding: '14px',
            background: selected.size > 0
              ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)'
              : 'var(--surface-dim)',
            color: selected.size > 0 ? '#fff' : 'var(--on-surface-variant)',
            border: 'none', borderRadius: 'var(--rounded-md)',
            fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 600,
            cursor: saving || selected.size === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          {saving ? 'Saving…' : `Start Watching → (${selected.size} area${selected.size !== 1 ? 's' : ''})`}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
