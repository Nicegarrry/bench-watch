import Anthropic from '@anthropic-ai/sdk'
import { prisma } from 'wasp/server'
import { callClaude, extractJson } from './utils'
import {
  buildLegislationTriagePrompt,
  buildLegislationDeepAnalysisPrompt,
  type LegislationTriageItem,
  type LegislationTriageResult,
  type LegislationDeepAnalysisItem,
  type LegislationDeepAnalysisResult,
} from './prompts'

const MODEL = 'claude-sonnet-4-6'

/**
 * L2a: Batch triage + summary for all untriaged changes (one Claude call).
 * L2c: Deep analysis for score 7+ changes that now have full text (one Claude call, if any).
 *
 * @param deepOnly  If true, skip L2a and only run L2c (called after text retrieval).
 * @param limit     Max items to process in this run (for test/dev use).
 */
export async function runLegislationAnalysis(deepOnly = false, limit?: number): Promise<void> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  if (!deepOnly) {
    await runL2aTriage(anthropic, limit)
  } else {
    await runL2cDeepAnalysis(anthropic, limit)
  }
}

// Convenience wrappers for admin trigger endpoints
export const runLegislationTriage = (limit?: number) => runLegislationAnalysis(false, limit)
export const runLegislationDeepAnalysis = (limit?: number) => runLegislationAnalysis(true, limit)

// ── L2a: Triage + summary ─────────────────────────────────────────────────

const TRIAGE_BATCH_SIZE = 30 // ~150 tokens/item × 30 = ~4500 tokens, fits in 8192

async function runL2aTriage(anthropic: Anthropic, limit?: number): Promise<void> {
  const cap = limit ?? 150
  const unanalysed = await prisma.legislationChange.findMany({
    where: { analysis: null },
    orderBy: { publishedAt: 'desc' },
    take: cap,
  })

  if (unanalysed.length === 0) {
    console.log('[legislation:L2a] No unanalysed changes.')
    return
  }

  const totalBatches = Math.ceil(unanalysed.length / TRIAGE_BATCH_SIZE)
  console.log(`[legislation:L2a] Triaging ${unanalysed.length} changes in ${totalBatches} batch(es)...`)

  let totalSaved = 0

  for (let b = 0; b < totalBatches; b++) {
    const slice = unanalysed.slice(b * TRIAGE_BATCH_SIZE, (b + 1) * TRIAGE_BATCH_SIZE)
    const items: LegislationTriageItem[] = slice.map((c) => ({
      id: c.id,
      title: c.title,
      jurisdiction: c.jurisdiction,
      changeType: c.changeType,
      feedSummary: c.feedSummary,
    }))

    const prompt = buildLegislationTriagePrompt(items)

    let raw: string
    try {
      raw = await callClaude(anthropic, prompt, { maxTokens: 8192 })
    } catch (err) {
      console.error(`[legislation:L2a] Claude call failed (batch ${b + 1}):`, err)
      continue
    }

    let results: LegislationTriageResult[]
    try {
      results = JSON.parse(extractJson(raw))
    } catch {
      console.error(`[legislation:L2a] Failed to parse response (batch ${b + 1}):`, raw.slice(0, 300))
      continue
    }

    let saved = 0
    for (const result of results) {
      try {
        await prisma.legislationChangeAnalysis.upsert({
          where: { changeId: result.id },
          create: {
            changeId: result.id,
            changeSummary: result.changeSummary,
            practiceImpact: result.practiceImpact ?? '',
            affectedAreas: result.areaSlugs,
            significanceScore: result.significanceScore,
            modelUsed: MODEL,
          },
          update: {
            changeSummary: result.changeSummary,
            practiceImpact: result.practiceImpact ?? '',
            affectedAreas: result.areaSlugs,
            significanceScore: result.significanceScore,
            modelUsed: MODEL,
          },
        })

        for (const slug of result.areaSlugs) {
          await prisma.legislationAreaTag.upsert({
            where: { changeId_areaSlug: { changeId: result.id, areaSlug: slug } },
            create: { changeId: result.id, areaSlug: slug, relevanceConfidence: 0.8, assignedBy: 'ai' },
            update: { relevanceConfidence: 0.8 },
          })
        }

        saved++
      } catch (err) {
        console.error(`[legislation:L2a] Failed to save result for ${result.id}:`, err)
      }
    }

    console.log(`[legislation:L2a] Batch ${b + 1}/${totalBatches}: saved ${saved}/${results.length}`)
    totalSaved += saved
  }

  console.log(`[legislation:L2a] Done. ${totalSaved} total saved.`)
}

// ── L2c: Deep analysis for 7+ items with full text ────────────────────────

async function runL2cDeepAnalysis(anthropic: Anthropic, limit?: number): Promise<void> {
  // Find score 7+ changes that have full text fetched but weren't deep-analysed yet
  // We detect "already deep-analysed" by checking if changeSummary is > 300 chars
  // (L2a produces short summaries; L2c produces longer refined ones)
  const candidates = await prisma.legislationChange.findMany({
    where: {
      textFetched: true,
      fullText: { not: null },
      analysis: {
        significanceScore: { gte: 7 },
      },
    },
    include: { analysis: true },
  })

  const allNeedingDeep = candidates.filter(
    (c) => c.analysis && c.analysis.changeSummary.length < 400
  )
  const needsDeep = limit ? allNeedingDeep.slice(0, limit) : allNeedingDeep

  if (needsDeep.length === 0) {
    console.log('[legislation:L2c] No items need deep analysis.')
    return
  }

  console.log(`[legislation:L2c] Deep-analysing ${needsDeep.length} high-significance items...`)

  const items: LegislationDeepAnalysisItem[] = needsDeep.map((c) => ({
    id: c.id,
    title: c.title,
    jurisdiction: c.jurisdiction,
    fullText: c.fullText!,
    existingSummary: c.analysis!.changeSummary,
  }))

  const prompt = buildLegislationDeepAnalysisPrompt(items)

  let raw: string
  try {
    raw = await callClaude(anthropic, prompt, { maxTokens: 4096 })
  } catch (err) {
    console.error('[legislation:L2c] Claude call failed:', err)
    return
  }

  let results: LegislationDeepAnalysisResult[]
  try {
    results = JSON.parse(extractJson(raw))
  } catch {
    console.error('[legislation:L2c] Failed to parse Claude response:', raw.slice(0, 500))
    return
  }

  let updated = 0
  for (const result of results) {
    try {
      await prisma.legislationChangeAnalysis.update({
        where: { changeId: result.id },
        data: {
          changeSummary: result.changeSummary,
          practiceImpact: result.practiceImpact,
          significanceScore: result.significanceScore,
        },
      })
      updated++
    } catch (err) {
      console.error(`[legislation:L2c] Failed to update ${result.id}:`, err)
    }
  }

  console.log(`[legislation:L2c] Updated ${updated}/${results.length} deep analyses.`)
}
