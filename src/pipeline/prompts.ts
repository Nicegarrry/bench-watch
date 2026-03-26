// All AI prompt builder functions for the BenchWatch pipeline.

export type TriageCase = {
  index: number
  citation: string
  caseName: string
  court: string
  courtTier: 1 | 2 | 3  // 1 = HCA, 2 = Full/intermediate appellate, 3 = single judge
  catchwords: string | null
  decisionDate: string
}

export type TriageResult = {
  index: number
  citation: string
  significanceScore: number
  primaryArea: string
  justification: string
}

export function buildTriagePrompt(cases: TriageCase[]): string {
  const caseList = cases
    .map(
      (c) =>
        `${c.index}. [TIER ${c.courtTier}] ${c.citation} — ${c.caseName} (${c.court}, ${c.decisionDate})\n   Catchwords: ${c.catchwords ?? 'none provided'}`
    )
    .join('\n\n')

  return `You are an expert Australian legal analyst. Score the legal significance of these ${cases.length} recent Australian appellate decisions.

COURT TIER SYSTEM (critical for scoring):
- Tier 1 — High Court of Australia: Start significance at 7 minimum for contested decisions. Constitutional questions start at 9. HCA single justice leave applications are typically 1-3.
- Tier 2 — Full/intermediate appellate courts (FCAFC, NSWCA, VSCA, QCA, WASCA, SASCFC, TASFC, ACTCA): Range 4-8 depending on legal novelty.
- Tier 3 — Single judge: Range 2-6.

SIGNIFICANCE RUBRIC:
- 9-10: Landmark — HCA decides contested constitutional or common law principle, overrules authority, major shift
- 7-8: Highly significant — Court of Appeal resolves genuinely unsettled or disputed point; HCA contested decision on important principle
- 5-6: Notable — useful clarification of established principle, resolves practical uncertainty
- 3-4: Routine appellate decision, no new principle
- 1-2: Procedural, consent, leave applications, non-appearances

AREA OF LAW slugs (use ONLY these): administrative, constitutional, contract, employment, criminal, corporations, property, planning, tax, tort, ip, competition, migration, privacy, family

For each case return:
1. significanceScore (1-10, using court tier as a floor)
2. primaryArea (one slug from the list above)
3. justification (1-2 sentences — must mention whether this clarifies previously unsettled law)

Return a JSON array ONLY — no markdown, no explanation, no code fences:
[
  { "index": 1, "citation": "...", "significanceScore": 7, "primaryArea": "contract", "justification": "..." },
  ...
]

Cases:
${caseList}`
}

export type BatchAnalysisCase = {
  citation: string
  caseName: string
  court: string
  catchwords: string | null
  judgmentExcerpt: string | null
}

export function buildBatchAnalysisPrompt(cases: BatchAnalysisCase[]): string {
  const EXCERPT_LIMIT = 1500

  const caseBlocks = cases
    .map((c, i) => {
      const excerpt = c.judgmentExcerpt
        ? `Judgment excerpt:\n${c.judgmentExcerpt.slice(0, EXCERPT_LIMIT)}${c.judgmentExcerpt.length > EXCERPT_LIMIT ? '…' : ''}`
        : `No judgment text available. Base analysis on catchwords only.`
      return `--- CASE ${i + 1} ---
Citation: ${c.citation}
Case Name: ${c.caseName}
Court: ${c.court}
Catchwords: ${c.catchwords ?? 'none provided'}
${excerpt}`
    })
    .join('\n\n')

  return `You are an expert Australian legal analyst writing for a legal intelligence digest read by barristers and solicitors.

Analyse the following ${cases.length} cases. For each, produce a structured analysis suitable for senior legal practitioners.

Output a JSON array ONLY — no markdown, no explanation, no code fences. Each element must use this exact schema:
{
  "citation": "<must match the input Citation exactly>",
  "factsSummary": "2-3 paragraph summary of key facts and procedural history",
  "legalAnalysis": "2-3 paragraph analysis of the legal principles applied, their significance, and how this fits into the existing legal framework",
  "whyItMatters": "1-2 sentences on the practical implications for practitioners",
  "significanceScore": <integer 1-10>,
  "scoreJustification": "1-2 sentences — must mention whether this clarifies previously unsettled law",
  "primaryArea": "<one slug from: administrative, constitutional, contract, employment, criminal, corporations, property, planning, tax, tort, ip, competition, migration, privacy, family>",
  "secondaryAreas": ["<slug from same list — empty array if none>"],
  "classificationReasoning": "Brief explanation of area classification"
}

Significance rubric:
- 9-10: Landmark — HCA decides contested constitutional or common law principle, overrules authority
- 7-8: Highly significant — Court of Appeal resolves genuinely unsettled or disputed point
- 5-6: Notable — useful clarification, resolves practical uncertainty
- 3-4: Routine appellate decision, no new principle
- 1-2: Procedural, consent, leave applications, non-appearances

Cases:

${caseBlocks}`
}

export type AnalysisInput = {
  citation: string
  caseName: string
  court: string
  catchwords: string | null
  judgmentExcerpt: string | null
  useWebSearch: boolean
}

export function buildCaseAnalysisPrompt(c: AnalysisInput): string {
  const textSection = c.judgmentExcerpt
    ? `Judgment excerpt (first ~3000 chars):\n${c.judgmentExcerpt}`
    : `No judgment text available. Base your analysis on the catchwords only. Note this limitation clearly in your analysis.`

  const searchInstruction = c.useWebSearch
    ? `\nIMPORTANT: Use web search to find news coverage, law firm updates, and academic commentary on this case before writing your analysis. Major decisions will have coverage in the AFR, ABC, law firm client alerts, and legal publications. This coverage is a signal of significance and may reveal context not in the judgment excerpt.`
    : ''

  return `You are an expert Australian legal analyst writing for a legal intelligence digest read by barristers and solicitors.${searchInstruction}

Case: ${c.citation} — ${c.caseName}
Court: ${c.court}
Catchwords: ${c.catchwords ?? 'none provided'}

${textSection}

Provide a structured analysis suitable for senior legal practitioners. Return JSON ONLY — no markdown, no explanation, no code fences:
{
  "factsSummary": "2-3 paragraph summary of the key facts and procedural history",
  "legalAnalysis": "2-3 paragraph analysis of the legal principles applied, their significance, and how this fits into the existing legal framework",
  "whyItMatters": "1-2 sentences on the practical implications for practitioners",
  "significanceScore": <integer 1-10>,
  "scoreJustification": "1-2 sentences — must mention whether this clarifies previously unsettled law",
  "primaryArea": "<slug from: administrative, constitutional, contract, employment, criminal, corporations, property, planning, tax, tort, ip, competition, migration, privacy, family>",
  "secondaryAreas": ["<slug — MUST be from the same list above, or empty array if none>"],
  "classificationReasoning": "Brief explanation of area classification"
}`
}

export type DigestCase = {
  citation: string
  caseName: string
  court: string
  courtTier: 1 | 2 | 3
  factsSummary: string
  legalAnalysis: string
  whyItMatters: string
  significanceScore: number
  primaryArea: string
}

export type DigestInput = {
  userAreas: string[]
  cases: DigestCase[]
}

export function buildDigestPrompt(input: DigestInput): string {
  // Truncate each field to keep the prompt within token limits.
  // The digest step is ranking/selecting only — full analysis text is not needed here.
  // Phase 2c already ran web search and enriched the analyses.
  const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s

  const casesText = input.cases
    .map(
      (c, i) =>
        `Case ${i + 1}: [TIER ${c.courtTier}] ${c.citation} — ${c.caseName}
Court: ${c.court} | Area: ${c.primaryArea} | Significance: ${c.significanceScore}/10
Summary: ${truncate(c.factsSummary, 200)}
Why it matters: ${truncate(c.whyItMatters, 150)}`
    )
    .join('\n\n')

  return `You are curating a weekly legal intelligence digest for an Australian legal practitioner. Their primary areas of interest are: ${input.userAreas.join(', ')}.

From the ${input.cases.length} analysed cases, select and rank:
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
