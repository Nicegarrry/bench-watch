import { prisma } from 'wasp/server'
import { XMLParser } from 'fast-xml-parser'
import {
  LEGISLATION_FEEDS,
  LEGISLATION_FETCH_HEADERS,
  type LegFeedConfig,
} from './legislationFeedRegistry'
import { runLegislationAnalysis } from './legislationAnalysis'
import { runLegislationTextRetrieval } from './legislationTextRetrieval'

type RawLegChange = {
  externalId: string
  title: string
  jurisdiction: string
  changeType: string
  legislationUrl: string | null
  publishedAt: Date
  feedSummary: string | null
  source: string
}

// ── Dev/admin: run only Phase L1 discovery ─────────────────────────────────
export const runLegislationDiscoveryOnly = async (_args?: unknown, _context?: unknown): Promise<void> => {
  const since = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  const count = await runLegislationDiscovery(since)
  console.log(`[legislation:L1] Standalone run complete. ${count} new changes.`)
}

// ── Main job handler (called by Wasp PgBoss job) ───────────────────────────

export const runLegislationPipeline = async (_args: unknown, _context: unknown): Promise<void> => {
  const since = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days (daily run with buffer)
  console.log('[legislation] Starting pipeline run...')

  // Phase L1: Discover new legislation changes
  const newChanges = await runLegislationDiscovery(since)
  console.log(`[legislation] L1 complete. ${newChanges} new changes discovered.`)

  if (newChanges === 0) {
    console.log('[legislation] No new changes — skipping analysis phases.')
    return
  }

  // Phase L2b: Fetch full text for high-scoring candidates (score 7+)
  // This runs after L2a triage to know which items need full text
  await runLegislationAnalysis() // L2a: triage + summary in one Claude call
  console.log('[legislation] L2a complete.')

  await runLegislationTextRetrieval() // L2b: fetch full text for 7+
  console.log('[legislation] L2b complete.')

  await runLegislationAnalysis(true) // L2c: deep analysis for 7+ items that now have text
  console.log('[legislation] L2c complete.')

  console.log('[legislation] Pipeline run finished.')
}

// ── Phase L1: Discovery ────────────────────────────────────────────────────

async function runLegislationDiscovery(since: Date): Promise<number> {
  let totalNew = 0

  for (const feed of LEGISLATION_FEEDS) {
    if (!feed) continue
    try {
      const changes = await pollFeed(feed, since)
      let newCount = 0

      for (const change of changes) {
        const existing = await prisma.legislationChange.findUnique({
          where: { externalId: change.externalId },
        })
        if (existing) continue

        await prisma.legislationChange.create({ data: change })
        newCount++
        totalNew++
      }

      await prisma.legislationFeedRegistry.updateMany({
        where: { jurisdiction: feed.jurisdiction, feedUrl: feed.feedUrl },
        data: {
          lastPolledAt: new Date(),
          lastSuccessfulAt: new Date(),
          lastHttpStatus: 200,
          lastError: null,
          itemsLastPoll: newCount,
        },
      })

      console.log(`[legislation] ${feed.jurisdiction}: ${newCount} new items`)
    } catch (err) {
      console.error(`[legislation] Feed failed for ${feed.jurisdiction}:`, err)
      await prisma.legislationFeedRegistry.updateMany({
        where: { jurisdiction: feed.jurisdiction, feedUrl: feed.feedUrl },
        data: {
          lastPolledAt: new Date(),
          lastError: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }

  return totalNew
}

async function pollFeed(feed: LegFeedConfig, since: Date): Promise<RawLegChange[]> {
  if (feed.feedType === 'html-scrape') {
    return pollHtmlFeed(feed, since)
  }
  return pollAtomFeed(feed, since)
}

// ── Atom/RSS parser ────────────────────────────────────────────────────────

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

async function pollAtomFeed(feed: LegFeedConfig, since: Date): Promise<RawLegChange[]> {
  const res = await fetch(feed.feedUrl, { headers: LEGISLATION_FETCH_HEADERS })

  await prisma.legislationFeedRegistry.updateMany({
    where: { jurisdiction: feed.jurisdiction, feedUrl: feed.feedUrl },
    data: { lastPolledAt: new Date(), lastHttpStatus: res.status },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${feed.feedUrl}`)
  }

  const xml = await res.text()
  let parsed: unknown
  try {
    parsed = xmlParser.parse(xml)
  } catch {
    console.error(`[legislation] XML parse error for ${feed.jurisdiction}`)
    return []
  }

  const p = parsed as Record<string, unknown>

  // Handle both Atom (<feed>) and RSS 2.0 (<rss>)
  if (p['feed']) {
    return parseAtomFeed(p['feed'] as Record<string, unknown>, feed, since)
  }
  if (p['rss']) {
    return parseRssFeed(p['rss'] as Record<string, unknown>, feed, since)
  }

  return []
}

function parseAtomFeed(
  feed: Record<string, unknown>,
  config: LegFeedConfig,
  since: Date
): RawLegChange[] {
  const rawEntries = feed['entry']
  const entries: Record<string, unknown>[] = Array.isArray(rawEntries)
    ? rawEntries
    : rawEntries
    ? [rawEntries as Record<string, unknown>]
    : []

  return entries
    .map((entry) => {
      const title = extractText(entry['title'])
      const updated = extractText(entry['updated']) || extractText(entry['published'])
      const publishedAt = updated ? new Date(updated) : new Date()

      if (isNaN(publishedAt.getTime()) || publishedAt < since) return null

      // Atom link: <link href="..."> or string
      const linkEl = entry['link']
      let url: string | null = null
      if (typeof linkEl === 'string') {
        url = linkEl
      } else if (linkEl && typeof linkEl === 'object') {
        const l = linkEl as Record<string, unknown>
        url = String(l['@_href'] ?? l['href'] ?? '')
      }

      const summary = extractText(entry['summary']) || extractText(entry['content'])

      return {
        externalId: url || `${config.jurisdiction}:${title}:${updated}`,
        title: title || '(untitled)',
        jurisdiction: config.jurisdiction,
        changeType: inferChangeType(title || '', summary || ''),
        legislationUrl: url,
        publishedAt,
        feedSummary: summary ? stripHtml(summary).slice(0, 1000) : null,
        source: config.feedUrl,
      } satisfies RawLegChange
    })
    .filter((c): c is RawLegChange => c !== null)
}

function parseRssFeed(
  rss: Record<string, unknown>,
  config: LegFeedConfig,
  since: Date
): RawLegChange[] {
  const channel = rss['channel'] as Record<string, unknown> | undefined
  const rawItems = channel?.['item']
  const items: Record<string, unknown>[] = Array.isArray(rawItems)
    ? rawItems
    : rawItems
    ? [rawItems as Record<string, unknown>]
    : []

  return items
    .map((item) => {
      const title = String(item['title'] ?? '')
      const link = item['link'] ? String(item['link']) : null
      const pubDate = item['pubDate'] ? String(item['pubDate']) : null
      const publishedAt = pubDate ? new Date(pubDate) : new Date()

      if (isNaN(publishedAt.getTime()) || publishedAt < since) return null

      const description = item['description'] ? String(item['description']) : null

      return {
        externalId: link || `${config.jurisdiction}:${title}`,
        title,
        jurisdiction: config.jurisdiction,
        changeType: inferChangeType(title, description || ''),
        legislationUrl: link,
        publishedAt,
        feedSummary: description ? stripHtml(description).slice(0, 1000) : null,
        source: config.feedUrl,
      } satisfies RawLegChange
    })
    .filter((c): c is RawLegChange => c !== null)
}

// ── HTML scraper ───────────────────────────────────────────────────────────
// For jurisdictions without working RSS/Atom feeds.
// Fetches the "What's New" HTML page and extracts legislation links + titles.

async function pollHtmlFeed(feed: LegFeedConfig, since: Date): Promise<RawLegChange[]> {
  const res = await fetch(feed.feedUrl, { headers: LEGISLATION_FETCH_HEADERS })

  await prisma.legislationFeedRegistry.updateMany({
    where: { jurisdiction: feed.jurisdiction, feedUrl: feed.feedUrl },
    data: { lastPolledAt: new Date(), lastHttpStatus: res.status },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${feed.feedUrl}`)
  }

  const html = await res.text()
  return parseHtmlWhatsNew(html, feed, since)
}

function parseHtmlWhatsNew(
  html: string,
  config: LegFeedConfig,
  since: Date
): RawLegChange[] {
  const changes: RawLegChange[] = []

  // Extract <a href="...">...</a> links with dates nearby.
  // Pattern: look for links followed by or preceded by a date-like string.
  // This is a best-effort heuristic — the HTML structure varies by jurisdiction.
  const linkPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]{5,200})<\/a>/gi
  const datePattern = /\b(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{4}|\w+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})\b/

  let match: RegExpExecArray | null
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1]
    const title = match[2].trim()

    // Skip navigation links and very short titles
    if (title.length < 8) continue
    if (/\b(home|about|contact|help|search|back|next|previous|login|menu)\b/i.test(title)) continue

    // Look for a date in surrounding context (±300 chars)
    const contextStart = Math.max(0, match.index - 300)
    const contextEnd = Math.min(html.length, match.index + match[0].length + 300)
    const context = html.slice(contextStart, contextEnd)
    const dateMatch = datePattern.exec(context)

    let publishedAt = new Date()
    if (dateMatch) {
      const parsed = new Date(dateMatch[1])
      if (!isNaN(parsed.getTime())) publishedAt = parsed
    }

    if (publishedAt < since) continue

    // Build absolute URL if relative
    let url = href
    if (href.startsWith('/')) {
      const base = new URL(config.feedUrl)
      url = `${base.protocol}//${base.host}${href}`
    }

    // Only include URLs that look like legislation (not nav/admin pages)
    if (!url.includes('legis') && !url.includes('act') && !url.includes('reg') &&
        !url.includes('ord') && !url.includes('bill') && !url.includes('sl-') &&
        !url.includes('nsw') && !url.includes('/view/')) continue

    changes.push({
      externalId: url,
      title,
      jurisdiction: config.jurisdiction,
      changeType: inferChangeType(title, ''),
      legislationUrl: url,
      publishedAt,
      feedSummary: null,
      source: config.feedUrl,
    })
  }

  // Deduplicate by externalId
  const seen = new Set<string>()
  return changes.filter((c) => {
    if (seen.has(c.externalId)) return false
    seen.add(c.externalId)
    return true
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractText(val: unknown): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    const v = val as Record<string, unknown>
    return String(v['#text'] ?? v['_'] ?? '')
  }
  return ''
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function inferChangeType(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase()
  if (/\bbill\b/.test(text)) return 'bill_introduced'
  if (/\bnew act\b|\bnew legislation\b|\breceived assent\b|\broyal assent\b/.test(text)) return 'act_new'
  if (/\bcommenc/.test(text)) return 'act_commenced'
  if (/\bregulation\b|\bregulations\b|\bsubordinate\b|\bstatutory rule\b/.test(text)) return 'regulation_made'
  if (/\bamend/.test(text)) return 'act_amended'
  return 'unknown'
}
