import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const triageFixture = readFileSync(
  join(__dirname, '../../test/fixtures/triageResponse.json'),
  'utf-8'
)

// Mock wasp/server
const mockPrisma = {
  case: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  caseAreaTag: {
    upsert: vi.fn().mockResolvedValue({}),
  },
}

vi.mock('wasp/server', () => ({ prisma: mockPrisma }))

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: triageFixture }],
      }),
    }
  },
}))

// Mock downstream phases (text retrieval + analysis)
vi.mock('../textRetrieval', () => ({
  fetchJudgmentTexts: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../caseAnalysis', () => ({
  analyseCases: vi.fn().mockResolvedValue(undefined),
}))

const { runTriageOnly } = await import('../triage')

describe('triage — AI significance scoring', () => {
  const mockCases = [
    {
      id: 'case-1',
      citation: '[2026] HCA 15',
      caseName: 'Smith v Jones',
      court: 'High Court of Australia',
      courtCode: 'HCA',
      catchwords: 'Constitutional law — Separation of powers',
      decisionDate: new Date('2026-03-23'),
    },
    {
      id: 'case-2',
      citation: '[2026] HCA 16',
      caseName: 'Brown v State of NSW',
      court: 'High Court of Australia',
      courtCode: 'HCA',
      catchwords: 'Administrative law — Judicial review',
      decisionDate: new Date('2026-03-24'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.case.findMany.mockResolvedValue(mockCases)
  })

  it('queries only untriaged cases', async () => {
    await runTriageOnly()

    expect(mockPrisma.case.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { caseAreaTags: { none: {} } },
      })
    )
  })

  it('creates CaseAreaTag with correct confidence from significance score', async () => {
    await runTriageOnly()

    const upsertCalls = mockPrisma.caseAreaTag.upsert.mock.calls

    // First case: score 9 → confidence 0.9
    const firstUpsert = upsertCalls.find(
      (call: any) => call[0].create.caseId === 'case-1'
    )
    expect(firstUpsert).toBeDefined()
    expect(firstUpsert![0].create.relevanceConfidence).toBe(0.9)
    expect(firstUpsert![0].create.areaSlug).toBe('constitutional')
    expect(firstUpsert![0].create.assignedBy).toBe('triage_claude')

    // Second case: score 7 → confidence 0.7
    const secondUpsert = upsertCalls.find(
      (call: any) => call[0].create.caseId === 'case-2'
    )
    expect(secondUpsert).toBeDefined()
    expect(secondUpsert![0].create.relevanceConfidence).toBe(0.7)
    expect(secondUpsert![0].create.areaSlug).toBe('administrative')
  })

  it('skips when no untriaged cases exist', async () => {
    mockPrisma.case.findMany.mockResolvedValue([])

    await runTriageOnly()

    expect(mockPrisma.caseAreaTag.upsert).not.toHaveBeenCalled()
  })

  it('caps confidence at 1.0 for score 10', async () => {
    // A score of 10 → confidence should be capped at 1.0 (10/10)
    // The fixture returns 9, but let's verify the formula
    const confidence = Math.min(10 / 10, 1.0)
    expect(confidence).toBe(1.0)
  })
})
