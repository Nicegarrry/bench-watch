import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from 'wasp/client/auth'
import { apiFetch } from '../shared/apiFetch'
import { BriefHeader } from '../shared/components/BriefHeader'
import { CaseCard } from '../shared/components/CaseCard'
import { AreaTag } from '../shared/components/AreaTag'
import { SkeletonIntelligencePage } from '../shared/components/Skeleton'
import { ChevronDown, Loader2, ArrowRight } from 'lucide-react'

type TopCase = {
  id: string; rank: number; caseId: string
  factsSummary: string; legalAnalysis: string; whyItMatters: string
  significanceScore: number; primaryArea: string
  case: { citation: string; caseName: string; court: string; courtCode?: string; decisionDate?: string; catchwords?: string; jadeUrl?: string | null; austliiUrl?: string | null }
}

type ExtendedCase = {
  id: string; rank: number; caseId: string; significanceScore: number; primaryArea: string; oneLineSummary: string
  case: { citation: string; caseName: string; court: string; decisionDate?: string }
}

type Digest = {
  id: string; status: string; digestSummary: string | null
  periodStart: string; periodEnd: string; areaSlugs: string[]
  topCases: TopCase[]; extendedCases: ExtendedCase[]
}

export function IntelligencePage() {
  const { data: user } = useAuth()
  const [digest, setDigest] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runMsg, setRunMsg] = useState<string | null>(null)
  const [extendedSort, setExtendedSort] = useState<'significance' | 'date'>('significance')

  useEffect(() => { fetchLatestDigest() }, [])

  async function fetchLatestDigest() {
    setLoading(true); setError(null)
    try {
      const res = await apiFetch('/api/archive?page=0')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const latest = (data.digests as Digest[]).find((d) => d.status === 'completed') ?? null
      setDigest(latest)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function triggerRun() {
    setRunning(true); setRunMsg(null)
    try {
      const res = await apiFetch('/api/run-digest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`)
      setRunMsg('Digest generation started — takes ~5 minutes. Refresh when done.')
    } catch (e: any) {
      setRunMsg(`Error: ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  const sortedExtended = digest
    ? [...digest.extendedCases].sort((a, b) =>
        extendedSort === 'significance'
          ? b.significanceScore - a.significanceScore
          : new Date(b.case.decisionDate ?? 0).getTime() - new Date(a.case.decisionDate ?? 0).getTime()
      )
    : []

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <BriefHeader label="Critical Updates" title="Priority Insights" />
        <button
          onClick={triggerRun}
          disabled={running}
          style={{
            flexShrink: 0,
            padding: '9px 20px',
            border: '1px solid var(--surface-dim)',
            borderRadius: 'var(--rounded-md)',
            background: 'none',
            fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
            color: 'var(--on-surface-variant)', cursor: running ? 'not-allowed' : 'pointer',
            opacity: running ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          {running && <Loader2 size={13} style={{ animation: 'bw-spin 1s linear infinite' }} />}
          {running ? 'Starting…' : '+ New Research'}
        </button>
      </div>

      {runMsg && (
        <div
          style={{
            marginBottom: '24px', padding: '12px 16px',
            backgroundColor: 'var(--surface-container-low)',
            borderRadius: 'var(--rounded-md)',
            fontFamily: 'var(--font-sans)', fontSize: '13px',
            color: runMsg.startsWith('Error') ? 'var(--error)' : 'var(--on-surface-variant)',
          }}
        >
          {runMsg}
        </div>
      )}

      {/* Skeleton loading — realistic preview of the full page */}
      {loading && <SkeletonIntelligencePage />}

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: 'var(--rounded-md)', color: 'var(--error)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !digest && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="title-md" style={{ color: 'var(--on-surface)', marginBottom: '8px' }}>No digest available yet</p>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
            Run the full pipeline from <a href="/dashboard" style={{ color: 'var(--secondary-container)' }}>/dashboard</a>, then click New Research above.
          </p>
        </div>
      )}

      {digest && (
        <div style={{ animation: 'bw-fadein 350ms ease forwards' }}>
          {/* Digest period */}
          <p className="mono" style={{ color: 'var(--on-surface-variant)', marginBottom: '32px' }}>
            Week of {new Date(digest.periodStart).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}·{' '}{digest.areaSlugs.length} practice areas
          </p>

          {/* Top cases */}
          {digest.topCases.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {digest.topCases.map((tc) => (
                  <CaseCard
                    key={tc.id}
                    rank={tc.rank}
                    data={{
                      caseId: tc.caseId,
                      citation: tc.case.citation,
                      caseName: tc.case.caseName,
                      court: tc.case.court,
                      courtCode: tc.case.courtCode,
                      decisionDate: tc.case.decisionDate,
                      catchwords: tc.case.catchwords,
                      jadeUrl: tc.case.jadeUrl,
                      austliiUrl: tc.case.austliiUrl,
                      factsSummary: tc.factsSummary,
                      legalAnalysis: tc.legalAnalysis,
                      whyItMatters: tc.whyItMatters,
                      significanceScore: tc.significanceScore,
                      primaryArea: tc.primaryArea,
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Weekly Analysis box */}
          {digest.digestSummary && digest.digestSummary !== 'No relevant cases this week.' && (
            <div
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                borderRadius: 'var(--rounded-lg)',
                padding: '28px 32px',
                marginBottom: '48px',
              }}
            >
              <p className="label-md" style={{ color: 'var(--secondary)', marginBottom: '16px' }}>
                WEEKLY ANALYSIS
              </p>
              {digest.digestSummary.split('. ').filter(Boolean).map((sentence, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--secondary)', marginTop: '6px', flexShrink: 0 }}>●</span>
                  <p className="body-lg" style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                    {sentence.trim()}{sentence.trim().endsWith('.') ? '' : '.'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Also Notable */}
          {sortedExtended.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 className="headline-md" style={{ margin: 0, color: 'var(--on-surface)' }}>Also Notable</h2>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <SortButton active={extendedSort === 'significance'} onClick={() => setExtendedSort('significance')}>By Significance</SortButton>
                  <SortButton active={extendedSort === 'date'} onClick={() => setExtendedSort('date')}>By Date</SortButton>
                </div>
              </div>
              <div style={{ borderRadius: 'var(--rounded-lg)', overflow: 'hidden', border: '1px solid var(--surface-dim)' }}>
                {sortedExtended.map((ec, i) => (
                  <ExtendedCaseRow key={ec.id} ec={ec} alternate={i % 2 === 1} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <style>{`
        @keyframes bw-spin    { to { transform: rotate(360deg); } }
        @keyframes bw-fadein  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bw-shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .bw-skeleton { background: linear-gradient(90deg, var(--surface-container) 0%, var(--surface-container-high) 50%, var(--surface-container) 100%); background-size:200% 100%; animation: bw-shimmer 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

function SortButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="label-sm"
      style={{
        padding: '5px 12px',
        border: 'none',
        borderRadius: 'var(--rounded-md)',
        cursor: 'pointer',
        backgroundColor: active ? 'var(--primary-container)' : 'transparent',
        color: active ? '#ffffff' : 'var(--on-surface-variant)',
        transition: 'all 150ms',
      }}
    >
      {children}
    </button>
  )
}

function ExtendedCaseRow({ ec, alternate }: { ec: ExtendedCase; alternate: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const date = ec.case.decisionDate ? new Date(ec.case.decisionDate) : null

  return (
    <div style={{ backgroundColor: alternate ? 'var(--surface-container-low)' : 'var(--surface-container-lowest)' }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background-color 150ms',
        }}
      >
        {/* Date column */}
        <div style={{ width: '40px', flexShrink: 0, textAlign: 'center' }}>
          {date ? (
            <>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0, lineHeight: 1 }}>
                {date.getDate()}
              </p>
              <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                {date.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase()}
              </p>
            </>
          ) : (
            <span className="mono" style={{ color: 'var(--on-surface-variant)' }}>{ec.rank}</span>
          )}
        </div>

        {/* Case info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="title-md" style={{ color: 'var(--on-surface)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ec.case.caseName}
          </p>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '13px' }}>
            {ec.oneLineSummary}
          </p>
        </div>

        {/* Right meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <AreaTag slug={ec.primaryArea} />
          <span className="mono" style={{ color: 'var(--on-surface-variant)', minWidth: '36px', textAlign: 'right' }}>
            {ec.significanceScore}/10
          </span>
          <ChevronDown
            size={14}
            color="var(--on-surface-variant)"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 250ms ease' }}
          />
        </div>
      </button>

      {/* Smooth expand */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: '4px 16px 16px 72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <p className="mono" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>{ec.case.citation}</p>
            {ec.caseId && (
              <Link
                to={`/cases/${ec.caseId}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
                  color: 'var(--secondary-container)', textDecoration: 'none',
                }}
              >
                View Analysis <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
