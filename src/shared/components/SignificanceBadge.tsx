type BadgeConfig = { label: string; bg: string; color: string }

function getBadge(score: number): BadgeConfig {
  if (score >= 9) return { label: 'PRECEDENT SHIFT', bg: '#B83230', color: '#ffffff' }
  if (score >= 7) return { label: 'SIGNIFICANT',     bg: '#D4873A', color: '#ffffff' }
  if (score >= 5) return { label: 'NOTABLE',         bg: '#C49A2B', color: '#ffffff' }
  return { label: 'ROUTINE', bg: 'var(--surface-dim)', color: 'var(--on-surface-variant)' }
}

export function SignificanceBadge({ score }: { score: number }) {
  const { label, bg, color } = getBadge(score)
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.08rem',
        textTransform: 'uppercase',
        backgroundColor: bg,
        color,
        padding: '2px 8px',
        borderRadius: 'var(--rounded-md)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export function getSignificanceColor(score: number): string {
  if (score >= 9) return '#B83230'
  if (score >= 7) return '#D4873A'
  if (score >= 5) return '#C49A2B'
  return 'var(--surface-dim)'
}
