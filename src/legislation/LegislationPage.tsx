import { useEffect, useState } from 'react'
import { AppLayout } from '../shared/components/AppLayout'
import { apiFetch } from '../shared/apiFetch'

type AreaTag = { areaSlug: string; relevanceConfidence: number }

type LegislationChangeAnalysis = {
  changeSummary: string
  practiceImpact: string
  affectedAreas: string[]
  significanceScore: number
}

type LegislationChange = {
  id: string
  title: string
  jurisdiction: string
  changeType: string
  legislationUrl: string | null
  publishedAt: string
  feedSummary: string | null
  analysis: LegislationChangeAnalysis | null
  areaTags: AreaTag[]
}

const JURISDICTION_NAMES: Record<string, string> = {
  cth: 'Commonwealth', nsw: 'New South Wales', vic: 'Victoria',
  qld: 'Queensland', wa: 'Western Australia', sa: 'South Australia',
  tas: 'Tasmania', act: 'ACT', nt: 'Northern Territory',
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  act_new: 'New Act', act_amended: 'Amendment', act_commenced: 'Commencement',
  regulation_made: 'Regulation', bill_introduced: 'Bill', unknown: 'Update',
}

function significanceBadge(score: number): { label: string; bg: string } {
  if (score >= 9) return { label: 'MAJOR', bg: 'var(--color-red)' }
  if (score >= 7) return { label: 'SIGNIFICANT', bg: 'var(--color-orange)' }
  if (score >= 5) return { label: 'NOTABLE', bg: 'var(--color-brass)' }
  return { label: 'ROUTINE', bg: 'var(--color-muted)' }
}

function borderColor(score: number): string {
  if (score >= 9) return 'var(--color-red)'
  if (score >= 7) return 'var(--color-orange)'
  if (score >= 5) return 'var(--color-brass)'
  return 'var(--color-border)'
}

export function LegislationPage() {
  const [changes, setChanges] = useState<LegislationChange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiFetch(`/api/legislation?days=${days}`)
      .then((res) => res.json())
      .then((data) => setChanges(data.changes ?? []))
      .catch(() => setError('Failed to load legislation changes.'))
      .finally(() => setLoading(false))
  }, [days])

  // Group by jurisdiction
  const byJurisdiction = changes.reduce<Record<string, LegislationChange[]>>((acc, c) => {
    const key = c.jurisdiction
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const jurisdictionOrder = ['cth', 'nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt']

  return (
    <AppLayout>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>
            Legislation
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--color-muted)' }}>
            Recent Acts, amendments, and regulatory changes across all Australian jurisdictions — filtered to your practice areas.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-muted)' }}>Show last</span>
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '5px 12px',
                fontFamily: 'var(--font-sans)', fontSize: '13px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor: days === d ? 'var(--color-navy)' : 'transparent',
                color: days === d ? '#fff' : 'var(--color-charcoal)',
                cursor: 'pointer',
              }}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Body */}
        {loading && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--color-muted)', textAlign: 'center', padding: '60px 0' }}>
            Loading…
          </p>
        )}

        {error && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--color-red)', textAlign: 'center', padding: '60px 0' }}>
            {error}
          </p>
        )}

        {!loading && !error && changes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--color-muted)', marginBottom: '8px' }}>
              No legislation changes found for your areas in the last {days} days.
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-muted)' }}>
              The pipeline runs nightly at 1am AEST — check back after the next run.
            </p>
          </div>
        )}

        {!loading && !error && changes.length > 0 && (
          <div>
            {jurisdictionOrder
              .filter((j) => byJurisdiction[j]?.length > 0)
              .map((jurisdiction) => (
                <section key={jurisdiction} style={{ marginBottom: '40px' }}>
                  {/* Jurisdiction header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
                        backgroundColor: 'var(--color-navy)', color: '#fff',
                        padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {jurisdiction.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                      {JURISDICTION_NAMES[jurisdiction] ?? jurisdiction.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-muted)' }}>
                      {byJurisdiction[jurisdiction].length} change{byJurisdiction[jurisdiction].length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Change cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {byJurisdiction[jurisdiction].map((change) => (
                      <ChangeCard key={change.id} change={change} />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function ChangeCard({ change }: { change: LegislationChange }) {
  const [expanded, setExpanded] = useState(false)
  const score = change.analysis?.significanceScore ?? 0
  const badge = score > 0 ? significanceBadge(score) : null

  const dateStr = new Date(change.publishedAt).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${score > 0 ? borderColor(score) : 'var(--color-border)'}`,
        borderRadius: '6px',
        padding: '16px 20px',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {/* Change type chip */}
        <span
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
            border: '1px solid var(--color-border)', borderRadius: '4px',
            padding: '2px 6px', color: 'var(--color-muted)', flexShrink: 0,
            textTransform: 'uppercase', letterSpacing: '0.4px',
          }}
        >
          {CHANGE_TYPE_LABELS[change.changeType] ?? change.changeType}
        </span>

        {/* Significance badge */}
        {badge && (
          <span
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
              backgroundColor: badge.bg, color: '#fff',
              padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
            }}
          >
            {badge.label}
          </span>
        )}

        {/* Date */}
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-muted)', marginLeft: 'auto' }}>
          {dateStr}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600,
          color: 'var(--color-charcoal)', lineHeight: 1.4, marginBottom: '8px',
        }}
      >
        {change.legislationUrl ? (
          <a
            href={change.legislationUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-brass)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
          >
            {change.title}
          </a>
        ) : (
          change.title
        )}
      </h3>

      {/* AI Summary */}
      {change.analysis && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--color-charcoal)', lineHeight: 1.6, marginBottom: '8px' }}>
          {change.analysis.changeSummary}
        </p>
      )}

      {/* Practice Impact box (expandable) */}
      {change.analysis?.practiceImpact && (
        <div
          style={{
            backgroundColor: 'var(--color-highlight-bg)',
            borderLeft: '3px solid var(--color-brass)',
            padding: '10px 14px',
            marginBottom: '10px',
            borderRadius: '0 4px 4px 0',
          }}
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--color-brass)', display: 'block', marginBottom: '4px' }}>
            PRACTICE IMPACT
          </span>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-charcoal)', lineHeight: 1.5, margin: 0 }}>
            {change.analysis.practiceImpact}
          </p>
        </div>
      )}

      {/* Area tags */}
      {change.areaTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {change.areaTags.map((tag) => (
            <span
              key={tag.areaSlug}
              style={{
                fontFamily: 'var(--font-sans)', fontSize: '11px',
                backgroundColor: 'var(--color-parchment)', color: 'var(--color-charcoal)',
                padding: '2px 8px', borderRadius: '12px',
              }}
            >
              {tag.areaSlug}
            </span>
          ))}
        </div>
      )}

      {/* Feed summary toggle (for items without analysis) */}
      {!change.analysis && change.feedSummary && (
        <>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-muted)',
              padding: '0', marginBottom: expanded ? '8px' : '0',
            }}
          >
            {expanded ? '▲ Hide summary' : '▼ Show feed description'}
          </button>
          {expanded && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              {change.feedSummary}
            </p>
          )}
        </>
      )}
    </div>
  )
}
