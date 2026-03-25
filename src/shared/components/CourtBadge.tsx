const COURT_LABELS: Record<string, string> = {
  HCA:    'HCA',
  HCASJ:  'HCA SJ',
  FCAFC:  'FCAFC',
  FCA:    'FCA',
  NSWCA:  'NSWCA',
  NSWCCA: 'NSWCCA',
  VSCA:   'VSCA',
  QCA:    'QCA',
  WASCA:  'WASCA',
  SASCFC: 'SASCFC',
  TASFC:  'TASFC',
  ACTCA:  'ACTCA',
  NTCA:   'NTCA',
}

export function CourtBadge({ courtCode }: { courtCode: string }) {
  const label = COURT_LABELS[courtCode] ?? courtCode
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 500,
        backgroundColor: 'var(--primary-container)',
        color: '#ffffff',
        padding: '2px 8px',
        borderRadius: 'var(--rounded-md)',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
