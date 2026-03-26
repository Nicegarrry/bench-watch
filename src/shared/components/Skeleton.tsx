type SkeletonLineProps = {
  width?: string
  height?: string
  style?: React.CSSProperties
}

export function SkeletonLine({ width = '100%', height = '14px', style }: SkeletonLineProps) {
  return (
    <div
      className="bw-skeleton"
      style={{ width, height, borderRadius: '4px', flexShrink: 0, ...style }}
    />
  )
}

export function SkeletonCaseCard() {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-container-lowest)',
        borderLeft: '4px solid var(--surface-dim)',
        borderRadius: 'var(--rounded-lg)',
        padding: '28px 32px',
      }}
    >
      {/* Badge row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <SkeletonLine width="56px" height="22px" />
        <SkeletonLine width="110px" height="22px" />
        <SkeletonLine width="88px" height="22px" />
      </div>
      {/* Case name */}
      <SkeletonLine width="68%" height="24px" style={{ marginBottom: '8px' }} />
      {/* Citation + date */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <SkeletonLine width="140px" height="13px" />
        <SkeletonLine width="80px" height="13px" />
      </div>
      {/* Catchwords */}
      <SkeletonLine width="100%" height="13px" style={{ marginBottom: '5px' }} />
      <SkeletonLine width="82%" height="13px" style={{ marginBottom: '20px' }} />
      {/* Facts */}
      <SkeletonLine width="36px" height="10px" style={{ marginBottom: '8px' }} />
      <SkeletonLine width="100%" height="13px" style={{ marginBottom: '4px' }} />
      <SkeletonLine width="100%" height="13px" style={{ marginBottom: '4px' }} />
      <SkeletonLine width="72%" height="13px" style={{ marginBottom: '20px' }} />
      {/* Analysis */}
      <SkeletonLine width="52px" height="10px" style={{ marginBottom: '8px' }} />
      <SkeletonLine width="100%" height="13px" style={{ marginBottom: '4px' }} />
      <SkeletonLine width="100%" height="13px" style={{ marginBottom: '4px' }} />
      <SkeletonLine width="88%" height="13px" style={{ marginBottom: '20px' }} />
      {/* Why it matters */}
      <div
        style={{
          backgroundColor: 'var(--surface-container)',
          borderLeft: '3px solid var(--surface-dim)',
          padding: '16px 20px',
          borderRadius: '0 var(--rounded-md) var(--rounded-md) 0',
        }}
      >
        <SkeletonLine width="104px" height="10px" style={{ marginBottom: '10px' }} />
        <SkeletonLine width="100%" height="13px" style={{ marginBottom: '5px' }} />
        <SkeletonLine width="78%" height="13px" />
      </div>
    </div>
  )
}

export function SkeletonExtendedRows({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '14px 16px',
            backgroundColor: i % 2 === 1 ? 'var(--surface-container-low)' : 'transparent',
          }}
        >
          <div style={{ width: '40px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <SkeletonLine width="28px" height="18px" />
            <SkeletonLine width="32px" height="10px" />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonLine width="52%" height="15px" />
            <SkeletonLine width="78%" height="12px" />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
            <SkeletonLine width="68px" height="20px" />
            <SkeletonLine width="34px" height="13px" />
          </div>
        </div>
      ))}
    </>
  )
}

export function SkeletonIntelligencePage() {
  return (
    <div>
      {/* Top cards */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <SkeletonCaseCard />
          <SkeletonCaseCard />
        </div>
      </section>

      {/* Weekly analysis box */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
          borderRadius: 'var(--rounded-lg)',
          padding: '28px 32px',
          marginBottom: '48px',
          opacity: 0.4,
        }}
      >
        <SkeletonLine width="130px" height="11px" style={{ marginBottom: '18px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
        <SkeletonLine width="100%" height="14px" style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
        <SkeletonLine width="92%" height="14px" style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
        <SkeletonLine width="85%" height="14px" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
      </div>

      {/* Also notable */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <SkeletonLine width="130px" height="24px" />
          <div style={{ display: 'flex', gap: '4px' }}>
            <SkeletonLine width="100px" height="28px" />
            <SkeletonLine width="76px" height="28px" />
          </div>
        </div>
        <SkeletonExtendedRows count={7} />
      </section>

      <style>{`
        @keyframes bw-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .bw-skeleton {
          background: linear-gradient(
            90deg,
            var(--surface-container) 0%,
            var(--surface-container-high) 50%,
            var(--surface-container) 100%
          );
          background-size: 200% 100%;
          animation: bw-shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
