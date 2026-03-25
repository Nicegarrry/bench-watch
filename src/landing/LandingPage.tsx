import { Link } from 'react-router'
import { useAuth } from 'wasp/client/auth'
import { Scale, Rss, Brain, Mail, ChevronRight } from 'lucide-react'

const COURTS = ['HCA', 'FCAFC', 'FCA', 'NSWCA', 'NSWCCA', 'VSCA', 'QCA', 'WASCA', 'SASCFC', 'TASFC', 'ACTCA', 'NTCA', 'HCA SJ']
const AREAS = ['Administrative', 'Constitutional', 'Contract', 'Employment', 'Criminal', 'Corporations', 'Property', 'Planning', 'Tax', 'Torts', 'IP', 'Competition', 'Migration', 'Privacy', 'Family']

export function LandingPage() {
  const { data: user } = useAuth()

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--on-surface)' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: 'rgba(251,249,246,0.92)', backdropFilter: 'blur(8px)', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>BenchWatch</p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {user ? (
            <NavLink href="/intelligence">Dashboard →</NavLink>
          ) : (
            <>
              <NavLink href="/login">Sign In</NavLink>
              <Link to="/signup" style={{ padding: '8px 20px', backgroundColor: 'var(--primary-container)', color: '#fff', borderRadius: 'var(--rounded-md)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, var(--primary) 0%, var(--primary-container) 60%, #2d3561 100%)', paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', padding: '140px 40px 100px' }}>
        <p className="label-md" style={{ color: 'var(--secondary)', marginBottom: '20px' }}>
          AUSTRALIAN APPELLATE COURTS · 13 FEEDS · WEEKLY
        </p>
        <h1 className="display-lg" style={{ color: '#ffffff', margin: '0 auto 24px', maxWidth: '760px' }}>
          Australian Case Law Intelligence, Weekly
        </h1>
        <p className="body-lg" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '560px', margin: '0 auto 40px' }}>
          BenchWatch monitors every major appellate court, identifies significant decisions with AI, and delivers a personalised digest to your inbox every week.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{ padding: '14px 32px', backgroundColor: 'var(--secondary-container)', color: '#fff', borderRadius: 'var(--rounded-md)', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
            Get Started Free
          </Link>
          <Link to={user ? '/intelligence' : '/login'} style={{ padding: '14px 32px', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 'var(--rounded-md)', fontWeight: 600, fontSize: '15px', textDecoration: 'none' }}>
            Try the Dashboard
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '100px 40px' }}>
        <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '12px', textAlign: 'center' }}>HOW IT WORKS</p>
        <h2 className="headline-md" style={{ textAlign: 'center', margin: '0 0 60px' }}>Three steps, every week</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          {[
            { icon: <Rss size={24} />, step: '01', title: 'Court Monitoring', body: 'We poll 13 JADE RSS feeds every Sunday morning, capturing every appellate decision from the past 7 days.' },
            { icon: <Brain size={24} />, step: '02', title: 'AI Significance Triage', body: 'Claude Sonnet scores each case for legal significance, tags it by practice area, and writes a full analysis for the cases that matter.' },
            { icon: <Mail size={24} />, step: '03', title: 'Personalised Digest', body: 'We rank and select the cases most relevant to your practice areas and deliver your Priority Insights each week.' },
          ].map((item) => (
            <div key={item.step} style={{ padding: '32px', backgroundColor: 'var(--surface-container-lowest)', borderRadius: 'var(--rounded-lg)' }}>
              <div style={{ color: 'var(--secondary-container)', marginBottom: '16px' }}>{item.icon}</div>
              <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '8px' }}>STEP {item.step}</p>
              <h3 className="title-md" style={{ margin: '0 0 12px' }}>{item.title}</h3>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courts we cover */}
      <section style={{ backgroundColor: 'var(--surface-container-low)', padding: '80px 40px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '12px', textAlign: 'center' }}>COVERAGE</p>
          <h2 className="headline-md" style={{ textAlign: 'center', margin: '0 0 40px' }}>13 courts monitored</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {COURTS.map((c) => (
              <span
                key={c}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500,
                  backgroundColor: 'var(--primary-container)', color: '#fff',
                  padding: '6px 14px', borderRadius: 'var(--rounded-md)',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sample case card */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '100px 40px' }}>
        <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '12px', textAlign: 'center' }}>SAMPLE OUTPUT</p>
        <h2 className="headline-md" style={{ textAlign: 'center', margin: '0 0 48px' }}>What a Priority Brief looks like</h2>
        <div
          style={{
            backgroundColor: 'var(--surface-container-lowest)',
            borderLeft: '4px solid #D4873A',
            borderRadius: 'var(--rounded-lg)',
            padding: '32px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, backgroundColor: 'var(--primary-container)', color: '#fff', padding: '2px 8px', borderRadius: 'var(--rounded-md)' }}>FCAFC</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500, backgroundColor: '#D4873A', color: '#fff', padding: '2px 8px', borderRadius: 'var(--rounded-md)', letterSpacing: '0.08rem', textTransform: 'uppercase' }}>SIGNIFICANT</span>
            <span style={{ border: '1px solid var(--surface-dim)', color: 'var(--on-surface-variant)', fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--rounded-md)', letterSpacing: '0.06rem', textTransform: 'uppercase' }}>Contract</span>
          </div>
          <h3 className="title-lg" style={{ margin: '0 0 6px' }}>Acme Industries Pty Ltd v Commissioner of Taxation</h3>
          <p className="mono" style={{ color: 'var(--on-surface-variant)', marginBottom: '20px' }}>[2025] FCAFC 88 · 14 Mar 2025</p>
          <div style={{ marginBottom: '16px' }}>
            <p className="label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px' }}>FACTS</p>
            <p className="body-md" style={{ color: 'var(--on-surface)', margin: 0 }}>The Full Federal Court considered whether the Commissioner's amended assessment was valid where the taxpayer had restructured its affairs in reliance on a private binding ruling...</p>
          </div>
          <div style={{ backgroundColor: 'var(--surface-container)', borderLeft: '3px solid var(--secondary-container)', padding: '16px 20px', borderRadius: '0 var(--rounded-md) var(--rounded-md) 0' }}>
            <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '6px' }}>WHY IT MATTERS</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontStyle: 'italic', color: 'var(--on-surface)', margin: 0 }}>
              Practitioners advising on private binding rulings must now account for the Full Court's narrower reading of estoppel against the Commissioner.
            </p>
          </div>
        </div>
      </section>

      {/* Areas of law */}
      <section style={{ backgroundColor: 'var(--surface-container-low)', padding: '80px 40px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '12px', textAlign: 'center' }}>PRACTICE AREAS</p>
          <h2 className="headline-md" style={{ textAlign: 'center', margin: '0 0 40px' }}>15 areas covered</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {AREAS.map((a) => (
              <span
                key={a}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
                  border: '1.5px solid var(--surface-dim)', color: 'var(--on-surface-variant)',
                  padding: '8px 16px', borderRadius: 'var(--rounded-md)',
                  backgroundColor: 'var(--surface-container-lowest)',
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '100px 40px' }}>
        <p className="label-sm" style={{ color: 'var(--secondary-container)', marginBottom: '12px', textAlign: 'center' }}>PRICING</p>
        <h2 className="headline-md" style={{ textAlign: 'center', margin: '0 0 48px' }}>Simple, transparent plans</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <PricingCard tier="Free" price="$0" features={['3 runs/week', '1 practice area', 'Priority Insights dashboard', 'Weekly digest']} cta="Get Started" href="/signup" />
          <PricingCard tier="Pro" price="$29/mo" features={['10 runs/week', 'All 15 practice areas', 'Full digest archive', 'Priority support']} cta="Start Free Trial" href="/signup" featured />
          <PricingCard tier="Team" price="$99/mo" features={['Unlimited runs', 'All 15 practice areas', 'Multiple users', 'Custom reports']} cta="Contact Sales" href="/signup" />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--primary-container)', padding: '48px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>BenchWatch</p>
        <p className="label-sm" style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>Legal Intelligence</p>
        <p className="label-sm" style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Case law sourced from AustLII (austlii.edu.au) under their terms of use. BenchWatch is not a legal advice service.
        </p>
      </footer>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link to={href} style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, color: 'var(--on-surface-variant)', textDecoration: 'none' }}>
      {children}
    </Link>
  )
}

function PricingCard({ tier, price, features, cta, href, featured }: { tier: string; price: string; features: string[]; cta: string; href: string; featured?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: featured ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
        borderRadius: 'var(--rounded-lg)', padding: '32px',
        ...(featured ? { boxShadow: '0 4px 40px -10px rgba(27,28,26,0.12)' } : {}),
      }}
    >
      {featured && <p className="label-sm" style={{ color: 'var(--secondary)', marginBottom: '8px' }}>MOST POPULAR</p>}
      <p className="label-lg" style={{ color: featured ? 'rgba(255,255,255,0.7)' : 'var(--on-surface-variant)', margin: '0 0 8px' }}>{tier}</p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '32px', fontWeight: 700, color: featured ? '#fff' : 'var(--on-surface)', margin: '0 0 24px' }}>{price}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
        {features.map((f) => (
          <li key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: featured ? 'var(--secondary)' : 'var(--secondary-container)', fontWeight: 700 }}>✓</span>
            <span className="body-md" style={{ color: featured ? 'rgba(255,255,255,0.8)' : 'var(--on-surface-variant)' }}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to={href}
        style={{
          display: 'block', padding: '12px', textAlign: 'center',
          borderRadius: 'var(--rounded-md)',
          backgroundColor: featured ? 'var(--secondary-container)' : 'transparent',
          border: featured ? 'none' : '1.5px solid var(--surface-dim)',
          color: featured ? '#fff' : 'var(--on-surface-variant)',
          fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        {cta}
      </Link>
    </div>
  )
}
