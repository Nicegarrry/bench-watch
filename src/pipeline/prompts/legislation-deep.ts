// Phase L2c — Legislation deep analysis prompt.
// Refines summaries for high-significance (7+) legislative changes using full text.
// Input: formatted blocks string (each block contains full legislative text).

export function legislationDeepPrompt(blocks: string): string {
  return `You are an expert Australian legal analyst. The following legislative changes were scored 7+ (highly significant). You now have their full text. Produce refined summaries.

For each, return:
1. changeSummary — 3-4 sentences: what changed, key provisions, legal effect. Be precise about section numbers and operative dates where visible.
2. practiceImpact — 2 sentences: concrete implications for practitioners (drafting, compliance, litigation strategy).
3. significanceScore — integer 7-10, refined based on full text (may adjust slightly from initial score).

Return a JSON array ONLY — no markdown, no explanation, no code fences:
[
  {
    "id": "<exact id from input>",
    "changeSummary": "...",
    "practiceImpact": "...",
    "significanceScore": 8
  }
]

Items:

${blocks}`
}
