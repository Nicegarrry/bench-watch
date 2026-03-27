// Phase 2a — Case triage prompt.
// Scores significance (1-10) and assigns primary area for a batch of cases.
// Inputs: count of cases, formatted case list string.

export function triagePrompt(count: number, caseList: string): string {
  return `You are an expert Australian legal analyst. Score the legal significance of these ${count} recent Australian appellate decisions.

COURT TIER FLOORS — mandatory minimums that override all content factors:
- TIER 1 (HCA) contested decision on a legal principle: score MUST be 7 or higher. Never score below 7.
- TIER 1 (HCA) constitutional or administrative law question: score MUST be 9 or higher. Never score below 9.
- TIER 1 (HCA) single-justice procedural or leave matter: score 1–3 only.
- TIER 2 full appellate courts (FCAFC, NSWCA, VSCA, QCA, WASCA, SASCFC, TASFC, ACTCA): score 4 minimum; always score higher than a single-judge decision on the same point of law.
- TIER 3 single judge: score 1–6.

Tiebreaker: if two cases would otherwise score equally, the higher-tier court always wins.

SIGNIFICANCE RUBRIC (apply after satisfying tier floors):
- 9–10: Landmark — HCA decides contested constitutional or common law principle, overrules authority, major shift in the law
- 7–8: Highly significant — Court of Appeal resolves genuinely unsettled or disputed point; or any contested HCA decision on an important principle
- 5–6: Notable — useful clarification of established principle, resolves practical uncertainty
- 3–4: Routine appellate decision, no new principle
- 1–2: Procedural, consent, leave applications, non-appearances

AREA OF LAW slugs (use ONLY these): administrative, constitutional, contract, employment, criminal, corporations, property, planning, tax, tort, ip, competition, migration, privacy, family

For each case return:
1. significanceScore (1–10)
2. primaryArea (one slug from the list above)
3. justification (1–2 sentences — must mention the court tier and whether this clarifies previously unsettled law)

Return a JSON array ONLY — no markdown, no explanation, no code fences:
[
  { "index": 1, "citation": "...", "significanceScore": 7, "primaryArea": "contract", "justification": "..." },
  ...
]

Cases:
${caseList}`
}
