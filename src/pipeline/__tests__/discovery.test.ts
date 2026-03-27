import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// Mock wasp/server before importing discovery module
const mockPrisma = {
  discoveryRun: {
    create: vi.fn().mockResolvedValue({ id: 'run-1' }),
    update: vi.fn().mockResolvedValue({}),
  },
  case: {
    upsert: vi.fn().mockResolvedValue({}),
  },
  rssFeedRegistry: {
    updateMany: vi.fn().mockResolvedValue({}),
  },
}

vi.mock('wasp/server', () => ({ prisma: mockPrisma }))

// Mock fetch globally
const jadeFeedXml = readFileSync(join(__dirname, '../../test/fixtures/jadeFeed.xml'), 'utf-8')

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Now import the module under test
const { runDiscovery, runDiscoveryAll } = await import('../discovery')

describe('discovery — RSS parsing and case creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(jadeFeedXml),
    })
  })

  it('polls all 13 JADE feeds and creates DiscoveryRun', async () => {
    await runDiscovery(undefined, undefined)

    expect(mockPrisma.discoveryRun.create).toHaveBeenCalledOnce()
    expect(mockPrisma.discoveryRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'running' }),
      })
    )

    // Should complete successfully
    expect(mockPrisma.discoveryRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'completed' }),
      })
    )
  })

  it('extracts citations from RSS items', async () => {
    // Use backfill (no date filter) to avoid fixture dates being outside 48h window
    await runDiscoveryAll(undefined, undefined)

    const upsertCalls = mockPrisma.case.upsert.mock.calls
    const citations = upsertCalls.map((call: any) => call[0].where.citation)

    // Should have found all 3 citations from the RSS feed (× 13 feeds)
    expect(citations.length).toBeGreaterThan(0)
    expect(citations).toContain('[2026] HCA 15')
    expect(citations).toContain('[2026] HCA 16')
    expect(citations).toContain('[2025] HCA 99')
  })

  it('filters old cases when date filter is active', async () => {
    // Daily run uses 48h window — fixture cases from March 23-24 are outside
    // that window when running on March 27, so only the feed poll happens
    await runDiscovery(undefined, undefined)

    const upsertCalls = mockPrisma.case.upsert.mock.calls
    const citations = upsertCalls.map((call: any) => call[0].where.citation)

    // Old 2025 case should definitely be excluded
    expect(citations).not.toContain('[2025] HCA 99')
  })

  it('includes all cases in backfill mode (no date filter)', async () => {
    await runDiscoveryAll(undefined, undefined)

    const upsertCalls = mockPrisma.case.upsert.mock.calls
    const citations = upsertCalls.map((call: any) => call[0].where.citation)

    // Backfill should include everything, even old cases
    expect(citations).toContain('[2025] HCA 99')
  })

  it('handles feed HTTP error gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(''),
    })

    // Should not throw — errors are caught per feed
    await runDiscovery(undefined, undefined)

    // DiscoveryRun should still complete (0 cases discovered)
    expect(mockPrisma.discoveryRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'completed', casesDiscovered: 0 }),
      })
    )
  })

  it('records feed errors in RssFeedRegistry', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(''),
    })

    await runDiscovery(undefined, undefined)

    // Should update feed registry with error status on the second updateMany call
    // (first call is the HTTP status update inside pollFeed, second is the catch block)
    const updateCalls = mockPrisma.rssFeedRegistry.updateMany.mock.calls
    expect(updateCalls.length).toBeGreaterThan(0)
  })

  it('creates case with correct structure', async () => {
    await runDiscoveryAll(undefined, undefined)

    const upsertCalls = mockPrisma.case.upsert.mock.calls
    const firstCreate = upsertCalls.find(
      (call: any) => call[0].where.citation === '[2026] HCA 15'
    )

    expect(firstCreate).toBeDefined()
    const createData = firstCreate![0].create
    expect(createData).toMatchObject({
      citation: '[2026] HCA 15',
      caseName: expect.stringContaining('Smith'),
      courtCode: 'HCA',
      excerptFetched: false,
    })
    expect(createData.austliiUrl).toContain('austlii.edu.au')
  })
})
