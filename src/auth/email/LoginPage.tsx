import { LoginForm } from 'wasp/client/auth'
import { Link } from 'react-router'
import { useEffect, useRef, useState } from 'react'

export function LoginPage() {
  const formRef = useRef<HTMLDivElement>(null)
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('bw_remembered_email'))

  // Pre-fill email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('bw_remembered_email')
    if (!savedEmail || !formRef.current) return
    const timer = setTimeout(() => {
      const emailInput = formRef.current?.querySelector('input[type="email"], input[name="email"]') as HTMLInputElement | null
      if (emailInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeSetter?.call(emailInput, savedEmail)
        emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  const handleFormCapture = () => {
    if (!formRef.current) return
    const emailInput = formRef.current.querySelector('input[type="email"], input[name="email"]') as HTMLInputElement | null
    if (!emailInput) return
    if (rememberMe) {
      localStorage.setItem('bw_remembered_email', emailInput.value)
    } else {
      localStorage.removeItem('bw_remembered_email')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navy top bar */}
      <div style={{ height: '4px', backgroundColor: 'var(--color-navy, #1A1F36)', flexShrink: 0 }} />

      {/* Main centered content */}
      <div
        style={{
          flex: 1, backgroundColor: 'var(--surface)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '32px 16px',
        }}
      >
        {/* Logo header with navy accent */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            backgroundColor: 'var(--color-navy, #1A1F36)',
            padding: '10px 20px', borderRadius: '8px', marginBottom: '12px',
          }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 700,
              color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px',
            }}>BenchWatch</p>
          </div>
          <p className="label-sm" style={{ color: 'var(--secondary-container)', marginTop: '4px', letterSpacing: '0.1em' }}>
            LEGAL INTELLIGENCE
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
          <h1 className="headline-md" style={{ color: 'var(--on-surface)', margin: '0 0 8px' }}>Welcome Back</h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--on-surface-variant)', margin: '0 0 32px' }}>
            Sign in to your legal ledger.
          </p>

          {/* Wasp LoginForm wrapper — captures submit to persist email */}
          <div ref={formRef} onClickCapture={handleFormCapture}>
            <LoginForm />
          </div>

          {/* Remember me */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', marginTop: '12px',
          }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => {
                setRememberMe(e.target.checked)
                if (!e.target.checked) localStorage.removeItem('bw_remembered_email')
              }}
              style={{ accentColor: 'var(--color-navy, #1A1F36)', width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Remember my email</span>
          </label>

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

        <p className="label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: '24px', textAlign: 'center' }}>
          Powered by AI — this tool may make mistakes.
        </p>
        <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
          {['Privacy', 'Terms', 'Compliance'].map((l) => (
            <span key={l} className="label-sm" style={{ color: 'var(--surface-dim)' }}>{l.toUpperCase()}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
