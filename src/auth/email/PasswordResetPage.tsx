import { Link } from 'react-router'
import { ResetPasswordForm } from 'wasp/client/auth'

export function PasswordResetPage() {
  return (
    <AuthShell
      title="Reset Password"
      subtitle="Choose a new password for your account."
    >
      <ResetPasswordForm />
      <p className="label-lg" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: '20px' }}>
        <Link to="/login" style={{ color: 'var(--secondary-container)', textDecoration: 'none', fontWeight: 600 }}>
          Back to login
        </Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh', backgroundColor: 'var(--surface)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px 16px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
          BenchWatch
        </p>
        <p className="label-sm" style={{ color: 'var(--secondary-container)', marginTop: '6px' }}>
          Legal Intelligence
        </p>
      </div>

      <div
        style={{
          width: '100%', maxWidth: '420px',
          backgroundColor: 'var(--surface-container-lowest)',
          borderLeft: '4px solid var(--secondary-container)',
          borderRadius: 'var(--rounded-lg)', padding: '40px',
        }}
      >
        <h1 className="headline-md" style={{ color: 'var(--on-surface)', margin: '0 0 8px' }}>{title}</h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--on-surface-variant)', margin: '0 0 32px' }}>
          {subtitle}
        </p>
        {children}
      </div>

      <div style={{ display: 'flex', gap: '24px', marginTop: '32px' }}>
        {['Privacy', 'Terms', 'Compliance'].map((l) => (
          <span key={l} className="label-sm" style={{ color: 'var(--surface-dim)' }}>{l.toUpperCase()}</span>
        ))}
      </div>
    </div>
  )
}
