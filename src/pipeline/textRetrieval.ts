import { prisma } from 'wasp/server'
import { AUSTLII_MIRRORS, buildAustliiUrl } from './feedRegistry'

const RATE_LIMIT_MS = 3000   // 3s between requests
const MAX_BYTES = 102400     // 100KB cap
const HIGH_SCORE_THRESHOLD = 0.7  // relevanceConfidence >= 0.7 (score 7+)

export async function fetchJudgmentTexts(): Promise<void> {
  // Cases scoring 7+: fetch judgment text
  const highScoredCases = await prisma.case.findMany({
    where: {
      excerptFetched: false,
      austliiUrl: { not: null },
      caseAreaTags: {
        some: { relevanceConfidence: { gte: HIGH_SCORE_THRESHOLD } },
      },
    },
    select: { id: true, citation: true, courtCode: true, austliiUrl: true },
  })

  // Cases scoring 5-6: mark as fetched with no text (catchwords used downstream)
  await prisma.case.updateMany({
    where: {
      excerptFetched: false,
      caseAreaTags: {
        some: { relevanceConfidence: { gte: 0.5, lt: HIGH_SCORE_THRESHOLD } },
      },
    },
    data: { excerptFetched: true },
  })

  console.log(`[textRetrieval] Fetching text for ${highScoredCases.length} high-significance cases.`)

  for (const c of highScoredCases) {
    const text = await fetchWithFallback(c.citation, c.courtCode)

    await prisma.case.update({
      where: { id: c.id },
      data: {
        excerptFetched: true,
        judgmentExcerpt: text,
      },
    })

    if (text) {
      console.log(`[textRetrieval] ✓ ${c.citation}`)
    } else {
      console.warn(`[textRetrieval] ✗ ${c.citation} — all mirrors failed`)
    }

    await sleep(RATE_LIMIT_MS)
  }
}

async function fetchWithFallback(citation: string, courtCode: string): Promise<string | null> {
  for (const mirror of AUSTLII_MIRRORS) {
    const url = buildAustliiUrl(citation, mirror)
    if (!url) return null

    try {
      const text = await fetchAndExtract(url)
      if (text) return text
    } catch (err) {
      console.warn(`[textRetrieval] Mirror ${mirror} failed for ${citation}:`, err)
    }

    // Brief pause before trying next mirror
    await sleep(1000)
  }
  return null
}

async function fetchAndExtract(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout per request

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BenchWatch/1.0)',
        'Range': 'bytes=0-102400',
      },
      signal: controller.signal,
    })

    if (res.status === 429 || res.status === 503) {
      // Rate limited — wait longer and signal failure so caller tries next mirror
      await sleep(30000)
      throw new Error(`Rate limited: HTTP ${res.status}`)
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    // Read stream with size cap (Range header may not be honoured)
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')

    const chunks: Uint8Array[] = []
    let totalBytes = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      totalBytes += value.length
      if (totalBytes >= MAX_BYTES) {
        reader.cancel()
        break
      }
    }

    const html = new TextDecoder().decode(
      chunks.reduce((acc, chunk) => {
        const merged = new Uint8Array(acc.length + chunk.length)
        merged.set(acc)
        merged.set(chunk, acc.length)
        return merged
      }, new Uint8Array())
    )

    return extractText(html)
  } finally {
    clearTimeout(timeoutId)
  }
}

function extractText(html: string): string | null {
  // Strip script/style blocks first
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length < 100) return null
  return cleaned.slice(0, 3000)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
