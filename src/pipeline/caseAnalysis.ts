import { prisma } from 'wasp/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildCaseAnalysisPrompt } from './prompts'
import { extractJson, callClaude } from './utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Score threshold for using web search (7+ = high significance, worth enriching)
const WEB_SEARCH_THRESHOLD = 0.7

export async function analyseCases(): Promise<void> {
  const cases = await prisma.case.findMany({
    where: {
      excerptFetched: true,
      caseAnalysis: null,
    },
    include: {
      caseAreaTags: {
        orderBy: { relevanceConfidence: 'desc' },
        take: 1,
      },
    },
  })

  console.log(`[caseAnalysis] Analysing ${cases.length} cases.`)

  for (const c of cases) {
    const topConfidence = c.caseAreaTags[0]?.relevanceConfidence ?? 0
    const useWebSearch = topConfidence >= WEB_SEARCH_THRESHOLD

    const created = await analyseCase(c, useWebSearch)
    if (created) {
      console.log(`[caseAnalysis] ✓ ${c.citation}${useWebSearch ? ' (web search)' : ''}`)
    } else {
      console.warn(`[caseAnalysis] ✗ ${c.citation} — skipped (parse failure or no content)`)
    }
    await sleep(1000)
  }
}

async function analyseCase(
  c: {
    id: string
    citation: string
    caseName: string
    court: string
    catchwords: string | null
    judgmentExcerpt: string | null
  },
  useWebSearch: boolean
): Promise<boolean> {
  const prompt = buildCaseAnalysisPrompt({
    citation: c.citation,
    caseName: c.caseName,
    court: c.court,
    catchwords: c.catchwords,
    judgmentExcerpt: c.judgmentExcerpt,
    useWebSearch,
  })

  let raw: string
  try {
    raw = await callClaude(anthropic, prompt, { maxTokens: 2048, useWebSearch })
  } catch (err) {
    console.error(`[caseAnalysis] Claude API error for ${c.citation}:`, err)
    return false
  }

  if (!raw.trim()) {
    console.error(`[caseAnalysis] Empty response for ${c.citation}`)
    return false
  }

  let result: {
    factsSummary: string
    legalAnalysis: string
    whyItMatters: string
    significanceScore: number
    scoreJustification: string
    primaryArea: string
    secondaryAreas: string[]
    classificationReasoning: string
  }

  try {
    result = JSON.parse(extractJson(raw))
  } catch {
    console.error(
      `[caseAnalysis] JSON parse failed for ${c.citation}. Raw (first 200):`,
      raw.slice(0, 200)
    )
    return false
  }

  await prisma.caseAnalysis.create({
    data: {
      caseId: c.id,
      factsSummary: result.factsSummary,
      legalAnalysis: result.legalAnalysis,
      whyItMatters: result.whyItMatters,
      significanceScore: result.significanceScore,
      scoreJustification: result.scoreJustification ?? null,
      primaryArea: result.primaryArea,
      secondaryAreas: result.secondaryAreas ?? [],
      classificationReasoning: result.classificationReasoning ?? null,
      modelUsed: 'claude-sonnet-4-6',
      generatedAt: new Date(),
    },
  })

  // Save secondary area tags so users with those areas see this case in their digest.
  // Primary area was already saved by triage; secondaryAreas come from full analysis.
  // Use confidence 0.5 (notable threshold) for secondary classifications.
  const secondaryAreas = result.secondaryAreas ?? []
  for (const areaSlug of secondaryAreas) {
    if (areaSlug === result.primaryArea) continue
    try {
      await prisma.caseAreaTag.upsert({
        where: { caseId_areaSlug: { caseId: c.id, areaSlug } },
        update: { relevanceConfidence: 0.5 },
        create: {
          caseId: c.id,
          areaSlug,
          relevanceConfidence: 0.5,
          assignedBy: 'analysis_claude',
        },
      })
    } catch {
      // Invalid slug from Claude — skip silently
    }
  }

  return true
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
