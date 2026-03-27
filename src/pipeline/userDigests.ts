import { prisma } from 'wasp/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildDigestPrompt, type DigestCase } from './prompts'
import { extractJson, callClaude } from './utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_CASES_PER_DIGEST = 40

const COURT_TIER: Record<string, 1 | 2 | 3> = {
  HCA:    1, HCASJ: 1,
  FCAFC:  2, NSWCA: 2, NSWCCA: 2, VSCA: 2, QCA: 2,
  WASCA:  2, SASCFC: 2, TASFC: 2, ACTCA: 2, NTCA: 2,
  FCA:    3,
}

// WASP job handler — runs nightly, skips users who already have a fresh digest today
export const runDigests = async (_args: unknown, _context: unknown): Promise<void> => {
  const usersWithAreas = await prisma.user.findMany({
    where: {
      onboarded: true,
      userAreas: { some: {} },
    },
    include: { userAreas: true },
  })

  console.log(`[digests] Building daily digests for ${usersWithAreas.length} users.`)

  const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000)

  for (const user of usersWithAreas) {
    try {
      const recent = await prisma.userDigest.findFirst({
        where: { userId: user.id, status: 'completed', createdAt: { gte: cutoff } },
      })
      if (recent) {
        console.log(`[digests] Skipping user ${user.id} — digest already current.`)
        continue
      }
      await buildAndSaveDigest(user.id, user.userAreas.map((ua) => ua.areaSlug))
      console.log(`[digests] ✓ User ${user.id}`)
    } catch (err) {
      console.error(`[digests] ✗ User ${user.id}:`, err)
    }
    await sleep(1000)
  }
}

export async function buildAndSaveDigest(userId: string, areaSlugs: string[]): Promise<void> {
  const now = new Date()
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const digest = await prisma.userDigest.create({
    data: {
      userId,
      periodType: 'daily',
      periodStart,
      periodEnd: now,
      areaSlugs,
      status: 'pending',
    },
  })

  try {
    const matchingCases = await prisma.case.findMany({
      where: {
        createdAt: { gte: periodStart },
        // Minimum confidence 0.3 filters out noise (score < 3) while keeping all meaningful tags
        caseAreaTags: { some: { areaSlug: { in: areaSlugs }, relevanceConfidence: { gte: 0.3 } } },
        caseAnalysis: { isNot: null },
      },
      include: { caseAnalysis: true },
      orderBy: { caseAnalysis: { significanceScore: 'desc' } },
      take: MAX_CASES_PER_DIGEST,
    })

    if (matchingCases.length === 0) {
      await prisma.userDigest.update({
        where: { id: digest.id },
        data: { status: 'completed', digestSummary: 'No relevant cases this period.', completedAt: now },
      })
      return
    }

    const digestCases: DigestCase[] = matchingCases.map((c) => ({
      citation: c.citation,
      caseName: c.caseName,
      court: c.court,
      courtTier: COURT_TIER[c.courtCode] ?? 3,
      factsSummary: c.caseAnalysis!.factsSummary,
      legalAnalysis: c.caseAnalysis!.legalAnalysis,
      whyItMatters: c.caseAnalysis!.whyItMatters,
      significanceScore: c.caseAnalysis!.significanceScore,
      primaryArea: c.caseAnalysis!.primaryArea,
    }))

    const prompt = buildDigestPrompt({ userAreas: areaSlugs, cases: digestCases })
    // Web search is disabled here — Phase 2c already enriched each case analysis.
    // The digest step only ranks/selects; enabling web search here doubles token cost.
    const raw = await callClaude(anthropic, prompt, { maxTokens: 4096, useWebSearch: false })

    let result: {
      digestSummary: string
      topCases: Array<{
        citation: string
        rank: number
        factsSummary: string
        legalAnalysis: string
        whyItMatters: string
        significanceScore: number
        primaryArea: string
      }>
      extendedCases: Array<{
        citation: string
        rank: number
        significanceScore: number
        primaryArea: string
        oneLineSummary: string
      }>
    }

    try {
      result = JSON.parse(extractJson(raw))
    } catch {
      console.error('[digests] JSON parse failed. Raw:', raw.slice(0, 200))
      throw new Error('Digest JSON parse failed')
    }

    console.log(`[digests] matchingCases citations:`, matchingCases.map(c => c.citation))
    console.log(`[digests] topCases from Claude:`, result.topCases.map(tc => tc.citation))
    console.log(`[digests] extendedCases from Claude:`, result.extendedCases.map(ec => ec.citation))

    for (const tc of result.topCases) {
      const caseRecord = matchingCases.find((c) => normCitation(c.citation) === normCitation(tc.citation))
      if (!caseRecord) {
        console.warn(`[digests] topCase citation not found: "${tc.citation}"`)
        continue
      }
      await prisma.userDigestTopCase.create({
        data: {
          digestId: digest.id,
          caseId: caseRecord.id,
          rank: tc.rank,
          factsSummary: tc.factsSummary,
          legalAnalysis: tc.legalAnalysis,
          whyItMatters: tc.whyItMatters,
          significanceScore: tc.significanceScore,
          primaryArea: tc.primaryArea,
        },
      })
    }

    for (const ec of result.extendedCases) {
      const caseRecord = matchingCases.find((c) => normCitation(c.citation) === normCitation(ec.citation))
      if (!caseRecord) {
        console.warn(`[digests] extendedCase citation not found: "${ec.citation}"`)
        continue
      }
      await prisma.userDigestExtendedCase.create({
        data: {
          digestId: digest.id,
          caseId: caseRecord.id,
          rank: ec.rank,
          significanceScore: ec.significanceScore,
          primaryArea: ec.primaryArea,
          oneLineSummary: ec.oneLineSummary,
        },
      })
    }

    await prisma.userDigest.update({
      where: { id: digest.id },
      data: {
        status: 'completed',
        digestSummary: result.digestSummary,
        modelUsed: 'claude-sonnet-4-6',
        completedAt: new Date(),
      },
    })
  } catch (err) {
    await prisma.userDigest.update({
      where: { id: digest.id },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      },
    })
    throw err
  }
}

function normCitation(s: string): string {
  // Claude sometimes appends " — Case Name" to the citation — strip it
  return s.split(/\s+[—–-]\s+/)[0].replace(/\s+/g, ' ').trim().toLowerCase()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
