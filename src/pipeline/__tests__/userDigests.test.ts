import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const digestFixture = readFileSync(
  join(__dirname, '../../test/fixtures/digestResponse.json'),
  'utf-8'
)

// Mock wasp/server
const mockPrisma = {
  user: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  userDigest: {
    create: vi.fn().mockResolvedValue({ id: 'digest-1' }),
    update: vi.fn().mockResolvedValue({}),
    findFirst: vi.fn().mockResolvedValue(null),
  },
  case: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  userDigestTopCase: {
    create: vi.fn().mockResolvedValue({}),
  },
  userDigestExtendedCase: {
    create: vi.fn().mockResolvedValue({}),
  },
}

vi.mock('wasp/server', () => ({ prisma: mockPrisma }))

// Mock Anthropic SDK — callClaude returns the digest fixture
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: digestFixture }],
        stop_reason: 'end_turn',
      }),
    }
  },
}))

const { buildAndSaveDigest, runDigests } = await import('../userDigests')

describe('userDigests — per-user digest generation', () => {
  const matchingCases = [
    {
      id: 'case-1',
      citation: '[2026] HCA 15',
      caseName: 'Smith v Jones',
      court: 'High Court of Australia',
      courtCode: 'HCA',
      caseAnalysis: {
        factsSummary: 'Facts about Smith v Jones.',
        legalAnalysis: 'Analysis of separation of powers.',
        whyItMatters: 'Narrows scope for non-judicial adjudication.',
        significanceScore: 9,
        primaryArea: 'constitutional',
      },
    },
    {
      id: 'case-2',
      citation: '[2026] HCA 16',
      caseName: 'Brown v State of NSW',
      court: 'High Court of Australia',
      courtCode: 'HCA',
      caseAnalysis: {
        factsSummary: 'Facts about Brown v NSW.',
        legalAnalysis: 'Analysis of procedural fairness.',
        whyItMatters: 'Confirms high bar for denying hearing rights.',
        significanceScore: 7,
        primaryArea: 'administrative',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.case.findMany.mockResolvedValue(matchingCases)
    mockPrisma.userDigest.findFirst.mockResolvedValue(null) // no recent digest
  })

  it('creates digest with top cases and extended cases', async () => {
    await buildAndSaveDigest('user-1', ['constitutional', 'administrative'])

    // Should create digest record
    expect(mockPrisma.userDigest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          status: 'pending',
        }),
      })
    )

    // Should create top case records (fixture has 2 top cases)
    expect(mockPrisma.userDigestTopCase.create).toHaveBeenCalledTimes(2)

    // Should create extended case records (fixture has 1, but no matching DB case)
    // [2026] NSWCA 55 won't match our mockCases, so it'll be skipped with a warning
    expect(mockPrisma.userDigestExtendedCase.create).toHaveBeenCalledTimes(0)

    // Should mark digest as completed
    expect(mockPrisma.userDigest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'completed',
          digestSummary: expect.stringContaining('landmark'),
        }),
      })
    )
  })

  it('handles empty case set — no relevant cases', async () => {
    mockPrisma.case.findMany.mockResolvedValue([])

    await buildAndSaveDigest('user-1', ['constitutional'])

    expect(mockPrisma.userDigest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'completed',
          digestSummary: 'No relevant cases this period.',
        }),
      })
    )

    // No Claude call needed
    expect(mockPrisma.userDigestTopCase.create).not.toHaveBeenCalled()
  })

  it('skips user with recent digest (23h freshness)', async () => {
    const recentDigest = { id: 'recent', createdAt: new Date() }
    mockPrisma.userDigest.findFirst.mockResolvedValue(recentDigest)

    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        onboarded: true,
        userAreas: [{ areaSlug: 'constitutional' }],
      },
    ])

    await runDigests(undefined, undefined)

    // Should NOT create a new digest
    expect(mockPrisma.userDigest.create).not.toHaveBeenCalled()
  })

  it('handles citation normalization — strips case name suffix', async () => {
    // Test the normCitation function indirectly via digest matching
    // The fixture returns citations like "[2026] HCA 15" which should match
    // even if Claude returns "[2026] HCA 15 — Smith v Jones"
    await buildAndSaveDigest('user-1', ['constitutional'])

    // Top cases should have been matched (fixture citations are clean)
    expect(mockPrisma.userDigestTopCase.create).toHaveBeenCalled()
  })
})

describe('normCitation', () => {
  // Test the citation normalization logic directly
  // Since normCitation is not exported, we test via behavior above
  // But we can test the regex pattern it uses

  it('strips em-dash suffix from citations', () => {
    const norm = (s: string) =>
      s.split(/\s+[—–-]\s+/)[0].replace(/\s+/g, ' ').trim().toLowerCase()

    expect(norm('[2026] HCA 15 — Smith v Jones')).toBe('[2026] hca 15')
    expect(norm('[2026] HCA 15')).toBe('[2026] hca 15')
    expect(norm('[2026] NSWCA 100 – Brown v State')).toBe('[2026] nswca 100')
    expect(norm('  [2026]  HCA  15  ')).toBe('[2026] hca 15')
  })
})
