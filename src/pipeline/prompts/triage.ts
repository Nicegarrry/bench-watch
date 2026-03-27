// Phase 2a — Case triage prompt.
// Scores significance (1-10) and assigns primary area for a batch of cases.
// Inputs: count of cases, formatted case list string.

export function triagePrompt(count: number, caseList: string): string {
  return `You are an expert Australian legal analyst. Score the legal significance of these ${count} recent Australian appellate decisions.

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
