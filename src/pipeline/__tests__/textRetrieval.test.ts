import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const austliiHtml = readFileSync(
  join(__dirname, '../../test/fixtures/austliiPage.html'),
  'utf-8'
)

// Mock wasp/server
const mockPrisma = {
  case: {
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({}),
  },
}

vi.mock('wasp/server', () => ({ prisma: mockPrisma }))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { fetchJudgmentTexts } = await import('../textRetrieval')

function createReadableStream(text: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  let read = false
  return {
    getReader: () => ({
      read: () => {
        if (!read) {
          read = true
          return Promise.resolve({ done: false, value: data })
        }
        return Promise.resolve({ done: true, value: undefined })
      },
      cancel: vi.fn(),
    }),
  }
}

describe('textRetrieval — AustLII judgment fetching', () => {
  const highScoredCases = [
    {
      id: 'case-1',
      citation: '[2026] HCA 15',
      courtCode: 'HCA',
      austliiUrl: 'https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2026/15.html',
    },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockPrisma.case.findMany.mockResolvedValue(highScoredCases)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper: advance fake timers while awaiting a promise
  async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
    const result = promise
    // Flush all pending timers repeatedly until the promise settles
    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(35000) // covers 30s rate-limit waits
    }
    return result
  }

  it('fetches text for high-scored cases and updates DB', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: createReadableStream(austliiHtml),
    })

    await runWithTimers(fetchJudgmentTexts())

    expect(mockPrisma.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'case-1' },
        data: expect.objectContaining({
          excerptFetched: true,
          judgmentExcerpt: expect.stringContaining('constitutional validity'),
        }),
      })
    )
  })

  it('marks cases as fetched with null text when all mirrors fail', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await runWithTimers(fetchJudgmentTexts())

    expect(mockPrisma.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          excerptFetched: true,
          judgmentExcerpt: null,
        }),
      })
    )
  })

  it('marks medium-scored cases as fetched without downloading text', async () => {
    mockPrisma.case.findMany.mockResolvedValue([]) // no high-scored cases

    await runWithTimers(fetchJudgmentTexts())

    expect(mockPrisma.case.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { excerptFetched: true },
      })
    )
  })

  it('tries fallback mirrors on failure', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      callCount++
      if (callCount <= 1) {
        return Promise.reject(new Error('Connection refused'))
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        body: createReadableStream(austliiHtml),
      })
    })

    await runWithTimers(fetchJudgmentTexts())

    expect(mockFetch).toHaveBeenCalledTimes(2)

    expect(mockPrisma.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          excerptFetched: true,
          judgmentExcerpt: expect.any(String),
        }),
      })
    )
  })

  it('strips HTML tags and scripts from judgment text', async () => {
    const htmlWithScripts = `
      <html><head><script>alert('xss')</script></head>
      <body><style>.foo{}</style>
      <p>The court held that &amp; the appellant&#39;s claim was valid.</p>
      </body></html>
    `
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: createReadableStream(htmlWithScripts),
    })

    await runWithTimers(fetchJudgmentTexts())

    const updateCall = mockPrisma.case.update.mock.calls[0]
    const excerpt = updateCall[0].data.judgmentExcerpt

    if (excerpt) {
      expect(excerpt).not.toContain('<script>')
      expect(excerpt).not.toContain('<style>')
      expect(excerpt).not.toContain('<p>')
      expect(excerpt).toContain('court held')
    }
  })
})
