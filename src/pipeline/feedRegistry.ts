export type FeedConfig = {
  courtCode: string
  courtName: string
  feedUrl: string
  tier: 1 | 2 | 3
}

// Confirmed working as of 25 March 2026
export const JADE_FEEDS: FeedConfig[] = [
  { courtCode: 'HCA',    courtName: 'High Court of Australia',           feedUrl: 'https://jade.io/xml/au-hca.xml',     tier: 1 },
  { courtCode: 'HCASJ',  courtName: 'High Court (Single Justice)',       feedUrl: 'https://jade.io/xml/au-hca-sj.xml',  tier: 1 },
  { courtCode: 'FCAFC', courtName: 'Federal Court (Full Court)',         feedUrl: 'https://jade.io/xml/au-fca-fc.xml',  tier: 2 },
  { courtCode: 'FCA',   courtName: 'Federal Court of Australia',         feedUrl: 'https://jade.io/xml/au-fca.xml',     tier: 3 },
  { courtCode: 'NSWCA', courtName: 'NSW Court of Appeal',               feedUrl: 'https://jade.io/xml/au-nsw-ca.xml',  tier: 2 },
  { courtCode: 'NSWCCA',courtName: 'NSW Court of Criminal Appeal',      feedUrl: 'https://jade.io/xml/au-nsw-cca.xml', tier: 2 },
  { courtCode: 'VSCA',  courtName: 'Victorian Court of Appeal',         feedUrl: 'https://jade.io/xml/au-vic-sca.xml', tier: 2 },
  { courtCode: 'QCA',   courtName: 'Queensland Court of Appeal',        feedUrl: 'https://jade.io/xml/au-qld-ca.xml',  tier: 2 },
  { courtCode: 'WASCA', courtName: 'WA Supreme Court of Appeal',        feedUrl: 'https://jade.io/xml/au-wa-sca.xml',  tier: 2 },
  { courtCode: 'SASCFC',courtName: 'SA Supreme Court Full Court',       feedUrl: 'https://jade.io/xml/au-sa-sc.xml',   tier: 2 },
  { courtCode: 'TASFC', courtName: 'Tasmania Full Court',               feedUrl: 'https://jade.io/xml/au-tas-fc.xml',  tier: 2 },
  { courtCode: 'ACTCA', courtName: 'ACT Court of Appeal',               feedUrl: 'https://jade.io/xml/au-act-ca.xml',  tier: 2 },
  { courtCode: 'NTCA',  courtName: 'NT Court of Appeal',                feedUrl: 'https://jade.io/xml/au-nt-ca.xml',   tier: 2 },
]

// Required headers for all JADE RSS fetches
export const JADE_FETCH_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  'Referer': 'https://jade.io/',
}

// AustLII www6 mirror — confirmed working server-side (www → 410, classic/www5 → 403, www8 → timeout)
// Fallback order: www6 → www7 → www8
export const AUSTLII_MIRRORS = ['www6', 'www7', 'www8'] as const

// Maps RSS courtCode → AustLII jurisdiction/court path segment
export const AUSTLII_COURT_PATHS: Record<string, string> = {
  HCA:    'cth/HCA',
  HCASJ:  'cth/HCA',
  FCAFC:  'cth/FCAFC',
  FCA:    'cth/FCA',
  NSWCA:  'nsw/NSWCA',
  NSWCCA: 'nsw/NSWCCA',
  VSCA:   'vic/VSCA',
  QCA:    'qld/QCA',
  WASCA:  'wa/WASCA',
  SASCFC: 'sa/SASCFC',
  TASFC:  'tas/TASFC',
  ACTCA:  'act/ACTCA',
  NTCA:   'nt/NTCA',
}

/**
 * Build an AustLII viewdoc URL for a given citation, trying www6 mirror.
 * Citation format: "[Year] CourtCode Number" e.g. "[2025] HCA 12"
 */
export function buildAustliiUrl(citation: string, mirror = 'www6'): string | null {
  const match = citation.match(/\[(\d{4})\]\s+(\w+)\s+(\d+)/)
  if (!match) return null
  const [, year, court, num] = match
  const path = AUSTLII_COURT_PATHS[court.toUpperCase()]
  if (!path) return null
  return `https://${mirror}.austlii.edu.au/cgi-bin/viewdoc/au/cases/${path}/${year}/${num}.html`
}
