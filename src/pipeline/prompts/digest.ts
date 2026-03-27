// Phase 3 — Per-user digest prompt.
// Ranks and selects top cases from pre-analysed pool based on user's practice areas.
// Inputs: user areas (comma-joined), case count, formatted cases text.

export function digestPrompt(userAreas: string, count: number, casesText: string): string {
  return `You are curating a weekly legal intelligence digest for an Australian legal practitioner. Their primary areas of interest are: ${userAreas}.

From the ${count} analysed cases, select and rank:
- Top 3-5 cases: most significant and relevant to the user's areas. Quality over quantity — 3 strong beats 5 weak. Never include a sub-5 case for coverage.
- Next 15 cases: remaining notable cases in order of significance with one-line summaries.

Ranking rules:
- Absolute significance dominates (a 9 always beats a 6)
- HCA decisions (Tier 1) are presumptively more significant than equivalent-scored lower court decisions
- Within 2 significance points, prefer diversity across areas
- Flag if top cases cluster in one area

Return JSON ONLY — no markdown, no explanation, no code fences:
{
  "digestSummary": "2-3 sentence overview of this week's legal landscape for these practice areas",
  "topCases": [
    {
      "citation": "...",
      "rank": 1,
      "factsSummary": "...",
      "legalAnalysis": "...",
      "whyItMatters": "...",
      "significanceScore": <1-10>,
      "primaryArea": "..."
    }
  ],
  "extendedCases": [
    {
      "citation": "...",
      "rank": 6,
      "significanceScore": <1-10>,
      "primaryArea": "...",
      "oneLineSummary": "One sentence: what was decided and why it matters"
    }
  ]
}

Cases to assess:
${casesText}`
}
