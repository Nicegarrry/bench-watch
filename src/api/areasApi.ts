import { HttpError } from 'wasp/server'

export const updateUserProfileHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)
  const { displayName } = req.body as { displayName?: string }
  const trimmed = displayName?.trim() ?? null
  await context.entities.User.update({
    where: { id: context.user.id },
    data: { displayName: trimmed },
  })
  res.json({ displayName: trimmed })
}

export const getAreasHandler = async (_req: any, res: any, context: any) => {
  const areas = await context.entities.LawArea.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  res.json(areas)
}

export const updateUserAreasHandler = async (req: any, res: any, context: any) => {
  if (!context.user) throw new HttpError(401)

  const { areaSlugs, emailFrequency } = req.body as {
    areaSlugs: string[]
    emailFrequency?: string
  }

  if (!Array.isArray(areaSlugs) || areaSlugs.length === 0) {
    throw new HttpError(400, 'areaSlugs must be a non-empty array')
  }

  // Validate slugs exist
  const validAreas = await context.entities.LawArea.findMany({
    where: { slug: { in: areaSlugs }, isActive: true },
    select: { slug: true },
  })
  const validSlugs = new Set(validAreas.map((a: { slug: string }) => a.slug))
  const invalidSlugs = areaSlugs.filter((s) => !validSlugs.has(s))
  if (invalidSlugs.length > 0) {
    throw new HttpError(400, `Invalid area slugs: ${invalidSlugs.join(', ')}`)
  }

  // Replace user's area selections
  await context.entities.UserArea.deleteMany({
    where: { userId: context.user.id },
  })

  await context.entities.UserArea.createMany({
    data: areaSlugs.map((slug: string) => ({
      userId: context.user.id,
      areaSlug: slug,
      emailFrequency: emailFrequency ?? 'weekly',
    })),
  })

  // Mark user as onboarded and auto-assign Pro plan
  // TODO: Remove auto-Pro before launch — integrate Stripe for real plan management
  await context.entities.User.update({
    where: { id: context.user.id },
    data: { onboarded: true, plan: 'pro' },
  })

  res.json({ updated: areaSlugs.length, areaSlugs })
}
