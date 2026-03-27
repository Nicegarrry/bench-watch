import { HttpError } from 'wasp/server'
import { prisma } from 'wasp/server'

// GET /api/legislation?days=30&areas=contract,tax
// Returns legislation changes with analyses, filtered to the user's practice areas.
export const getLegislationHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const days = Math.min(parseInt(req.query.days ?? '30', 10) || 30, 90)
  const areasParam = req.query.areas as string | undefined

  // Determine which areas to filter by
  let areaFilter: string[] | undefined
  if (areasParam) {
    areaFilter = areasParam.split(',').map((a: string) => a.trim()).filter(Boolean)
  } else {
    // Default to user's selected areas
    const userAreas = await prisma.userArea.findMany({
      where: { userId: context.user.id },
      select: { areaSlug: true },
    })
    if (userAreas.length > 0) {
      areaFilter = userAreas.map((ua) => ua.areaSlug)
    }
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const changes = await prisma.legislationChange.findMany({
    where: {
      publishedAt: { gte: since },
      analysis: { isNot: null },
      ...(areaFilter && areaFilter.length > 0
        ? { areaTags: { some: { areaSlug: { in: areaFilter } } } }
        : {}),
    },
    include: {
      analysis: true,
      areaTags: { select: { areaSlug: true, relevanceConfidence: true } },
    },
    orderBy: [{ analysis: { significanceScore: 'desc' } }, { publishedAt: 'desc' }],
    take: 100,
  })

  res.json({ changes })
}

// GET /api/legislation/feeds
// Returns feed registry status (for admin/dev use).
export const getLegislationFeedsHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const feeds = await prisma.legislationFeedRegistry.findMany({
    orderBy: [{ tier: 'asc' }, { jurisdiction: 'asc' }],
  })

  res.json({ feeds })
}
