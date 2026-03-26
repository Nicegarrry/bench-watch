import { prisma } from 'wasp/server'
import { ALL_AREA_SLUGS } from '../shared/constants'

/**
 * Dev-only action: promote the current user to Pro plan, mark as onboarded,
 * and add all 15 law areas so they can test the full pipeline.
 */
export const setupTestUser = async (_args: unknown, context: any): Promise<{ message: string }> => {
  if (!context.user) throw new Error('Not authenticated')

  const userId = context.user.id

  // Promote to pro + mark onboarded + reset run counter
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: 'pro',
      onboarded: true,
      dashboardRunsThisWeek: 0,
      dashboardRunsResetAt: new Date(),
    },
  })

  // Remove existing area selections and replace with all 15
  await prisma.userArea.deleteMany({ where: { userId } })

  await prisma.userArea.createMany({
    data: ALL_AREA_SLUGS.map((slug) => ({
      userId,
      areaSlug: slug,
      emailFrequency: 'weekly',
    })),
    skipDuplicates: true,
  })

  return { message: `User promoted to Pro with all 15 areas. Ready to test.` }
}
