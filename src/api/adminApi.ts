import { prisma } from 'wasp/server'
import { HttpError } from 'wasp/server'
import { runDiscovery, runDiscoveryAll } from '../pipeline/discovery'
import { runTriageOnly, runTextRetrieval, runCaseAnalysis } from '../pipeline/triage'
import { runDigests } from '../pipeline/userDigests'
import { ALL_AREA_SLUGS } from '../shared/constants'
import { buildBatchAnalysisPrompt } from '../pipeline/prompts'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// GET /api/admin/status — comprehensive per-phase stats
export const getAdminStatusHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const weekAgo = new Date(Date.now() - WEEK_MS)

  const [
    feeds,
    discoveryRuns,
    recentDigests,

    // Phase 1
    casesTotal,
    casesThisWeek,

    // Phase 2a
    casesUntriaged,
    casesTriaged,
    casesHighSignificance,

    // Phase 2b
    casesNeedingExcerpt,
    casesExcerptFetched,

    // Phase 2c
    casesNeedingAnalysis,
    casesAnalysed,

    // Phase 3
    usersOnboarded,
    digestsThisWeek,
    digestsPending,
  ] = await Promise.all([
    prisma.rssFeedRegistry.findMany({ orderBy: { tier: 'asc' } }),
    prisma.discoveryRun.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.userDigest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, status: true, createdAt: true, completedAt: true,
        areaSlugs: true, errorMessage: true, userId: true,
        modelUsed: true, tokensUsed: true,
      },
    }),

    // Phase 1
    prisma.case.count(),
    prisma.case.count({ where: { createdAt: { gte: weekAgo } } }),

    // Phase 2a
    prisma.case.count({ where: { caseAreaTags: { none: {} } } }),
    prisma.case.count({ where: { caseAreaTags: { some: {} } } }),
    prisma.case.count({
      where: { caseAreaTags: { some: { relevanceConfidence: { gte: 0.7 } } } },
    }),

    // Phase 2b — needs excerpt but hasn't fetched it yet
    prisma.case.count({
      where: {
        excerptFetched: false,
        caseAreaTags: { some: { relevanceConfidence: { gte: 0.7 } } },
      },
    }),
    prisma.case.count({ where: { excerptFetched: true } }),

    // Phase 2c — has excerpt but no analysis
    prisma.case.count({
      where: { excerptFetched: true, caseAnalysis: null },
    }),
    prisma.caseAnalysis.count(),

    // Phase 3
    prisma.user.count({ where: { onboarded: true, userAreas: { some: {} } } }),
    prisma.userDigest.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.userDigest.count({ where: { status: 'pending' } }),
  ])

  res.json({
    feeds,
    discoveryRuns,
    recentDigests,
    phases: {
      p1: { casesTotal, casesThisWeek },
      p2a: { casesUntriaged, casesTriaged, casesHighSignificance },
      p2b: { casesNeedingExcerpt, casesExcerptFetched },
      p2c: { casesNeedingAnalysis, casesAnalysed },
      p3: { usersOnboarded, digestsThisWeek, digestsPending },
    },
    env: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      databaseUrl: process.env.DATABASE_URL ? '✓ set' : '✗ missing',
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
    },
  })
}

// POST /api/admin/trigger-discovery (Phase 1 — last 7 days only)
export const triggerDiscoveryHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)
  runDiscovery(undefined, undefined).catch((err) =>
    console.error('[admin] Discovery failed:', err)
  )
  res.status(202).json({ message: 'Phase 1 Discovery triggered (last 7 days) — watch server logs' })
}

// POST /api/admin/backfill-discovery — fetches ALL items in JADE feeds, no date filter
export const backfillDiscoveryHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)
  runDiscoveryAll().catch((err) =>
    console.error('[admin] Backfill discovery failed:', err)
  )
  res.status(202).json({ message: 'Backfill discovery triggered — fetching all JADE feed items, watch server logs' })
}

// POST /api/admin/trigger-triage (Phase 2a)
export const triggerTriageOnlyHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)
  runTriageOnly().catch((err) =>
    console.error('[admin] Triage (2a) failed:', err)
  )
  res.status(202).json({ message: 'Phase 2a Triage triggered — watch server logs' })
}

// POST /api/admin/trigger-text-retrieval (Phase 2b)
export const triggerTextRetrievalHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)
  runTextRetrieval().catch((err) =>
    console.error('[admin] Text retrieval (2b) failed:', err)
  )
  res.status(202).json({ message: 'Phase 2b Text Retrieval triggered — watch server logs' })
}

// POST /api/admin/trigger-case-analysis (Phase 2c)
// Optional query param: ?limit=N to process only the top N cases (for testing)
export const triggerCaseAnalysisHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined
  runCaseAnalysis(limit).catch((err) =>
    console.error('[admin] Case analysis (2c) failed:', err)
  )
  const msg = limit
    ? `Phase 2c triggered (top ${limit} cases) — watch server logs`
    : 'Phase 2c Case Analysis triggered — watch server logs'
  res.status(202).json({ message: msg })
}

// POST /api/admin/trigger-digests (Phase 3)
export const triggerDigestsHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)
  runDigests(undefined, undefined).catch((err) =>
    console.error('[admin] Digests (3) failed:', err)
  )
  res.status(202).json({ message: 'Phase 3 Digests triggered — watch server logs' })
}

// POST /api/admin/setup-test-user
export const setupTestUserHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)
  const userId = context.user.id

  await prisma.user.update({
    where: { id: userId },
    data: { plan: 'pro', onboarded: true, dashboardRunsThisWeek: 0, dashboardRunsResetAt: new Date() },
  })
  await prisma.userArea.deleteMany({ where: { userId } })
  await prisma.userArea.createMany({
    data: ALL_AREA_SLUGS.map((slug) => ({ userId, areaSlug: slug, emailFrequency: 'weekly' })),
    skipDuplicates: true,
  })

  res.json({ message: 'Done — Pro plan, all 15 areas assigned.' })
}

const BATCH_SIZE = 50

// GET /api/admin/backfill-prompt?batch=1
// Returns a plain-text prompt for batch N (1-based) of cases needing analysis.
// Paste into Claude.ai, then POST the JSON response to /api/admin/backfill-import.
export const backfillPromptHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const batch = parseInt(req.query.batch ?? '1', 10)
  const skip = (batch - 1) * BATCH_SIZE

  const cases = await prisma.case.findMany({
    where: { excerptFetched: true, caseAnalysis: null },
    orderBy: [{ judgmentExcerpt: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: BATCH_SIZE,
    select: {
      citation: true,
      caseName: true,
      court: true,
      catchwords: true,
      judgmentExcerpt: true,
    },
  })

  if (cases.length === 0) {
    res.type('text/plain').send(`No cases remaining for analysis in batch ${batch}.`)
    return
  }

  const totalPending = await prisma.case.count({
    where: { excerptFetched: true, caseAnalysis: null },
  })
  const totalBatches = Math.ceil(totalPending / BATCH_SIZE)

  const prompt = buildBatchAnalysisPrompt(cases)
  const header = `# Batch ${batch} of ${totalBatches} — ${cases.length} cases (${totalPending} total pending)\n# POST the JSON response to /api/admin/backfill-import\n\n`

  res.type('text/plain').send(header + prompt)
}

// POST /api/admin/backfill-import
// Body: JSON array matching BatchAnalysisResult schema (from Claude.ai response).
// Upserts into case_analyses and updates secondary area tags.
export const backfillImportHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const analyses: Array<{
    citation: string
    factsSummary: string
    legalAnalysis: string
    whyItMatters: string
    significanceScore: number
    scoreJustification: string
    primaryArea: string
    secondaryAreas: string[]
    classificationReasoning: string
  }> = req.body

  if (!Array.isArray(analyses)) {
    throw new HttpError(400, 'Body must be a JSON array of analysis objects')
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const a of analyses) {
    if (!a.citation) { errors.push('Missing citation — skipped'); continue }

    const c = await prisma.case.findUnique({
      where: { citation: a.citation },
      select: { id: true },
    })

    if (!c) {
      errors.push(`Citation not found: ${a.citation}`)
      skipped++
      continue
    }

    try {
      await prisma.caseAnalysis.upsert({
        where: { caseId: c.id },
        update: {
          factsSummary: a.factsSummary,
          legalAnalysis: a.legalAnalysis,
          whyItMatters: a.whyItMatters,
          significanceScore: a.significanceScore,
          scoreJustification: a.scoreJustification ?? null,
          primaryArea: a.primaryArea,
          secondaryAreas: a.secondaryAreas ?? [],
          classificationReasoning: a.classificationReasoning ?? null,
          modelUsed: 'claude-ai-web',
          generatedAt: new Date(),
        },
        create: {
          caseId: c.id,
          factsSummary: a.factsSummary,
          legalAnalysis: a.legalAnalysis,
          whyItMatters: a.whyItMatters,
          significanceScore: a.significanceScore,
          scoreJustification: a.scoreJustification ?? null,
          primaryArea: a.primaryArea,
          secondaryAreas: a.secondaryAreas ?? [],
          classificationReasoning: a.classificationReasoning ?? null,
          modelUsed: 'claude-ai-web',
          generatedAt: new Date(),
        },
      })

      // Upsert secondary area tags
      for (const areaSlug of (a.secondaryAreas ?? [])) {
        if (areaSlug === a.primaryArea) continue
        try {
          await prisma.caseAreaTag.upsert({
            where: { caseId_areaSlug: { caseId: c.id, areaSlug } },
            update: { relevanceConfidence: 0.5 },
            create: { caseId: c.id, areaSlug, relevanceConfidence: 0.5, assignedBy: 'analysis_claude' },
          })
        } catch { /* invalid slug — skip */ }
      }

      imported++
    } catch (err: any) {
      errors.push(`${a.citation}: ${err?.message ?? 'unknown error'}`)
      skipped++
    }
  }

  res.json({ imported, skipped, errors })
}
