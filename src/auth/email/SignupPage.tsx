import { SignupForm } from 'wasp/client/auth'
import { Link } from 'react-router'

export function SignupPage() {
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
        <h1 className="headline-md" style={{ color: 'var(--on-surface)', margin: '0 0 8px' }}>Create Account</h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--on-surface-variant)', margin: '0 0 32px' }}>
          Join the chambers.
        </p>

        <SignupForm
          additionalFields={[
            {
              name: 'username',
              type: 'input',
              label: 'Username',
              validations: {
                required: 'Username is required',
                minLength: { value: 6, message: 'Username must be at least 6 characters' },
              },
            },
          ]}
        />

        <div style={{ height: '1px', backgroundColor: 'var(--surface-container)', margin: '24px 0' }} />

        <p className="label-lg" style={{ color: 'var(--on-surface-variant)', textAlign: 'center' }}>
          Already a member?{' '}
          <Link to="/login" style={{ color: 'var(--secondary-container)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
