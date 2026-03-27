import { HttpError } from 'wasp/server'
import { prisma } from 'wasp/server'

// GET /api/digest/latest
// Returns the most recent completed digest for the authenticated user.
export const getLatestDigestHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const digest = await context.entities.UserDigest.findFirst({
    where: { userId: context.user.id, status: 'completed' },
    orderBy: { createdAt: 'desc' },
    include: {
      topCases: {
        orderBy: { rank: 'asc' },
        include: {
          case: {
            select: {
              id: true, citation: true, caseName: true, court: true,
              courtCode: true, decisionDate: true, catchwords: true,
              jadeUrl: true, austliiUrl: true,
            },
          },
        },
      },
      extendedCases: {
        orderBy: { rank: 'asc' },
        include: {
          case: {
            select: { id: true, citation: true, caseName: true, court: true, decisionDate: true },
          },
        },
      },
    },
  })

  res.json({ digest: digest ?? null })
}

// GET /api/browse?days=7&areas=criminal,tax
// Returns cases from the last N days matching the given areas, sorted by significance.
// Falls back to the user's saved areas if none specified. No AI involved — pure DB query.
export const browseCasesHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const days = Math.min(parseInt(String(req.query.days ?? '7'), 10) || 7, 90)
  const areasParam = req.query.areas ? String(req.query.areas) : ''
  let areaSlugs = areasParam ? areasParam.split(',').map((s: string) => s.trim()).filter(Boolean) : []

  // Default to the user's saved areas
  if (areaSlugs.length === 0) {
    const userAreas = await prisma.userArea.findMany({
      where: { userId: context.user.id },
      select: { areaSlug: true },
    })
    areaSlugs = userAreas.map((ua) => ua.areaSlug)
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const cases = await prisma.case.findMany({
    where: {
      decisionDate: { gte: since },
      caseAnalysis: { isNot: null },
      ...(areaSlugs.length > 0
        ? { caseAreaTags: { some: { areaSlug: { in: areaSlugs }, relevanceConfidence: { gte: 0.3 } } } }
        : {}),
    },
    include: {
      caseAnalysis: {
        select: {
          significanceScore: true,
          primaryArea: true,
          whyItMatters: true,
          factsSummary: true,
          scoreJustification: true,
        },
      },
      caseAreaTags: { select: { areaSlug: true } },
    },
    orderBy: { caseAnalysis: { significanceScore: 'desc' } },
    take: 50,
  })

  res.json({ cases, days, areaSlugs })
}
