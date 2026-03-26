export const ALL_AREA_SLUGS = [
  'administrative', 'constitutional', 'contract', 'employment', 'criminal',
  'corporations', 'property', 'planning', 'tax', 'tort', 'ip',
  'competition', 'migration', 'privacy', 'family',
] as const

export type AreaSlug = typeof ALL_AREA_SLUGS[number]
