import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { apiFetch } from '../shared/apiFetch'
import { BriefHeader } from '../shared/components/BriefHeader'
import { AreaTag, AREA_LABELS } from '../shared/components/AreaTag'
import { getSignificanceColor } from '../shared/components/SignificanceBadge'
import { Loader2, Search, X } from 'lucide-react'

type CaseSummary = {
  id: string
  significanceScore: number
  primaryArea: string
  case: { id: string; citation: string; caseName: string; courtCode?: string; decisionDate?: string }
}

export function CaseLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [selectedArea, setSelectedArea] = useState<string | null>(searchParams.get('area') ?? null)
  const [allCases, setAllCases] = useState<CaseSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/cases')
      .then((r) => r.json())
      .then((d) => setAllCases(d.analyses ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Sync URL params as user filters
  useEffect(() => {
    const params: Record<string, string> = {}
    if (search.trim()) params.q = search.trim()
    if (selectedArea) params.area = selectedArea
    setSearchParams(params, { replace: true })
  }, [search, selectedArea])

  const filtered = useMemo(() => {
    let result = allCases
    if (selectedArea) result = result.filter((c) => c.primaryArea === selectedArea)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (c) =>
          c.case.caseName.toLowerCase().includes(q) ||
          c.case.citation.toLowerCase().includes(q)
      )
    }
    return result
  }, [allCases, selectedArea, search])

  // Group by area only when showing all with no search
  const grouped = useMemo(() => {
    if (selectedArea || search.trim()) return null
    const groups: Record<string, CaseSummary[]> = {}
    for (const c of filtered) {
      const a = c.primaryArea || 'other'
      if (!groups[a]) groups[a] = []
      groups[a].push(c)
    }
    return groups
  }, [filtered, selectedArea, search])

  const isFiltering = !!search.trim() || !!selectedArea

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <BriefHeader label="All Analysed Cases" title="Case Library" />
        {!loading && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--on-surface-variant)', paddingTop: '4px' }}>
            {isFiltering ? `${filtered.length} of ${allCases.length}` : allCases.length} cases
          </span>
        )}
      </div>

      {/* Search + area filters */}
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case name or citation…"
            style={{
              width: '100%',
              padding: '9px 36px 9px 36px',
              backgroundColor: 'var(--surface-container-low)',
              border: '1px solid var(--surface-dim)',
              borderRadius: 'var(--rounded-md)',
              fontFamily: 'var(--font-sans)', fontSize: '14px',
              color: 'var(--on-surface)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--on-surface-variant)', padding: 0, display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Area pill filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <AreaFilterPill label="All areas" active={selectedArea === null} onClick={() => setSelectedArea(null)} />
          {Object.entries(AREA_LABELS).map(([slug, label]) => {
            const count = allCases.filter((c) => c.primaryArea === slug).length
            if (count === 0) return null
            return (
              <AreaFilterPill
                key={slug}
                label={label}
                count={count}
                active={selectedArea === slug}
                onClick={() => setSelectedArea((s) => (s === slug ? null : slug))}
              />
            )
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={20} color="var(--on-surface-variant)" style={{ animation: 'bw-spin 1s linear infinite' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p className="title-md" style={{ color: 'var(--on-surface)', marginBottom: '8px' }}>No cases found</p>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
            Try a different search or clear the area filter.
          </p>
        </div>
      )}

      {/* Grouped view (All areas, no search) */}
      {!loading && grouped && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(grouped)
            .sort(([a], [b]) => (AREA_LABELS[a] ?? a).localeCompare(AREA_LABELS[b] ?? b))
            .map(([area, cases]) => (
              <section key={area}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{
                    margin: 0,
                    fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700,
                    letterSpacing: '0.06rem', textTransform: 'uppercase',
                    color: 'var(--on-surface-variant)',
                  }}>
                    {AREA_LABELS[area] ?? area}
                  </h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', opacity: 0.6 }}>
                    {cases.length}
                  </span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-dim)' }} />
                </div>
                <div style={{ borderRadius: 'var(--rounded-lg)', overflow: 'hidden', border: '1px solid var(--surface-dim)' }}>
                  {cases.map((c, i) => (
                    <CaseRow key={c.id} c={c} alternate={i % 2 === 1} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      {/* Flat filtered list */}
      {!loading && !grouped && filtered.length > 0 && (
        <div style={{ borderRadius: 'var(--rounded-lg)', overflow: 'hidden', border: '1px solid var(--surface-dim)' }}>
          {filtered.map((c, i) => (
            <CaseRow key={c.id} c={c} alternate={i % 2 === 1} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes bw-spin { to { transform: rotate(360deg); } }
        .bw-case-row:hover { background-color: var(--surface-container) !important; }
      `}</style>
    </div>
  )
}

// ── Case row ─────────────────────────────────────────────────────────────────

function CaseRow({ c, alternate }: { c: CaseSummary; alternate: boolean }) {
  const color = getSignificanceColor(c.significanceScore)
  const date = c.case.decisionDate ? new Date(c.case.decisionDate) : null

  return (
    <Link
      to={`/cases/${c.case.id}`}
      className="bw-case-row"
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '12px 16px', textDecoration: 'none',
        backgroundColor: alternate ? 'var(--surface-container-low)' : 'var(--surface-container-lowest)',
        transition: 'background-color 150ms',
        borderLeft: `4px solid ${color}`,
      }}
    >
      {/* Score */}
      <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color }}>
          {c.significanceScore}
        </span>
      </div>

      {/* Case info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: '0 0 3px', fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600,
          color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {c.case.caseName}
        </p>
        <p style={{
          margin: 0, fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {c.case.citation}
          {c.case.courtCode && <span style={{ marginLeft: '8px', opacity: 0.6 }}>{c.case.courtCode}</span>}
        </p>
      </div>

      {/* Right meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {date && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            {date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
        <AreaTag slug={c.primaryArea} />
      </div>
    </Link>
  )
}

// ── Area filter pill ──────────────────────────────────────────────────────────

function AreaFilterPill({
  label, count, active, onClick,
}: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        border: `1px solid ${active ? 'var(--secondary-container)' : 'var(--surface-dim)'}`,
        borderRadius: 'var(--rounded-md)',
        background: active ? 'rgba(196, 154, 43, 0.12)' : 'transparent',
        color: active ? 'var(--secondary-container)' : 'var(--on-surface-variant)',
        fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500,
        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{ opacity: 0.6, fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{count}</span>
      )}
    </button>
  )
}
