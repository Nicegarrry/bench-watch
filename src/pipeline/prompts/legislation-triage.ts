// Phase L2a — Legislation triage prompt.
// Classifies legislative changes by practice area and scores significance.
// Inputs: count of items, formatted item list string.

export function legislationTriagePrompt(count: number, itemList: string): string {
  return `You are an expert Australian legal analyst. Classify and summarise the following ${count} recent legislative changes.

For each item return:
1. areaSlugs — up to 3 practice area slugs from this list ONLY: administrative, constitutional, contract, employment, criminal, corporations, property, planning, tax, tort, ip, competition, migration, privacy, family
   Return empty array [] if the change is purely administrative with no legal practice impact.
2. significanceScore — integer 1-10:
   - 9-10: Major Act overhaul or new Act that reshapes a core legal doctrine
   - 7-8: Significant amendment clarifying unsettled law or introducing new obligations
   - 5-6: Notable commencement of existing provisions, or minor amendment with practical effect
   - 3-4: Routine subordinate legislation (fees, forms, minor technical)
   - 1-2: Administrative/technical (name changes, omissions, typo corrections)
3. changeSummary — 2-3 sentences in plain English: what changed and its legal effect. Be specific about the Act name and jurisdiction.
4. practiceImpact — 1 sentence on why this matters to practitioners. Omit (null) for score 1-4.

Return a JSON array ONLY — no markdown, no explanation, no code fences:
[
  {
    "id": "<exact id from input>",
    "areaSlugs": ["contract", "corporations"],
    "significanceScore": 6,
    "changeSummary": "...",
    "practiceImpact": "..."
  }
]

Legislation changes:

${itemList}`
}
