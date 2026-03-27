import { prisma } from 'wasp/server'

const MAX_BYTES = 100_000
const RATE_LIMIT_MS = 3_000

/**
 * Phase L2b: Fetch full text for legislation changes scored 7+.
 * NSW/QLD use XML export endpoints; others use direct HTML.
 * Rate-limited at 3 seconds between requests.
 */
export async function runLegislationTextRetrieval(): Promise<void> {
  const candidates = await prisma.legislationChange.findMany({
    where: {
      textFetched: false,
      legislationUrl: { not: null },
      analysis: { significanceScore: { gte: 7 } },
    },
    include: { analysis: true },
    orderBy: [{ analysis: { significanceScore: 'desc' } }, { publishedAt: 'desc' }],
    take: 20,
  })

  if (candidates.length === 0) {
    console.log('[legislation:L2b] No high-significance items need text retrieval.')
    return
  }

  console.log(`[legislation:L2b] Fetching full text for ${candidates.length} items...`)
  let fetched = 0
  let errors = 0

  for (const change of candidates) {
    try {
      const text = await fetchLegislationText(change.jurisdiction, change.legislationUrl!)
      await prisma.legislationChange.update({
        where: { id: change.id },
        data: { fullText: text, textFetched: true },
      })
      fetched++
    } catch (err) {
      console.error(`[legislation:L2b] Failed for ${change.id} (${change.title}):`, err)
      await prisma.legislationChange.update({
        where: { id: change.id },
        data: { textFetched: true },
      })
      errors++
    }

    if (fetched + errors < candidates.length) {
      await sleep(RATE_LIMIT_MS)
    }
  }

  console.log(`[legislation:L2b] Done. ${fetched} fetched, ${errors} errors.`)
}

async function fetchLegislationText(jurisdiction: string, url: string): Promise<string> {
  if (jurisdiction === 'nsw') return fetchNswXml(url)
  if (jurisdiction === 'qld') return fetchQldXml(url)
  return fetchAndExtractText(url)
}

async function fetchNswXml(pageUrl: string): Promise<string> {
  const match = pageUrl.match(/\/view\/html\/[^/]+\/[^/]+\/([^?#]+)/)
  if (match) {
    const xmlUrl = `https://legislation.nsw.gov.au/export/xml/current/${match[1]}`
    try { return await fetchAndExtractText(xmlUrl) } catch { /* fall through */ }
  }
  return fetchAndExtractText(pageUrl)
}

async function fetchQldXml(pageUrl: string): Promise<string> {
  const xmlUrl = pageUrl.replace('/view/html/', '/view/xml/')
  try { return await fetchAndExtractText(xmlUrl) } catch { /* fall through */ }
  return fetchAndExtractText(pageUrl)
}

async function fetchAndExtractText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      'Accept': 'application/xml, text/xml, text/html, */*',
    },
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)

  const contentType = res.headers.get('content-type') ?? ''
  const rawBuffer = await res.arrayBuffer()
  const raw = new TextDecoder().decode(rawBuffer.slice(0, MAX_BYTES))

  return contentType.includes('xml') ? stripXmlTags(raw) : stripHtmlTags(raw)
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_BYTES)
}

function stripXmlTags(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_BYTES)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
