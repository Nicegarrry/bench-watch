import { describe, it, expect } from 'vitest'
import { buildAustliiUrl, AUSTLII_COURT_PATHS, JADE_FEEDS } from '../feedRegistry'

describe('buildAustliiUrl', () => {
  it('builds correct URL for HCA citation', () => {
    expect(buildAustliiUrl('[2025] HCA 12')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2025/12.html'
    )
  })

  it('builds correct URL for FCAFC citation', () => {
    expect(buildAustliiUrl('[2026] FCAFC 45')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/FCAFC/2026/45.html'
    )
  })

  it('builds correct URL for NSWCA citation', () => {
    expect(buildAustliiUrl('[2026] NSWCA 100')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/nsw/NSWCA/2026/100.html'
    )
  })

  it('builds correct URL for VSCA citation', () => {
    expect(buildAustliiUrl('[2025] VSCA 7')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/vic/VSCA/2025/7.html'
    )
  })

  it('builds correct URL for QCA citation', () => {
    expect(buildAustliiUrl('[2026] QCA 33')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/qld/QCA/2026/33.html'
    )
  })

  it('builds correct URL for WASCA citation', () => {
    expect(buildAustliiUrl('[2026] WASCA 5')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/wa/WASCA/2026/5.html'
    )
  })

  it('builds correct URL for SASCFC citation', () => {
    expect(buildAustliiUrl('[2026] SASCFC 8')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/sa/SASCFC/2026/8.html'
    )
  })

  it('builds correct URL for TASFC citation', () => {
    expect(buildAustliiUrl('[2026] TASFC 2')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/tas/TASFC/2026/2.html'
    )
  })

  it('builds correct URL for ACTCA citation', () => {
    expect(buildAustliiUrl('[2026] ACTCA 11')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/act/ACTCA/2026/11.html'
    )
  })

  it('builds correct URL for NTCA citation', () => {
    expect(buildAustliiUrl('[2026] NTCA 3')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/nt/NTCA/2026/3.html'
    )
  })

  it('builds correct URL for FCA citation', () => {
    expect(buildAustliiUrl('[2026] FCA 200')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/FCA/2026/200.html'
    )
  })

  it('builds correct URL for NSWCCA citation', () => {
    expect(buildAustliiUrl('[2026] NSWCCA 50')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/nsw/NSWCCA/2026/50.html'
    )
  })

  it('builds correct URL for HCATrans citation (HCASJ bug fix)', () => {
    expect(buildAustliiUrl('[2026] HCATrans 42')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2026/42.html'
    )
  })

  it('uses specified mirror', () => {
    expect(buildAustliiUrl('[2025] HCA 12', 'www7')).toBe(
      'https://www7.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2025/12.html'
    )
  })

  it('returns null for unknown court code', () => {
    expect(buildAustliiUrl('[2025] ZZZZZ 1')).toBeNull()
  })

  it('returns null for malformed citation — no brackets', () => {
    expect(buildAustliiUrl('2025 HCA 12')).toBeNull()
  })

  it('returns null for malformed citation — missing number', () => {
    expect(buildAustliiUrl('[2025] HCA')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(buildAustliiUrl('')).toBeNull()
  })

  it('handles citation with extra whitespace', () => {
    expect(buildAustliiUrl('[2025]  HCA  12')).toBe(
      'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2025/12.html'
    )
  })
})

describe('AUSTLII_COURT_PATHS', () => {
  it('has entries for all JADE feed court codes', () => {
    for (const feed of JADE_FEEDS) {
      expect(AUSTLII_COURT_PATHS).toHaveProperty(feed.courtCode)
    }
  })
})
