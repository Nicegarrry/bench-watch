# BenchWatch — Pipeline Backlog

### Web search — case analysis (Phase 2c)
Add Anthropic `web_search_20250305` tool to the case analysis call for judgment-text cases (score 7+). Prompt Claude to search for news coverage and law firm commentary before writing the analysis. Handle tool-use response blocks properly (loop until final text block).

### Web search — cross-prioritisation (Phase 3)
Add web search to the user digest / cross-prioritisation call too. Major cases generate significant coverage — Claude should factor in how widely reported a case is when ranking. A case covered by AFR, law firms, and ABC is almost certainly more significant than one that isn't.

---

## Prioritisation quality (important)

### Court hierarchy in triage prompt
Current triage prompt doesn't explicitly weight courts. HCA decisions are almost always more significant than equivalent-scoring FCA or state CoA decisions. The EGH case (HCA, this week) should have been #1 — it wasn't even surfaced as top 5. Fix:
- Add explicit court weighting to the triage significance rubric: HCA contested decisions start at 7, HCA constitutional questions start at 9
- Add a note that Full Courts (FCAFC, VSCA, NSWCA, QCA, WASCA) generally rank above single-judge decisions
- Add court tier to the triage prompt input so Claude can see it

### AI output audit & coaching — case analysis and digest (Phase 2c + 3)
Walk through real examples end-to-end to evaluate quality of the case analysis and digest steps. For each step:
- Compare AI output against a manually written "gold standard" for the same case
- Identify systematic gaps: missing legal context, weak "why it matters" sections, poor area classification, digest ranking errors
- Use the examples to rewrite the prompts with explicit coaching instructions and worked examples (few-shot)
- Reassess max token limits and truncation — are we cutting off judgment text before the key holding?

### Case card sections — audit and revise
Review what sections are shown per case in the UI and whether they're the right ones. Questions to resolve:
- Is `facts_summary` useful to practitioners or redundant given catchwords?
- Should `classification_reasoning` be visible or stay internal?
- Are `secondary_areas` surfaced anywhere — should they be?
- Consider a collapsed/expanded model: show `why_it_matters` + score upfront, rest on expand

### Counsel and judge tagging
Parse and store counsel (barristers) and judges from each decision. Solicitors not needed — barristers and judges only.

**Data model additions:**
- `case_counsel` table: `case_id`, `name`, `role` (appearing/respondent counsel), `firm` if parseable
- `case_judges` table: `case_id`, `name`, `title` (e.g. Kiefel CJ, Gageler J)
- Source: parse the appearing counsel and bench sections from the AustLII HTML (already fetched in Phase 2b)

**UI:**
- Show judge panel and counsel on each case card (barristers only, not solicitors)
- Add profile pages or filter: "cases involving [barrister name]" — useful for practitioners tracking their own matters or following a silk's work
- Consider a "Bench" badge on the card showing the panel (e.g. Kiefel CJ, Gageler J, Edelman J)

### Significance rubric calibration
The 5 cases selected as top this week (FCAFC 26/25/23, NSWCCA 27, WASCA 37) suggest the AI isn't distinguishing between routine full-court decisions and genuinely significant ones. Review and tighten the rubric. Consider:
- Requiring justification to include whether the decision clarifies previously unsettled law
- Flagging when HCA or constitutional matters appear — these should almost always rank top
- Adding a "novelty" flag: is this a first-instance decision on this point, or one of many?


---

## Future / longer term

### Law area tag review
Unsure what area tags are being applied. Need to see a breakdown of tags per court this run — are migration cases being tagged as migration? Are constitutional cases being caught? Build a simple view in the dev console showing tag distribution.

### Idempotency hardening
Currently re-runs of triage will skip already-analysed cases (caseAnalysis: null check). But if a case fails JSON parsing, it has no analysis record and will be retried — this is correct. Verify this works end-to-end.


### HCASJ austliiUrl fix
3 HCASJ cases have null austliiUrl. Likely the HCASJ feed uses citation format that doesn't match our AUSTLII_COURT_PATHS regex. Low priority (single justice = low significance) but worth fixing for completeness.
