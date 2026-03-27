import { HttpError } from 'wasp/server'

export const getNotificationsHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const since = context.user.lastNotifSeenAt ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const analyses = await context.entities.CaseAnalysis.findMany({
    where: { significanceScore: { gte: 7 } },
    include: { case: { select: { id: true, citation: true, caseName: true, courtCode: true, createdAt: true } } },
    orderBy: { case: { createdAt: 'desc' } },
    take: 20,
  })

  const newCases = analyses.filter((a: any) => a.case.createdAt > since)

  res.json({ cases: newCases, count: newCases.length })
}

export const markNotificationsSeenHandler = async (_req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  await context.entities.User.update({
    where: { id: context.user.id },
    data: { lastNotifSeenAt: new Date() },
  })

  res.json({ ok: true })
}
