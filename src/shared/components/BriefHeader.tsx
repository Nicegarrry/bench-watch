type BriefHeaderProps = {
  label: string
  title: string
  subtitle?: string
}

export function BriefHeader({ label, title, subtitle }: BriefHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: '16px' }}>
      {/* 2px gold left accent bar */}
      <div style={{ width: '2px', backgroundColor: 'var(--secondary-container)', borderRadius: '1px', flexShrink: 0 }} />
      <div>
        <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '4px' }}>
          {label}
        </p>
        <h1 className="headline-md" style={{ color: 'var(--on-surface)', margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '6px' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
