import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, ExternalLink, BookOpen, Scale } from 'lucide-react'
import { apiFetch } from '../shared/apiFetch'
import { CourtBadge } from '../shared/components/CourtBadge'
import { SignificanceBadge, getSignificanceColor } from '../shared/components/SignificanceBadge'
import { AreaTag } from '../shared/components/AreaTag'
import { SkeletonLine } from '../shared/components/Skeleton'

type CaseAnalysis = {
  id: string
  caseId: string
  factsSummary: string
  legalAnalysis: string
  whyItMatters: string
  significanceScore: number
  scoreJustification: string | null
  primaryArea: string
  secondaryAreas: string[]
  classificationReasoning: string | null
  commentaryUrls: string[]
  modelUsed: string | null
  generatedAt: string
  case: {
    citation: string
    caseName: string
    court: string
    courtCode?: string
    decisionDate?: string | null
    catchwords?: string | null
    jadeUrl?: string | null
    austliiUrl?: string | null
    bench?: string | null
  }
}

function SkeletonAnalysisPage() {
  return (
    <div style={{ animation: 'bw-fadein 300ms ease forwards' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(160deg, var(--primary) 0%, var(--primary-container) 100%)',
          borderRadius: 'var(--rounded-lg)',
          padding: '36px 40px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <SkeletonLine width="56px" height="22px" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
          <SkeletonLine width="120px" height="22px" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
          <SkeletonLine width="88px" height="22px" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
        </div>
        <SkeletonLine width="75%" height="34px" style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
        <SkeletonLine width="48%" height="34px" style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
        <div style={{ display: 'flex', gap: '16px' }}>
          <SkeletonLine width="140px" height="13px" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '4px' }} />
          <SkeletonLine width="90px" height="13px" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '4px' }} />
        </div>
      </div>
      {/* Body sections */}
      {['FACTS', 'ANALYSIS', 'WHY IT MATTERS'].map((label) => (
        <div key={label} style={{ marginBottom: '32px' }}>
          <SkeletonLine width="60px" height="10px" style={{ marginBottom: '12px' }} />
          <SkeletonLine width="100%" height="13px" style={{ marginBottom: '5px' }} />
          <SkeletonLine width="100%" height="13px" style={{ marginBottom: '5px' }} />
          <SkeletonLine width="80%" height="13px" />
        </div>
      ))}
      <style>{`
        @keyframes bw-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bw-shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .bw-skeleton { background: linear-gradient(90deg, var(--surface-container) 0%, var(--surface-container-high) 50%, var(--surface-container) 100%); background-size:200% 100%; animation: bw-shimmer 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export function CaseAnalysisPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiFetch(`/api/cases/${id}/analysis`)
      .then((res) => {
        if (!res.ok) return res.json().then((d: any) => Promise.reject(d.message ?? `HTTP ${res.status}`))
        return res.json()
      })
      .then((data: CaseAnalysis) => setAnalysis(data))
      .catch((e: any) => setError(typeof e === 'string' ? e : e.message ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  const accentColor = analysis ? getSignificanceColor(analysis.significanceScore) : 'var(--surface-dim)'

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 24px',
          fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
          color: 'var(--on-surface-variant)',
          transition: 'color 150ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--on-surface)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--on-surface-variant)')}
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {loading && <SkeletonAnalysisPage />}

      {error && !loading && (
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--surface-container-lowest)',
            borderLeft: '4px solid var(--error)',
            borderRadius: 'var(--rounded-lg)',
            color: 'var(--error)',
            fontFamily: 'var(--font-sans)', fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {analysis && !loading && (
        <div style={{ animation: 'bw-fadein 350ms ease forwards' }}>
          {/* ── Hero ── */}
          <div
            style={{
              background: 'linear-gradient(160deg, var(--primary) 0%, var(--primary-container) 100%)',
              borderRadius: 'var(--rounded-lg)',
              padding: '36px 40px',
              marginBottom: '32px',
              borderLeft: `5px solid ${accentColor}`,
            }}
          >
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              <CourtBadge courtCode={analysis.case.courtCode ?? analysis.case.court} />
              <SignificanceBadge score={analysis.significanceScore} />
              <AreaTag slug={analysis.primaryArea} />
              {analysis.secondaryAreas.map((a) => (
                <AreaTag key={a} slug={a} />
              ))}
            </div>

            {/* Case name */}
            <h1
              style={{
                fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700,
                color: '#ffffff', margin: '0 0 12px', lineHeight: 1.25,
              }}
            >
              {analysis.case.caseName}
            </h1>

            {/* Metadata row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500,
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                {analysis.case.citation}
              </span>
              {analysis.case.decisionDate && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '13px',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  {new Date(analysis.case.decisionDate).toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              )}
              {analysis.case.bench && (
                <span
                  style={{
                    fontFamily: 'var(--font-sans)', fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {analysis.case.bench}
                </span>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Catchwords */}
            {analysis.case.catchwords && (
              <div style={{ marginBottom: '32px' }}>
                <blockquote
                  style={{
                    borderLeft: '2px solid var(--secondary)',
                    paddingLeft: '20px',
                    margin: 0,
                    fontFamily: 'var(--font-serif)', fontSize: '15px', fontStyle: 'italic',
                    color: 'var(--on-surface-variant)', lineHeight: 1.65,
                  }}
                >
                  {analysis.case.catchwords.slice(0, 400)}
                  {analysis.case.catchwords.length > 400 ? '…' : ''}
                </blockquote>
              </div>
            )}

            <ContentSection label="Facts">
              <p className="body-md" style={{ color: 'var(--on-surface)', margin: 0, whiteSpace: 'pre-line' }}>
                {analysis.factsSummary}
              </p>
            </ContentSection>

            <Divider />

            <ContentSection label="Analysis">
              <p className="body-md" style={{ color: 'var(--on-surface)', margin: 0, whiteSpace: 'pre-line' }}>
                {analysis.legalAnalysis}
              </p>
            </ContentSection>

            <Divider />

            {/* Why it matters — highlighted */}
            <div
              style={{
                backgroundColor: '#F5F0E8',
                borderLeft: '3px solid var(--secondary-container)',
                padding: '20px 24px',
                borderRadius: '0 var(--rounded-md) var(--rounded-md) 0',
                marginBottom: '32px',
              }}
            >
              <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '8px' }}>
                WHY IT MATTERS
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 400,
                  fontStyle: 'italic', lineHeight: 1.65, color: 'var(--on-surface)', margin: 0,
                }}
              >
                {analysis.whyItMatters}
              </p>
            </div>

            {/* Score justification */}
            {analysis.scoreJustification && (
              <>
                <Divider />
                <ContentSection label={`Significance: ${analysis.significanceScore}/10`}>
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                    {analysis.scoreJustification}
                  </p>
                </ContentSection>
              </>
            )}

            {/* Classification reasoning */}
            {analysis.classificationReasoning && (
              <>
                <Divider />
                <ContentSection label="Classification">
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                    {analysis.classificationReasoning}
                  </p>
                </ContentSection>
              </>
            )}

            {/* Commentary */}
            {analysis.commentaryUrls && analysis.commentaryUrls.length > 0 && (
              <>
                <Divider />
                <ContentSection label="Commentary">
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analysis.commentaryUrls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500,
                            color: 'var(--secondary-container)', textDecoration: 'none',
                          }}
                        >
                          <BookOpen size={13} />
                          {url.length > 80 ? url.slice(0, 80) + '…' : url}
                          <ExternalLink size={11} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </ContentSection>
              </>
            )}

            {/* Footer */}
            <Divider />
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '12px', paddingTop: '4px', paddingBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={13} color="var(--on-surface-variant)" />
                <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                  BENCHWATCH PRIORITISED ANALYSIS
                  {analysis.generatedAt && (
                    <> · {new Date(analysis.generatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {analysis.case.austliiUrl && (
                  <a
                    href={analysis.case.austliiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600,
                      color: 'var(--secondary-container)', textDecoration: 'none',
                    }}
                  >
                    Full Judgment <ExternalLink size={12} />
                  </a>
                )}
                {analysis.case.jadeUrl && (
                  <a
                    href={analysis.case.jadeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                      color: 'var(--on-surface-variant)', textDecoration: 'none',
                    }}
                  >
                    JADE <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bw-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bw-shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .bw-skeleton { background: linear-gradient(90deg, var(--surface-container) 0%, var(--surface-container-high) 50%, var(--surface-container) 100%); background-size:200% 100%; animation: bw-shimmer 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

function ContentSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p className="label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '10px' }}>{label.toUpperCase()}</p>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: 'var(--surface-dim)',
        marginBottom: '32px',
      }}
    />
  )
}
