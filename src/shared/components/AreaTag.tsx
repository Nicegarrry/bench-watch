const AREA_LABELS: Record<string, string> = {
  administrative: 'Administrative',
  constitutional: 'Constitutional',
  contract:       'Contract',
  employment:     'Employment',
  criminal:       'Criminal',
  corporations:   'Corporations',
  property:       'Property',
  planning:       'Planning',
  tax:            'Tax',
  tort:           'Torts',
  ip:             'IP',
  competition:    'Competition',
  migration:      'Migration',
  privacy:        'Privacy',
  family:         'Family',
}

export function AreaTag({ slug }: { slug: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.06rem',
        textTransform: 'uppercase',
        border: '1px solid var(--surface-dim)',
        color: 'var(--on-surface-variant)',
        padding: '2px 8px',
        borderRadius: 'var(--rounded-md)',
        whiteSpace: 'nowrap',
      }}
    >
      {AREA_LABELS[slug] ?? slug}
    </span>
  )
}

export { AREA_LABELS }
