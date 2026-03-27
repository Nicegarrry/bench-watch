import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router'
import { useAuth } from 'wasp/client/auth'
import { apiFetch } from '../shared/apiFetch'
import { BriefHeader } from '../shared/components/BriefHeader'
import { CaseCard } from '../shared/components/CaseCard'
import { AreaTag } from '../shared/components/AreaTag'
import { SkeletonIntelligencePage } from '../shared/components/Skeleton'
import { ChevronDown, ChevronRight, Loader2, BarChart2 } from 'lucide-react'

type Period = '1d' | '7d' | '30d'

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

type BrowseCase = {
  id: string; citation: string; caseName: string; court: string; courtCode?: string
  decisionDate?: string; catchwords?: string | null; jadeUrl?: string | null; austliiUrl?: string | null
  caseAnalysis: {
    significanceScore: number; primaryArea: string
    whyItMatters: string; factsSummary: string; legalAnalysis: string
  } | null
}

const PERIOD_LABELS: Record<Period, string> = { '1d': '24 Hours', '7d': '7 Days', '30d': '30 Days' }

export function IntelligencePage() {
  const { data: _user } = useAuth()
  const [period, setPeriod] = useState<Period>('7d')
  const [digest, setDigest] = useState<Digest | null>(null)
  const [browseCases, setBrowseCases] = useState<BrowseCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runMsg, setRunMsg] = useState<string | null>(null)
  const [extendedSort, setExtendedSort] = useState<'significance' | 'date'>('significance')
  const [heroExpanded, setHeroExpanded] = useState(true)

  useEffect(() => { fetchForPeriod(period) }, [period])

  async function fetchForPeriod(p: Period) {
    setLoading(true); setError(null)
    try {
      if (p === '7d') {
        const res = await apiFetch('/api/digest/latest')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setDigest(data.digest ?? null)
      } else {
        const days = p === '1d' ? 2 : 30
        const res = await apiFetch(`/api/browse?days=${days}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setBrowseCases(data.cases ?? [])
      }
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
      if (data.fresh) {
        setRunMsg('Brief is current — generated within the last 24 hours.')
      } else {
        setRunMsg('Refreshing your brief — takes ~5 minutes. Reload when done.')
      }
    } catch (e: any) {
      setRunMsg(`Error: ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  const sortedExtended = useMemo(() => {
    if (!digest) return []
    return [...digest.extendedCases].sort((a, b) =>
      extendedSort === 'significance'
        ? b.significanceScore - a.significanceScore
        : new Date(b.case.decisionDate ?? 0).getTime() - new Date(a.case.decisionDate ?? 0).getTime()
    )
  }, [digest, extendedSort])

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        <BriefHeader label="Critical Updates" title="Priority Insights" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {/* Period selector */}
          <div style={{
            display: 'flex', gap: '2px', padding: '3px',
            backgroundColor: 'var(--surface-container-low)',
            borderRadius: 'var(--rounded-md)',
          }}>
            {(['1d', '7d', '30d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="label-sm"
                style={{
                  padding: '5px 11px',
                  border: 'none',
                  borderRadius: 'calc(var(--rounded-md) - 2px)',
                  cursor: 'pointer',
                  backgroundColor: period === p ? 'var(--surface-container-highest)' : 'transparent',
                  color: period === p ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                  fontWeight: period === p ? 600 : 400,
                  transition: 'all 150ms',
                  whiteSpace: 'nowrap',
                }}
              >
                {PERIOD_LABELS[p]}
                {p === '7d' && (
                  <span style={{
                    marginLeft: '5px', fontSize: '9px', fontWeight: 700,
                    letterSpacing: '0.05rem', color: period === p ? 'var(--secondary-container)' : 'var(--on-surface-variant)',
                  }}>AI</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={triggerRun}
            disabled={running}
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
              border: 'none',
              borderRadius: 'var(--rounded-md)',
              fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
              color: '#ffffff', cursor: running ? 'not-allowed' : 'pointer',
              opacity: running ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {running && <Loader2 size={13} style={{ animation: 'bw-spin 1s linear infinite' }} />}
            {running ? 'Refreshing…' : 'Refresh Brief'}
          </button>
        </div>
      </div>

      {runMsg && (
        <div style={{
          marginBottom: '24px', padding: '12px 16px',
          backgroundColor: 'var(--surface-container-low)',
          borderRadius: 'var(--rounded-md)',
          fontFamily: 'var(--font-sans)', fontSize: '13px',
          color: runMsg.startsWith('Error') ? 'var(--error)' : 'var(--on-surface-variant)',
        }}>
          {runMsg}
        </div>
      )}

      {loading && <SkeletonIntelligencePage />}

      {error && !loading && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: 'var(--rounded-md)', color: 'var(--error)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* 7-day AI digest view */}
      {!loading && !error && period === '7d' && (
        <>
          {!digest && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p className="title-md" style={{ color: 'var(--on-surface)', marginBottom: '8px' }}>No brief available yet</p>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Your daily brief is prepared each night. Check back tomorrow morning, or click Refresh Brief to generate one now.
              </p>
            </div>
          )}

          {digest && (
            <div style={{ animation: 'bw-fadein 350ms ease forwards' }}>
              <p className="mono" style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
                7-day view · {new Date(digest.periodStart).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {new Date(digest.periodEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' '}·{' '}{digest.areaSlugs.length} {digest.areaSlugs.length === 1 ? 'practice area' : 'practice areas'}
              </p>

              {digest.digestSummary && digest.digestSummary !== 'No relevant cases this period.' && digest.digestSummary !== 'No relevant cases this week.' && (
                <WeeklyAnalysisBox summary={digest.digestSummary} periodEnd={digest.periodEnd} />
              )}

              {digest.topCases.length > 0 && (
                <section style={{ marginBottom: '48px' }}>
                  <button
                    onClick={() => setHeroExpanded((e) => !e)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', cursor: 'pointer',
                      marginBottom: heroExpanded ? '20px' : '0',
                      padding: '0', textAlign: 'left',
                    }}
                  >
                    <h2 className="headline-md" style={{ margin: 0, color: 'var(--on-surface)' }}>Priority Cases</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        {digest.topCases.length} {digest.topCases.length === 1 ? 'case' : 'cases'}
                      </span>
                      <ChevronDown
                        size={16}
                        color="var(--on-surface-variant)"
                        style={{ transform: heroExpanded ? 'none' : 'rotate(-90deg)', transition: 'transform 200ms ease' }}
                      />
                    </div>
                  </button>

                  <div style={{
                    display: 'grid',
                    gridTemplateRows: heroExpanded ? '1fr' : '0fr',
                    transition: 'grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
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
                    </div>
                  </div>
                </section>
              )}

              {sortedExtended.length > 0 && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 className="headline-md" style={{ margin: 0, color: 'var(--on-surface)' }}>Also Notable</h2>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <SortButton active={extendedSort === 'significance'} onClick={() => setExtendedSort('significance')}>By Significance</SortButton>
                      <SortButton active={extendedSort === 'date'} onClick={() => setExtendedSort('date')}>By Date</SortButton>
                    </div>
                  </div>
                  <div style={{ borderRadius: 'var(--rounded-lg)', overflow: 'hidden', border: '1px solid var(--surface-dim)' }}>
                    {sortedExtended.map((ec, i) => (
                      <NotableRow key={ec.id} ec={ec} alternate={i % 2 === 1} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* 1-day / 30-day browse view */}
      {!loading && !error && period !== '7d' && (
        <div style={{ animation: 'bw-fadein 350ms ease forwards' }}>
          <p className="mono" style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
            {PERIOD_LABELS[period]} · sorted by significance · {browseCases.length} {browseCases.length === 1 ? 'case' : 'cases'}
          </p>

          {browseCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p className="title-md" style={{ color: 'var(--on-surface)', marginBottom: '8px' }}>No cases in this period</p>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                No analysed decisions match your areas in the last {period === '1d' ? '48 hours' : '30 days'}.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {browseCases.map((c, i) => c.caseAnalysis && (
                <CaseCard
                  key={c.id}
                  rank={i + 1}
                  data={{
                    caseId: c.id,
                    citation: c.citation,
                    caseName: c.caseName,
                    court: c.court,
                    courtCode: c.courtCode,
                    decisionDate: c.decisionDate,
                    catchwords: c.catchwords ?? undefined,
                    jadeUrl: c.jadeUrl,
                    austliiUrl: c.austliiUrl,
                    factsSummary: c.caseAnalysis.factsSummary,
                    legalAnalysis: c.caseAnalysis.legalAnalysis,
                    whyItMatters: c.caseAnalysis.whyItMatters,
                    significanceScore: c.caseAnalysis.significanceScore,
                    primaryArea: c.caseAnalysis.primaryArea,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bw-spin    { to { transform: rotate(360deg); } }
        @keyframes bw-fadein  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .bw-notable-row:hover { background-color: var(--surface-container) !important; }
      `}</style>
    </div>
  )
}

// ── Weekly Analysis Box ──────────────────────────────────────────────────────

function WeeklyAnalysisBox({ summary, periodEnd }: { summary: string; periodEnd: string }) {
  const weekOf = new Date(periodEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const bullets = summary.split('. ').filter(Boolean)

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
        borderRadius: 'var(--rounded-lg)',
        padding: '24px 28px',
        marginBottom: '40px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={15} color="var(--secondary)" />
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.1rem', textTransform: 'uppercase', color: 'var(--secondary)',
          }}>
            Daily Brief
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          {weekOf}
        </span>
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: '18px' }} />

      {bullets.map((sentence, i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < bullets.length - 1 ? '10px' : 0, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--secondary)', marginTop: '7px', flexShrink: 0, fontSize: '7px' }}>◆</span>
          <p className="body-lg" style={{ color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.6 }}>
            {sentence.trim()}{sentence.trim().endsWith('.') ? '' : '.'}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Also Notable Row (flat, no accordion) ───────────────────────────────────

function NotableRow({ ec, alternate }: { ec: ExtendedCase; alternate: boolean }) {
  const date = ec.case.decisionDate ? new Date(ec.case.decisionDate) : null

  return (
    <Link
      to={`/cases/${ec.caseId}`}
      className="bw-notable-row"
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '12px 16px', textDecoration: 'none',
        backgroundColor: alternate ? 'var(--surface-container-low)' : 'var(--surface-container-lowest)',
        transition: 'background-color 150ms',
      }}
    >
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

      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="title-md" style={{ color: 'var(--on-surface)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ec.case.caseName}
        </p>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ec.oneLineSummary}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <AreaTag slug={ec.primaryArea} />
        <span className="mono" style={{ color: 'var(--on-surface-variant)', minWidth: '36px', textAlign: 'right' }}>
          {ec.significanceScore}/10
        </span>
        <ChevronRight size={14} color="var(--on-surface-variant)" />
      </div>
    </Link>
  )
}

// ── Sort Button ──────────────────────────────────────────────────────────────

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
        backgroundColor: active ? 'rgba(196, 154, 43, 0.12)' : 'transparent',
        color: active ? 'var(--secondary-container)' : 'var(--on-surface-variant)',
        transition: 'all 150ms',
      }}
    >
      {children}
    </button>
  )
}
