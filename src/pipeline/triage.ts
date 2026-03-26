import { prisma } from 'wasp/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildTriagePrompt, type TriageCase, type TriageResult } from './prompts'
import { extractJson } from './utils'
import { fetchJudgmentTexts } from './textRetrieval'
import { analyseCases } from './caseAnalysis'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const BATCH_SIZE = 30

// Court tier mapping for significance scoring
const COURT_TIER: Record<string, 1 | 2 | 3> = {
  HCA:    1,
  HCASJ:  1,
  FCAFC:  2,
  NSWCA:  2,
  NSWCCA: 2,
  VSCA:   2,
  QCA:    2,
  WASCA:  2,
  SASCFC: 2,
  TASFC:  2,
  ACTCA:  2,
  NTCA:   2,
  FCA:    3,
}

// WASP job handler — orchestrates all of Phase 2 (2a + 2b + 2c)
export const runTriage = async (_args: unknown, _context: unknown): Promise<void> => {
  console.log('[triage] Starting Phase 2a: AI triage...')
  await runTriageBatches()

  console.log('[triage] Starting Phase 2b: Judgment text retrieval...')
  await fetchJudgmentTexts()

  console.log('[triage] Starting Phase 2c: Case analysis...')
  await analyseCases()

  console.log('[triage] Phase 2 complete.')
}

// Individual phase exports — used by admin API for split triggers
export async function runTriageOnly(_args?: unknown, _context?: unknown): Promise<void> {
  console.log('[triage] Phase 2a: AI triage...')
  await runTriageBatches()
  console.log('[triage] Phase 2a complete.')
}

export { fetchJudgmentTexts as runTextRetrieval } from './textRetrieval'
export { analyseCases as runCaseAnalysis } from './caseAnalysis'

async function runTriageBatches(): Promise<void> {
  // No date filter — process ALL untriaged cases so backfills work correctly.
  // Idempotent: cases already tagged by triage are excluded via `caseAreaTags: { none: {} }`.
  const untriagedCases = await prisma.case.findMany({
    where: {
      caseAreaTags: { none: {} },
    },
    select: {
      id: true,
      citation: true,
      caseName: true,
      court: true,
      courtCode: true,
      catchwords: true,
      decisionDate: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (untriagedCases.length === 0) {
    console.log('[triage] No untriaged cases found.')
    return
  }

  console.log(`[triage] Triaging ${untriagedCases.length} cases in batches of ${BATCH_SIZE}.`)

  const batches = chunk(untriagedCases, BATCH_SIZE)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`[triage] Batch ${i + 1}/${batches.length} (${batch.length} cases)`)

    const triagedCases: TriageCase[] = batch.map((c, idx) => ({
      index: idx + 1,
      citation: c.citation,
      caseName: c.caseName,
      court: c.court,
      courtTier: COURT_TIER[c.courtCode] ?? 3,
      catchwords: c.catchwords,
      decisionDate: c.decisionDate?.toISOString().slice(0, 10) ?? 'unknown',
    }))

    try {
      const results = await triageBatch(triagedCases)

      for (const result of results) {
        const caseRecord = batch[result.index - 1]
        if (!caseRecord) continue

        const confidence = Math.min(result.significanceScore / 10, 1.0)

        await prisma.caseAreaTag.upsert({
          where: {
            caseId_areaSlug: {
              caseId: caseRecord.id,
              areaSlug: result.primaryArea,
            },
          },
          update: { relevanceConfidence: confidence },
          create: {
            caseId: caseRecord.id,
            areaSlug: result.primaryArea,
            relevanceConfidence: confidence,
            assignedBy: 'triage_claude',
          },
        })
      }

      console.log(`[triage] Batch ${i + 1} complete — ${results.length} cases tagged.`)
    } catch (err) {
      console.error(`[triage] Batch ${i + 1} failed:`, err)
    }

    if (i < batches.length - 1) {
      await sleep(500)
    }
  }
}

async function triageBatch(cases: TriageCase[]): Promise<TriageResult[]> {
  const prompt = buildTriagePrompt(cases)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''

  try {
    return JSON.parse(extractJson(raw)) as TriageResult[]
  } catch {
    console.error('[triage] JSON parse failed. Raw response:', raw.slice(0, 300))
    return []
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
