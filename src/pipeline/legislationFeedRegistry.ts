// Legislation feed registry — one feed per jurisdiction, no duplicates.
//
// Probe results (2026-03-27):
//   WA:  legislation.wa.gov.au aspassed.atom  → HTTP 200 ✓ (Atom 1.0)
//   QLD: legislation.qld.gov.au feed?id=...   → HTTP 200 ✓ (Atom 1.0)
//   NSW: legislation.nsw.gov.au               → HTTP 403 (bot-blocked server-side)
//   VIC: legislation.vic.gov.au               → no RSS/Atom infrastructure found
//   SA/TAS/ACT/NT/Federal: no public feeds found — scrape HTML "What's New" pages
//
// For jurisdictions without feeds, we scrape the "recently updated" HTML page
// and parse out legislation items. These are marked feedType="html-scrape".

export type LegFeedConfig = {
  jurisdiction: string
  jurisdictionName: string
  feedUrl: string
  feedType: 'atom' | 'rss' | 'html-scrape'
  tier: 1 | 2
}

// Confirmed working as of 27 March 2026
export const LEGISLATION_FEEDS: LegFeedConfig[] = [
  // ── Tier 1: Direct Atom/RSS from jurisdiction site ─────────────────────────

  // WA: "as passed" covers brand-new Acts and subsidiary legislation
  {
    jurisdiction: 'wa',
    jurisdictionName: 'Western Australia',
    feedUrl: 'https://www.legislation.wa.gov.au/legislation/statutes.nsf/aspassed.atom',
    feedType: 'atom',
    tier: 1,
  },

  // QLD: "What's New" covers all new/amended legislation
  {
    jurisdiction: 'qld',
    jurisdictionName: 'Queensland',
    feedUrl: 'https://www.legislation.qld.gov.au/feed?id=whatsnew',
    feedType: 'atom',
    tier: 1,
  },

  // ── Tier 2: HTML scraping (no public feed available) ──────────────────────

  // Federal: legislation.gov.au "recently published" page (last 7 days)
  {
    jurisdiction: 'cth',
    jurisdictionName: 'Commonwealth (Federal)',
    feedUrl: 'https://www.legislation.gov.au/Latest/Acts',
    feedType: 'html-scrape',
    tier: 2,
  },

  // NSW: blocked from feeds — scrape What's New page
  {
    jurisdiction: 'nsw',
    jurisdictionName: 'New South Wales',
    feedUrl: 'https://legislation.nsw.gov.au/whats-new',
    feedType: 'html-scrape',
    tier: 2,
  },

  // VIC: no feeds — scrape What's New
  {
    jurisdiction: 'vic',
    jurisdictionName: 'Victoria',
    feedUrl: 'https://www.legislation.vic.gov.au/whats-new',
    feedType: 'html-scrape',
    tier: 2,
  },

  // SA: no feeds
  {
    jurisdiction: 'sa',
    jurisdictionName: 'South Australia',
    feedUrl: 'https://www.legislation.sa.gov.au/whats-new',
    feedType: 'html-scrape',
    tier: 2,
  },

  // TAS: no feeds
  {
    jurisdiction: 'tas',
    jurisdictionName: 'Tasmania',
    feedUrl: 'https://www.legislation.tas.gov.au/view/html/inforce/current/act',
    feedType: 'html-scrape',
    tier: 2,
  },

  // ACT
  {
    jurisdiction: 'act',
    jurisdictionName: 'Australian Capital Territory',
    feedUrl: 'https://legislation.act.gov.au/WhatsNew/Index',
    feedType: 'html-scrape',
    tier: 2,
  },

  // NT
  {
    jurisdiction: 'nt',
    jurisdictionName: 'Northern Territory',
    feedUrl: 'https://legislation.nt.gov.au/en/WhatsNew',
    feedType: 'html-scrape',
    tier: 2,
  },
]

// Headers to use for all legislation fetches (same pattern as JADE court feeds)
export const LEGISLATION_FETCH_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*',
}
