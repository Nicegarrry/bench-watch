import { LoginForm } from 'wasp/client/auth'
import { Link } from 'react-router'

export function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh', backgroundColor: 'var(--surface)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px 16px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>BenchWatch</p>
        <p className="label-sm" style={{ color: 'var(--secondary-container)', marginTop: '6px' }}>Legal Intelligence</p>
      </div>

      <div
        style={{
          width: '100%', maxWidth: '420px',
          backgroundColor: 'var(--surface-container-lowest)',
          borderLeft: '4px solid var(--secondary-container)',
          borderRadius: 'var(--rounded-lg)', padding: '40px',
        }}
      >
        <h1 className="headline-md" style={{ color: 'var(--on-surface)', margin: '0 0 8px' }}>Welcome Back</h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--on-surface-variant)', margin: '0 0 32px' }}>
          Sign in to your legal ledger.
        </p>

        <LoginForm />

        <div style={{ height: '1px', backgroundColor: 'var(--surface-container)', margin: '24px 0' }} />

        <p className="label-lg" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', marginBottom: '8px' }}>
          New to the chambers?{' '}
          <Link to="/signup" style={{ color: 'var(--secondary-container)', textDecoration: 'none', fontWeight: 600 }}>Sign Up</Link>
        </p>
        <p style={{ textAlign: 'center', margin: 0 }}>
          <Link to="/request-password-reset" className="label-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </p>
      </div>

      <p className="label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: '24px' }}>
        Protected by BenchWatch Secure Ledger protocols.
      </p>
      <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
        {['Privacy', 'Terms', 'Compliance'].map((l) => (
          <span key={l} className="label-sm" style={{ color: 'var(--surface-dim)' }}>{l.toUpperCase()}</span>
        ))}
      </div>
    </div>
  )
}
