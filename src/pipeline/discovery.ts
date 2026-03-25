import { prisma } from 'wasp/server'
import { XMLParser } from 'fast-xml-parser'
import { JADE_FEEDS, JADE_FETCH_HEADERS, buildAustliiUrl, type FeedConfig } from './feedRegistry'

type RawCase = {
  citation: string
  caseName: string
  court: string
  courtCode: string
  decisionDate: Date | null
  jadeUrl: string | null
  catchwords: string | null
  austliiUrl: string | null
}

// WASP job handler — called by PgBoss on schedule
export const runDiscovery = async (_args: unknown, _context: unknown): Promise<void> => {
  const now = new Date()
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const run = await prisma.discoveryRun.create({
    data: {
      periodType: 'weekly',
      periodStart,
      periodEnd: now,
      status: 'running',
      courtsPolled: [],
      casesDiscovered: 0,
    },
  })

  const courtsPolled: string[] = []
  let totalCases = 0

  try {
    for (const feed of JADE_FEEDS) {
      if (!feed) continue
      try {
        const cases = await pollFeed(feed, periodStart)
        courtsPolled.push(feed.courtCode)

        for (const c of cases) {
          await prisma.case.upsert({
            where: { citation: c.citation },
            update: {
              // Refresh mutable fields in case JADE updated them
              catchwords: c.catchwords,
              jadeUrl: c.jadeUrl,
              austliiUrl: c.austliiUrl,
              updatedAt: new Date(),
            },
            create: {
              citation: c.citation,
              caseName: c.caseName,
              court: c.court,
              courtCode: c.courtCode,
              decisionDate: c.decisionDate,
              jadeUrl: c.jadeUrl,
              austliiUrl: c.austliiUrl,
              catchwords: c.catchwords,
              excerptFetched: false,
            },
          })
          totalCases++
        }
      } catch (err) {
        console.error(`[discovery] Feed failed for ${feed.courtCode}:`, err)
        await prisma.rssFeedRegistry.updateMany({
          where: { courtCode: feed.courtCode },
          data: {
            lastPolledAt: new Date(),
            lastError: err instanceof Error ? err.message : String(err),
          },
        })
      }
    }

    await prisma.discoveryRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        courtsPolled,
        casesDiscovered: totalCases,
        completedAt: new Date(),
      },
    })

    console.log(`[discovery] Completed. ${totalCases} cases from ${courtsPolled.length} courts.`)
  } catch (err) {
    await prisma.discoveryRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      },
    })
    throw err
  }
}

async function pollFeed(feed: FeedConfig, since: Date): Promise<RawCase[]> {
  const res = await fetch(feed.feedUrl, { headers: JADE_FETCH_HEADERS })

  await prisma.rssFeedRegistry.updateMany({
    where: { courtCode: feed.courtCode },
    data: {
      lastPolledAt: new Date(),
      lastHttpStatus: res.status,
      lastSuccessfulAt: res.ok ? new Date() : undefined,
      lastError: res.ok ? null : `HTTP ${res.status}`,
    },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${feed.feedUrl}`)
  }

  const xml = await res.text()
  const cases = parseRss(xml, feed.courtCode, feed.courtName)
  const filtered = cases.filter((c) => !c.decisionDate || c.decisionDate >= since)

  await prisma.rssFeedRegistry.updateMany({
    where: { courtCode: feed.courtCode },
    data: { itemsLastPoll: filtered.length },
  })

  return filtered
}

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

function parseRss(xml: string, courtCode: string, courtName: string): RawCase[] {
  let parsed: unknown
  try {
    parsed = xmlParser.parse(xml)
  } catch {
    console.error(`[discovery] XML parse error for ${courtCode}`)
    return []
  }

  // RSS 2.0: rss.channel.item (may be a single object or array)
  const channel = (parsed as Record<string, unknown>)?.['rss'] as Record<string, unknown> | undefined
  const rawItems = channel?.['channel'] as Record<string, unknown> | undefined
  const itemsRaw = rawItems?.['item']
  const items: Record<string, unknown>[] = Array.isArray(itemsRaw)
    ? itemsRaw
    : itemsRaw
      ? [itemsRaw as Record<string, unknown>]
      : []

  return items
    .map((item) => {
      const title = String(item['title'] ?? '')
      const link = item['link'] ? String(item['link']) : null
      const pubDate = item['pubDate'] ? String(item['pubDate']) : null
      const description = item['description'] ? String(item['description']) : null

      const citation = extractCitation(title)
      if (!citation) return null

      const austliiUrl = buildAustliiUrl(citation)

      return {
        citation,
        caseName: extractCaseName(title, citation),
        court: courtName,
        courtCode,
        decisionDate: pubDate ? parseDate(pubDate) : null,
        jadeUrl: link,
        catchwords: description ? stripHtml(description).slice(0, 500) : null,
        austliiUrl,
      } satisfies RawCase
    })
    .filter((c): c is RawCase => c !== null)
}

// Extract citation like "[2025] HCA 12" from a title string
function extractCitation(title: string): string | null {
  const match = title.match(/\[\d{4}\]\s+\w+\s+\d+/)
  return match ? match[0] : null
}

// Extract case name: everything before the citation
function extractCaseName(title: string, citation: string): string {
  const idx = title.indexOf(citation)
  return idx > 0 ? title.slice(0, idx).trim().replace(/\s*[–—-]\s*$/, '') : title
}

function parseDate(dateStr: string): Date | null {
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
