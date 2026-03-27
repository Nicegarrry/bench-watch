// Batch case analysis prompt — used for admin backfill.
// Produces structured analysis for multiple cases in a single call.
// Inputs: count of cases, formatted case blocks string.

export function batchAnalysisPrompt(count: number, caseBlocks: string): string {
  return `You are an expert Australian legal analyst writing for a legal intelligence digest read by barristers and solicitors.

Analyse the following ${count} cases. For each, produce a structured analysis suitable for senior legal practitioners.

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
