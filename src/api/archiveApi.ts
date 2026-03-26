import { HttpError } from 'wasp/server'

const PAGE_SIZE = 10

export const getArchiveHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const page = parseInt(String(req.query.page ?? '0'), 10) || 0

  const [digests, total] = await Promise.all([
    context.entities.UserDigest.findMany({
      where: { userId: context.user.id, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        topCases: {
          orderBy: { rank: 'asc' },
          include: { case: { select: { id: true, citation: true, caseName: true, court: true, courtCode: true, decisionDate: true, catchwords: true, jadeUrl: true, austliiUrl: true } } },
        },
        extendedCases: {
          orderBy: { rank: 'asc' },
          include: { case: { select: { id: true, citation: true, caseName: true, court: true, decisionDate: true } } },
        },
      },
    }),
    context.entities.UserDigest.count({
      where: { userId: context.user.id, status: 'completed' },
    }),
  ])

  res.json({
    digests,
    total,
    page,
    pageSize: PAGE_SIZE,
    hasMore: (page + 1) * PAGE_SIZE < total,
  })
}
