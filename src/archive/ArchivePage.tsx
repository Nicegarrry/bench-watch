import { useEffect, useState } from 'react'
import { apiFetch } from '../shared/apiFetch'
import { BriefHeader } from '../shared/components/BriefHeader'
import { AreaTag, AREA_LABELS } from '../shared/components/AreaTag'
import { Loader2, ChevronRight } from 'lucide-react'

type Digest = {
  id: string; status: string; digestSummary: string | null
  periodStart: string; periodEnd: string; areaSlugs: string[]
  createdAt: string; completedAt: string | null
  topCases: Array<{ id: string }>
  extendedCases: Array<{ id: string }>
}

type FilterState = { area: string; dateFrom: string; dateTo: string }

const EMPTY_FILTER: FilterState = { area: '', dateFrom: '', dateTo: '' }

export function ArchivePage() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [activeFilter, setActiveFilter] = useState<FilterState>(EMPTY_FILTER)

  useEffect(() => { fetchPage(0) }, [])

  async function fetchPage(p: number) {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/archive?page=${p}`)
      const data = await res.json()
      setDigests(data.digests ?? [])
      setTotal(data.total ?? 0)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  const filtered = digests.filter((d) => {
    if (activeFilter.area && !d.areaSlugs.includes(activeFilter.area)) return false
    if (activeFilter.dateFrom && new Date(d.createdAt) < new Date(activeFilter.dateFrom)) return false
    if (activeFilter.dateTo && new Date(d.createdAt) > new Date(activeFilter.dateTo)) return false
    return true
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <BriefHeader label="Research Archive" title="Historical Analysis" subtitle="Preserved litigation intelligence from past digests." />
        <button
          style={{
            flexShrink: 0, padding: '9px 16px',
            border: '1px solid var(--surface-dim)', borderRadius: 'var(--rounded-md)',
            background: 'none', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
            color: 'var(--on-surface-variant)', cursor: 'pointer',
          }}
        >
          ↓ Export Library
        </button>
      </div>

      {/* Filter bar */}
      <div
        style={{
          backgroundColor: 'var(--surface-container-low)',
          borderRadius: 'var(--rounded-lg)',
          padding: '16px 20px',
          display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <select
          value={filter.area}
          onChange={(e) => setFilter((f) => ({ ...f, area: e.target.value }))}
          style={{
            padding: '7px 12px', borderRadius: 'var(--rounded-md)',
            border: '1px solid rgba(70,70,77,0.15)',
            backgroundColor: 'var(--surface-container-lowest)',
            fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--on-surface)',
          }}
        >
          <option value="">All Practice Areas</option>
          {Object.entries(AREA_LABELS).map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>

        <input
          type="date"
          value={filter.dateFrom}
          onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value }))}
          style={{
            padding: '7px 12px', borderRadius: 'var(--rounded-md)',
            border: '1px solid rgba(70,70,77,0.15)',
            backgroundColor: 'var(--surface-container-lowest)',
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface)',
          }}
        />
        <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>to</span>
        <input
          type="date"
          value={filter.dateTo}
          onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value }))}
          style={{
            padding: '7px 12px', borderRadius: 'var(--rounded-md)',
            border: '1px solid rgba(70,70,77,0.15)',
            backgroundColor: 'var(--surface-container-lowest)',
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface)',
          }}
        />

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            onClick={() => { setFilter(EMPTY_FILTER); setActiveFilter(EMPTY_FILTER) }}
            style={{
              padding: '7px 14px', borderRadius: 'var(--rounded-md)',
              border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--on-surface-variant)',
            }}
          >
            Clear
          </button>
          <button
            onClick={() => setActiveFilter(filter)}
            style={{
              padding: '7px 16px', borderRadius: 'var(--rounded-md)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
              color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={22} color="var(--on-surface-variant)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>No digests found.</p>
        </div>
      ) : (
        <div>
          {filtered.map((d, i) => (
            <DigestRow key={d.id} digest={d} alternate={i % 2 === 1} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          <button
            onClick={() => fetchPage(page - 1)}
            disabled={page === 0}
            style={{
              padding: '7px 16px', borderRadius: 'var(--rounded-md)',
              border: '1px solid var(--surface-dim)', background: 'none',
              cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1,
              fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--on-surface-variant)',
            }}
          >← Previous</button>
          <span className="mono" style={{ color: 'var(--on-surface-variant)', padding: '7px 12px' }}>
            {page + 1} / {Math.ceil(total / 10)}
          </span>
          <button
            onClick={() => fetchPage(page + 1)}
            disabled={(page + 1) * 10 >= total}
            style={{
              padding: '7px 16px', borderRadius: 'var(--rounded-md)',
              border: '1px solid var(--surface-dim)', background: 'none',
              cursor: (page + 1) * 10 >= total ? 'not-allowed' : 'pointer',
              opacity: (page + 1) * 10 >= total ? 0.4 : 1,
              fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--on-surface-variant)',
            }}
          >Next →</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function DigestRow({ digest, alternate }: { digest: Digest; alternate: boolean }) {
  const total = digest.topCases.length + digest.extendedCases.length
  const date = new Date(digest.createdAt)

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px',
        backgroundColor: alternate ? 'var(--surface-container-low)' : 'transparent',
        borderRadius: 'var(--rounded-md)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
          {digest.areaSlugs.slice(0, 4).map((s) => <AreaTag key={s} slug={s} />)}
          {digest.areaSlugs.length > 4 && (
            <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>+{digest.areaSlugs.length - 4} more</span>
          )}
        </div>
        {digest.digestSummary && (
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '480px' }}>
            {digest.digestSummary}
          </p>
        )}
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 2px' }}>
          Results retrieved: {total}
        </p>
        <p className="mono" style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '12px' }}>
          {date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <ChevronRight size={16} color="var(--surface-dim)" />
    </div>
  )
}
