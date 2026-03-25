import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { CourtBadge } from './CourtBadge'
import { SignificanceBadge, getSignificanceColor } from './SignificanceBadge'
import { AreaTag } from './AreaTag'

type CaseCardData = {
  citation: string
  caseName: string
  court: string
  courtCode?: string
  decisionDate?: string | null
  catchwords?: string | null
  jadeUrl?: string | null
  austliiUrl?: string | null
  factsSummary: string
  legalAnalysis: string
  whyItMatters: string
  significanceScore: number
  primaryArea: string
}

type CaseCardProps = {
  data: CaseCardData
  variant?: 'full' | 'compact'
  rank?: number
}

export function CaseCard({ data, variant = 'full', rank }: CaseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const accentColor = getSignificanceColor(data.significanceScore)

  if (variant === 'compact') {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface-container-lowest)',
          borderLeft: `4px solid ${accentColor}`,
          borderRadius: 'var(--rounded-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Collapsed row */}
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            width: '100%', display: 'flex', alignItems: 'flex-start',
            gap: '16px', padding: '16px 20px', background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="title-md" style={{ color: 'var(--on-surface)', margin: 0 }}>{data.caseName}</p>
            <p className="mono" style={{ color: 'var(--on-surface-variant)', marginTop: '3px' }}>{data.citation}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <AreaTag slug={data.primaryArea} />
            <span className="mono" style={{ color: 'var(--on-surface-variant)' }}>{data.significanceScore}/10</span>
            {expanded ? <ChevronUp size={14} color="var(--on-surface-variant)" /> : <ChevronDown size={14} color="var(--on-surface-variant)" />}
          </div>
        </button>

        {expanded && (
          <div style={{ padding: '0 20px 20px' }}>
            <FullCardBody data={data} />
          </div>
        )}
      </div>
    )
  }

  return (
    <article
      style={{
        backgroundColor: 'var(--surface-container-lowest)',
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 'var(--rounded-lg)',
        padding: '28px 32px',
      }}
    >
      {/* Badge row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <CourtBadge courtCode={data.courtCode ?? data.court} />
        <SignificanceBadge score={data.significanceScore} />
        <AreaTag slug={data.primaryArea} />
        {rank && (
          <span className="label-sm" style={{ color: 'var(--on-surface-variant)', marginLeft: 'auto' }}>
            #{rank}
          </span>
        )}
      </div>

      {/* Case name + citation */}
      <h2 className="title-lg" style={{ color: 'var(--on-surface)', margin: '0 0 6px' }}>
        {data.caseName}
      </h2>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <span className="mono" style={{ color: 'var(--on-surface-variant)' }}>{data.citation}</span>
        {data.decisionDate && (
          <span className="mono" style={{ color: 'var(--on-surface-variant)' }}>
            {new Date(data.decisionDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Catchwords */}
      {data.catchwords && (
        <blockquote
          style={{
            borderLeft: '2px solid var(--secondary)',
            paddingLeft: '16px',
            margin: '0 0 20px',
            fontFamily: 'var(--font-serif)',
            fontSize: '14px',
            fontStyle: 'italic',
            color: 'var(--on-surface-variant)',
            lineHeight: 1.6,
          }}
        >
          {data.catchwords.slice(0, 200)}{data.catchwords.length > 200 ? '…' : ''}
        </blockquote>
      )}

      <FullCardBody data={data} />

      {/* Footer links */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px' }}>
        <p className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>
          ● BENCHWATCH PRIORITISED ANALYSIS
        </p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {data.austliiUrl && (
            <a
              href={data.austliiUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600,
                color: 'var(--secondary-container)', textDecoration: 'none',
              }}
            >
              View on AustLII <ExternalLink size={12} />
            </a>
          )}
          {data.jadeUrl && (
            <a
              href={data.jadeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                color: 'var(--on-surface-variant)', textDecoration: 'none',
              }}
            >
              JADE <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function FullCardBody({ data }: { data: CaseCardData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Facts */}
      <section>
        <p className="label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px' }}>FACTS</p>
        <p className="body-md" style={{ color: 'var(--on-surface)', margin: 0, whiteSpace: 'pre-line' }}>
          {data.factsSummary}
        </p>
      </section>

      {/* Analysis */}
      <section>
        <p className="label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px' }}>ANALYSIS</p>
        <p className="body-md" style={{ color: 'var(--on-surface)', margin: 0, whiteSpace: 'pre-line' }}>
          {data.legalAnalysis}
        </p>
      </section>

      {/* Why it matters */}
      <div
        style={{
          backgroundColor: 'var(--surface-container)',
          borderLeft: '3px solid var(--secondary-container)',
          padding: '16px 20px',
          borderRadius: '0 var(--rounded-md) var(--rounded-md) 0',
        }}
      >
        <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '6px' }}>WHY IT MATTERS</p>
        <p
          style={{
            fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 400,
            fontStyle: 'italic', lineHeight: 1.6, color: 'var(--on-surface)', margin: 0,
          }}
        >
          {data.whyItMatters}
        </p>
      </div>
    </div>
  )
}
