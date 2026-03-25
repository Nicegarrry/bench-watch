import { HttpError } from 'wasp/server'
import { buildAndSaveDigest } from '../pipeline/userDigests'

const FREE_RUN_LIMIT = 3

export const runDigestHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    include: { userAreas: true },
  })

  if (!user) throw new HttpError(404)
  if (!user.onboarded) throw new HttpError(400, 'Complete onboarding first')
  if (user.userAreas.length === 0) throw new HttpError(400, 'Select at least one area of law first')

  // Reset weekly counter if past the week boundary
  const now = new Date()
  const resetAt = user.dashboardRunsResetAt
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  if (!resetAt || resetAt < weekAgo) {
    await context.entities.User.update({
      where: { id: user.id },
      data: { dashboardRunsThisWeek: 0, dashboardRunsResetAt: now },
    })
    user.dashboardRunsThisWeek = 0
  }

  // Rate limit for free users
  if (user.plan === 'free' && user.dashboardRunsThisWeek >= FREE_RUN_LIMIT) {
    throw new HttpError(429, 'Weekly digest run limit reached. Upgrade to Pro for more runs.')
  }

  // Increment counter
  await context.entities.User.update({
    where: { id: user.id },
    data: { dashboardRunsThisWeek: { increment: 1 } },
  })

  // Fire digest generation async — return 202 immediately
  const areaSlugs = user.userAreas.map((ua: { areaSlug: string }) => ua.areaSlug)
  buildAndSaveDigest(user.id, areaSlugs).catch((err) =>
    console.error('[digestApi] Background digest failed:', err)
  )

  res.status(202).json({ message: 'Digest generation started', runsUsed: user.dashboardRunsThisWeek + 1 })
}
