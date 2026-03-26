import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../shared/apiFetch'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Feed = {
  id: string; courtCode: string; courtName: string; tier: number
  lastPolledAt: string | null; lastSuccessfulAt: string | null
  lastError: string | null; lastHttpStatus: number | null; itemsLastPoll: number
}

type DiscoveryRun = {
  id: string; status: string; createdAt: string; completedAt: string | null
  courtsPolled: string[]; casesDiscovered: number; errorMessage: string | null
}

type DigestRun = {
  id: string; status: string; createdAt: string; completedAt: string | null
  areaSlugs: string[]; errorMessage: string | null
  modelUsed: string | null; tokensUsed: number | null
}

type PhaseStats = {
  p1: { casesTotal: number; casesThisWeek: number }
  p2a: { casesUntriaged: number; casesTriaged: number; casesHighSignificance: number }
  p2b: { casesNeedingExcerpt: number; casesExcerptFetched: number }
  p2c: { casesNeedingAnalysis: number; casesAnalysed: number }
  p3: { usersOnboarded: number; digestsThisWeek: number; digestsPending: number }
}

type AdminStatus = {
  feeds: Feed[]
  discoveryRuns: DiscoveryRun[]
  recentDigests: DigestRun[]
  phases: PhaseStats
  env: { hasAnthropicKey: boolean; databaseUrl: string; nodeEnv: string }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ago(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fmt(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: '#d1fae5', color: '#065f46' },
    running:   { bg: '#fef3c7', color: '#92400e' },
    pending:   { bg: '#e0e7ff', color: '#3730a3' },
    failed:    { bg: '#fee2e2', color: '#991b1b' },
  }
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)',
      backgroundColor: s.bg, color: s.color, textTransform: 'uppercase',
    }}>
      {status}
    </span>
  )
}

function Num({ n, label, warn }: { n: number; label: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '56px' }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700,
        color: warn && n > 0 ? '#D4873A' : 'var(--on-surface)',
      }}>{n}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--on-surface-variant)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </div>
  )
}

function PhaseCard({
  number, label, description, stats, endpoint, triggering, onTrigger, lastRun, lastStatus, extraActions,
}: {
  number: string; label: string; description: string
  stats: React.ReactNode
  endpoint: string
  triggering: string | null
  onTrigger: (endpoint: string) => void
  lastRun?: string | null
  lastStatus?: string | null
  extraActions?: React.ReactNode
}) {
  const isThis = triggering === endpoint
  const busy = !!triggering

  return (
    <div style={{
      border: '1px solid var(--surface-dim)',
      borderRadius: 'var(--rounded-lg)',
      backgroundColor: 'var(--surface-container-low)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', gap: '16px',
        borderBottom: '1px solid var(--surface-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: lastStatus === 'completed' ? '#d1fae5' : lastStatus === 'failed' ? '#fee2e2' : 'var(--surface-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
              {number}
            </span>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
              {label}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--on-surface-variant)', margin: '1px 0 0' }}>
              {description}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {lastRun && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
              {ago(lastRun)}
            </span>
          )}
          {extraActions}
          <button
            onClick={() => onTrigger(endpoint)}
            disabled={busy}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px',
              backgroundColor: isThis ? 'var(--surface-dim)' : 'var(--primary)',
              color: '#ffffff',
              border: 'none', borderRadius: 'var(--rounded-md)',
              fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy && !isThis ? 0.4 : 1,
              transition: 'opacity 150ms',
            }}
          >
            {isThis && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
            {isThis ? 'Triggered' : 'Run'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {stats}
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      textAlign: 'left', padding: '7px 12px',
      fontFamily: 'var(--font-mono)', fontSize: '10px',
      color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </th>
  )
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td style={{
      padding: '9px 12px', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: '12px', color: 'var(--on-surface)', verticalAlign: 'middle',
    }}>
      {children}
    </td>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--on-surface-variant)',
      textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px',
    }}>
      {children}
    </p>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DevPage() {
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [log, setLog] = useState<{ text: string; ok: boolean } | null>(null)

  const fetchStatus = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus(await res.json())
    } catch (e: any) {
      setError(e.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  async function trigger(endpoint: string) {
    if (triggering) return
    setTriggering(endpoint)
    setLog(null)
    try {
      const res = await apiFetch(`/api/admin/${endpoint}`, { method: 'POST' })
      const data = await res.json()
      setLog({ text: data.message ?? 'Triggered', ok: res.ok })
      // Refresh stats after a short delay so counts update
      setTimeout(() => fetchStatus(true), 3000)
    } catch (e: any) {
      setLog({ text: e.message ?? 'Error', ok: false })
    } finally {
      setTriggering(null)
    }
  }

  const lastDiscovery = status?.discoveryRuns[0] ?? null
  const lastDigest = status?.recentDigests[0] ?? null

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 5px' }}>
            Dev Console
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
            Pipeline Status
          </h1>
        </div>
        <button
          onClick={() => fetchStatus()}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px',
            backgroundColor: 'var(--surface-container-low)',
            border: '1px solid var(--surface-dim)',
            borderRadius: 'var(--rounded-md)',
            fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
            color: 'var(--on-surface-variant)', cursor: loading ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Log message ── */}
      {log && (
        <div style={{
          marginBottom: '20px', padding: '10px 14px',
          borderRadius: 'var(--rounded-md)',
          borderLeft: `3px solid ${log.ok ? '#059669' : '#B83230'}`,
          backgroundColor: log.ok ? '#d1fae5' : '#fee2e2',
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: log.ok ? '#065f46' : '#991b1b',
        }}>
          {log.text}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#fee2e2', borderRadius: 'var(--rounded-md)', color: '#991b1b', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading && !status && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={20} color="var(--on-surface-variant)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {status && (
        <>
          {/* ── Env ── */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <EnvChip label="ANTHROPIC_API_KEY" ok={status.env.hasAnthropicKey} />
            <EnvChip label="DATABASE_URL" ok={status.env.databaseUrl === '✓ set'} />
            <EnvChip label={`NODE_ENV: ${status.env.nodeEnv}`} ok neutral />
            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={() => trigger('setup-test-user')}
                disabled={!!triggering}
                style={{
                  padding: '6px 14px', backgroundColor: '#B83230', color: '#fff',
                  border: 'none', borderRadius: 'var(--rounded-md)',
                  fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
                  cursor: triggering ? 'not-allowed' : 'pointer', opacity: triggering && triggering !== 'setup-test-user' ? 0.4 : 1,
                }}
              >
                {triggering === 'setup-test-user' ? 'Setting up…' : 'Setup Test User'}
              </button>
            </div>
          </div>

          {/* ── Backfill ── */}
          <div style={{
            marginBottom: '28px', padding: '16px 20px',
            backgroundColor: '#1A1F36', borderRadius: 'var(--rounded-lg)',
            border: '1px solid #C49A2B',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#C49A2B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Backfill — populate database from scratch
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  Fetches ALL cases currently in JADE feeds (no 7-day limit) then run 2a → 2b → 2c below.
                  JADE feeds typically hold ~4–8 weeks of decisions per court.
                </p>
              </div>
              <button
                onClick={() => trigger('backfill-discovery')}
                disabled={!!triggering}
                style={{
                  padding: '8px 18px', backgroundColor: '#C49A2B', color: '#1A1F36',
                  border: 'none', borderRadius: 'var(--rounded-md)',
                  fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700,
                  cursor: triggering ? 'not-allowed' : 'pointer',
                  opacity: triggering && triggering !== 'backfill-discovery' ? 0.4 : 1,
                  flexShrink: 0,
                }}
              >
                {triggering === 'backfill-discovery' ? 'Triggered…' : 'Run Backfill Discovery'}
              </button>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '10px 0 0' }}>
              After: run 2a (triage all) → 2b (fetch text) → 2c (analyse) to fully populate case_analyses
            </p>
          </div>

          {/* ── Architecture note ── */}
          <div style={{
            marginBottom: '28px', padding: '12px 16px',
            backgroundColor: 'var(--surface-container-low)',
            borderRadius: 'var(--rounded-md)', borderLeft: '3px solid var(--surface-dim)',
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', margin: 0 }}>
              <strong style={{ color: 'var(--on-surface)' }}>Weekly batch</strong> (shared, runs once Sunday AEST):&nbsp;
              Phase 1 → 2a → 2b → 2c&nbsp;&nbsp;
              <strong style={{ color: 'var(--on-surface)' }}>On user demand</strong> (per-user, "New Research" button):&nbsp;
              Phase 3 only — reads pre-computed analyses, ranks for the user's areas.
            </p>
          </div>

          {/* ── 5 Pipeline Phases ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
            <SectionLabel>Pipeline Phases — run in order</SectionLabel>

            {/* Phase 1 */}
            <PhaseCard
              number="1"
              label="DISCOVERY"
              description="Poll 13 JADE RSS feeds → upsert cases table"
              endpoint="trigger-discovery"
              triggering={triggering}
              onTrigger={trigger}
              lastRun={lastDiscovery?.createdAt}
              lastStatus={lastDiscovery?.status}
              stats={
                <>
                  <Num n={status.phases.p1.casesThisWeek} label="this week" />
                  <Num n={status.phases.p1.casesTotal} label="total cases" />
                  <Num n={status.feeds.filter(f => f.lastHttpStatus === 200).length} label={`feeds OK / ${status.feeds.length}`} />
                  {lastDiscovery && (
                    <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                      <StatusPill status={lastDiscovery.status} />
                      {lastDiscovery.errorMessage && (
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#B83230', margin: '4px 0 0', maxWidth: '240px' }}>
                          {lastDiscovery.errorMessage.slice(0, 80)}
                        </p>
                      )}
                    </div>
                  )}
                </>
              }
            />

            {/* Phase 2a */}
            <PhaseCard
              number="2a"
              label="AI TRIAGE"
              description="Batch cases → Claude significance score + area tags"
              endpoint="trigger-triage"
              triggering={triggering}
              onTrigger={trigger}
              stats={
                <>
                  <Num n={status.phases.p2a.casesUntriaged} label="untriaged" warn />
                  <Num n={status.phases.p2a.casesTriaged} label="tagged" />
                  <Num n={status.phases.p2a.casesHighSignificance} label="score 7+" />
                </>
              }
            />

            {/* Phase 2b */}
            <PhaseCard
              number="2b"
              label="TEXT RETRIEVAL"
              description="Fetch judgment text from AustLII for 7+ scored cases"
              endpoint="trigger-text-retrieval"
              triggering={triggering}
              onTrigger={trigger}
              stats={
                <>
                  <Num n={status.phases.p2b.casesNeedingExcerpt} label="pending fetch" warn />
                  <Num n={status.phases.p2b.casesExcerptFetched} label="fetched" />
                </>
              }
            />

            {/* Phase 2c */}
            <PhaseCard
              number="2c"
              label="CASE ANALYSIS"
              description="Full AI analysis per case (facts, legal analysis, why it matters)"
              endpoint="trigger-case-analysis"
              triggering={triggering}
              onTrigger={trigger}
              extraActions={
                <button
                  onClick={() => trigger('trigger-case-analysis?limit=3')}
                  disabled={!!triggering}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: 'var(--on-surface-variant)',
                    border: '1px solid var(--surface-dim)',
                    borderRadius: 'var(--rounded-md)',
                    fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600,
                    cursor: triggering ? 'not-allowed' : 'pointer',
                    opacity: triggering && triggering !== 'trigger-case-analysis?limit=3' ? 0.4 : 1,
                  }}
                >
                  Test (3)
                </button>
              }
              stats={
                <>
                  <Num n={status.phases.p2c.casesNeedingAnalysis} label="pending analysis" warn />
                  <Num n={status.phases.p2c.casesAnalysed} label="analysed" />
                </>
              }
            />

            {/* Phase 3 */}
            <PhaseCard
              number="3"
              label="USER DIGESTS"
              description="Per-user cross-prioritisation and digest generation"
              endpoint="trigger-digests"
              triggering={triggering}
              onTrigger={trigger}
              lastRun={lastDigest?.createdAt}
              lastStatus={lastDigest?.status}
              stats={
                <>
                  <Num n={status.phases.p3.usersOnboarded} label="users ready" />
                  <Num n={status.phases.p3.digestsThisWeek} label="this week" />
                  <Num n={status.phases.p3.digestsPending} label="pending" warn />
                  {lastDigest && (
                    <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                      <StatusPill status={lastDigest.status} />
                      {lastDigest.errorMessage && (
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#B83230', margin: '4px 0 0' }}>
                          {lastDigest.errorMessage.slice(0, 80)}
                        </p>
                      )}
                    </div>
                  )}
                </>
              }
            />
          </div>

          {/* ── RSS Feeds ── */}
          <section style={{ marginBottom: '32px' }}>
            <SectionLabel>RSS Feeds ({status.feeds.length} registered)</SectionLabel>
            <div style={{ overflowX: 'auto', border: '1px solid var(--surface-dim)', borderRadius: 'var(--rounded-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: '12px' }}>
                <thead style={{ backgroundColor: 'var(--surface-container-low)' }}>
                  <tr>
                    {['T', 'Court', 'Last polled', 'HTTP', 'Items', 'Error'].map(h => <Th key={h}>{h}</Th>)}
                  </tr>
                </thead>
                <tbody>
                  {status.feeds.map((feed, i) => (
                    <tr key={feed.id} style={{ borderTop: '1px solid var(--surface-dim)', backgroundColor: i % 2 === 1 ? 'var(--surface-container-low)' : 'transparent' }}>
                      <Td mono>{feed.tier}</Td>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {feed.lastHttpStatus === 200
                            ? <CheckCircle size={11} color="#059669" />
                            : feed.lastHttpStatus
                            ? <XCircle size={11} color="#B83230" />
                            : <Clock size={11} color="#9ca3af" />}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{feed.courtCode}</span>
                          <span style={{ color: 'var(--on-surface-variant)' }}>{feed.courtName}</span>
                        </div>
                      </Td>
                      <Td mono>{ago(feed.lastPolledAt)}</Td>
                      <Td>
                        {feed.lastHttpStatus
                          ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: feed.lastHttpStatus === 200 ? '#059669' : '#B83230' }}>{feed.lastHttpStatus}</span>
                          : '—'}
                      </Td>
                      <Td mono>{feed.itemsLastPoll}</Td>
                      <Td>
                        {feed.lastError
                          ? <span style={{ color: '#B83230', fontSize: '11px' }}>{feed.lastError.slice(0, 50)}</span>
                          : '—'}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Discovery Runs ── */}
          <section style={{ marginBottom: '32px' }}>
            <SectionLabel>Discovery Runs</SectionLabel>
            {status.discoveryRuns.length === 0
              ? <Empty>No discovery runs yet</Empty>
              : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--surface-dim)', borderRadius: 'var(--rounded-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--surface-container-low)' }}>
                      <tr>{['Started', 'Status', 'Courts', 'Cases', 'Error'].map(h => <Th key={h}>{h}</Th>)}</tr>
                    </thead>
                    <tbody>
                      {status.discoveryRuns.map((r, i) => (
                        <tr key={r.id} style={{ borderTop: '1px solid var(--surface-dim)', backgroundColor: i % 2 === 1 ? 'var(--surface-container-low)' : 'transparent' }}>
                          <Td mono>{fmt(r.createdAt)}</Td>
                          <Td><StatusPill status={r.status} /></Td>
                          <Td mono>{r.courtsPolled.length}</Td>
                          <Td mono>{r.casesDiscovered}</Td>
                          <Td>{r.errorMessage ? <span style={{ color: '#B83230', fontSize: '11px' }}>{r.errorMessage.slice(0, 60)}</span> : '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>

          {/* ── Recent Digests ── */}
          <section>
            <SectionLabel>Recent User Digests</SectionLabel>
            {status.recentDigests.length === 0
              ? <Empty>No digests yet — run Phase 3</Empty>
              : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--surface-dim)', borderRadius: 'var(--rounded-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--surface-container-low)' }}>
                      <tr>{['Created', 'Status', 'Areas', 'Model', 'Tokens', 'Completed', 'Error'].map(h => <Th key={h}>{h}</Th>)}</tr>
                    </thead>
                    <tbody>
                      {status.recentDigests.map((d, i) => (
                        <tr key={d.id} style={{ borderTop: '1px solid var(--surface-dim)', backgroundColor: i % 2 === 1 ? 'var(--surface-container-low)' : 'transparent' }}>
                          <Td mono>{fmt(d.createdAt)}</Td>
                          <Td><StatusPill status={d.status} /></Td>
                          <Td mono>{d.areaSlugs.length}</Td>
                          <Td mono>{d.modelUsed ?? '—'}</Td>
                          <Td mono>{d.tokensUsed?.toLocaleString() ?? '—'}</Td>
                          <Td mono>{d.completedAt ? ago(d.completedAt) : '—'}</Td>
                          <Td>{d.errorMessage ? <span style={{ color: '#B83230', fontSize: '11px' }}>{d.errorMessage.slice(0, 50)}</span> : '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function EnvChip({ label, ok, neutral }: { label: string; ok: boolean; neutral?: boolean }) {
  const bg = neutral ? 'var(--surface-container)' : ok ? '#d1fae5' : '#fee2e2'
  const color = neutral ? 'var(--on-surface-variant)' : ok ? '#065f46' : '#991b1b'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '5px 10px', borderRadius: 'var(--rounded-md)',
      backgroundColor: bg, fontFamily: 'var(--font-mono)', fontSize: '11px', color,
    }}>
      {!neutral && (ok ? <CheckCircle size={11} /> : <AlertTriangle size={11} />)}
      {label}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '20px', textAlign: 'center', border: '1px solid var(--surface-dim)',
      borderRadius: 'var(--rounded-md)', fontFamily: 'var(--font-sans)',
      fontSize: '12px', color: 'var(--on-surface-variant)',
    }}>
      {children}
    </div>
  )
}
