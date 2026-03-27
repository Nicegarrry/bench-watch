import { prisma } from 'wasp/server'
import { JADE_FEEDS } from './feedRegistry'
import { LEGISLATION_FEEDS } from './legislationFeedRegistry'

const LAW_AREAS = [
  { slug: 'administrative',      name: 'Administrative Law',          icon: '⚖️',  sortOrder: 1 },
  { slug: 'constitutional',      name: 'Constitutional Law',          icon: '📜',  sortOrder: 2 },
  { slug: 'contract',            name: 'Contract Law',                icon: '🤝',  sortOrder: 3 },
  { slug: 'employment',          name: 'Employment & Industrial',     icon: '👷',  sortOrder: 4 },
  { slug: 'criminal',            name: 'Criminal Law',                icon: '🔒',  sortOrder: 5 },
  { slug: 'corporations',        name: 'Corporations & Insolvency',   icon: '🏢',  sortOrder: 6 },
  { slug: 'property',            name: 'Property & Real Estate',      icon: '🏘️',  sortOrder: 7 },
  { slug: 'planning',            name: 'Planning & Environment',      icon: '🌿',  sortOrder: 8 },
  { slug: 'tax',                 name: 'Tax',                         icon: '💰',  sortOrder: 9 },
  { slug: 'tort',                name: 'Torts & Personal Injury',     icon: '🩺',  sortOrder: 10 },
  { slug: 'ip',                  name: 'Intellectual Property',       icon: '💡',  sortOrder: 11 },
  { slug: 'competition',         name: 'Competition & Consumer',      icon: '🏪',  sortOrder: 12 },
  { slug: 'migration',           name: 'Migration',                   icon: '✈️',  sortOrder: 13 },
  { slug: 'privacy',             name: 'Privacy & Information',       icon: '🔐',  sortOrder: 14 },
  { slug: 'family',              name: 'Family Law',                  icon: '👪',  sortOrder: 15 },
]

export async function seedAll(): Promise<void> {
  console.log('Seeding law areas...')
  for (const area of LAW_AREAS) {
    await prisma.lawArea.upsert({
      where: { slug: area.slug },
      update: { name: area.name, icon: area.icon, sortOrder: area.sortOrder, isActive: true },
      create: {
        slug: area.slug,
        name: area.name,
        icon: area.icon,
        sortOrder: area.sortOrder,
        isActive: true,
        searchTerms: [],
        catchwordPatterns: [],
      },
    })
  }
  console.log(`Seeded ${LAW_AREAS.length} law areas.`)

  console.log('Seeding RSS feed registry...')
  for (const feed of JADE_FEEDS) {
    await prisma.rssFeedRegistry.upsert({
      where: { courtCode: feed.courtCode },
      update: { feedUrl: feed.feedUrl, courtName: feed.courtName, tier: feed.tier, isActive: true },
      create: {
        courtCode: feed.courtCode,
        courtName: feed.courtName,
        source: 'jade',
        feedUrl: feed.feedUrl,
        tier: feed.tier,
        isActive: true,
      },
    })
  }
  console.log(`Seeded ${JADE_FEEDS.length} RSS feeds.`)

  console.log('Seeding legislation feed registry...')
  for (const feed of LEGISLATION_FEEDS) {
    // Use feedUrl as natural key since jurisdiction alone isn't unique (could have multiple feeds)
    const existing = await prisma.legislationFeedRegistry.findFirst({
      where: { feedUrl: feed.feedUrl },
    })
    if (existing) {
      await prisma.legislationFeedRegistry.update({
        where: { id: existing.id },
        data: {
          jurisdictionName: feed.jurisdictionName,
          feedType: feed.feedType,
          tier: feed.tier,
          isActive: true,
        },
      })
    } else {
      await prisma.legislationFeedRegistry.create({
        data: {
          jurisdiction: feed.jurisdiction,
          jurisdictionName: feed.jurisdictionName,
          feedUrl: feed.feedUrl,
          feedType: feed.feedType,
          tier: feed.tier,
          isActive: true,
        },
      })
    }
  }
  console.log(`Seeded ${LEGISLATION_FEEDS.length} legislation feeds.`)
}
