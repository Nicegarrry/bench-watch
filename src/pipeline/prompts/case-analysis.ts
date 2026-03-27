// Phase 2c — Individual case analysis prompt.
// Deep analysis per case; optionally uses web search for high-significance cases.
// Inputs: case metadata, judgment text section, optional web search instruction.

export const WEB_SEARCH_INSTRUCTION =
  `\nIMPORTANT: Use web search to find news coverage, law firm updates, and academic commentary on this case before writing your analysis. Major decisions will have coverage in the AFR, ABC, law firm client alerts, and legal publications. This coverage is a signal of significance and may reveal context not in the judgment excerpt.`

export function caseAnalysisPrompt(
  citation: string,
  caseName: string,
  court: string,
  catchwords: string,
  textSection: string,
  searchInstruction: string,
): string {
  return `You are an expert Australian legal analyst writing for a legal intelligence digest read by barristers and solicitors.${searchInstruction}

Case: ${citation} — ${caseName}
Court: ${court}
Catchwords: ${catchwords}

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
