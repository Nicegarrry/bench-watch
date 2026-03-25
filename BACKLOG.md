# BenchWatch — Pipeline Backlog

## Fix immediately (after current run)

### JSON parsing — code fences
Claude returns ```json ... ``` despite being told not to. Add `extractJson()` helper to strip fences before `JSON.parse`. Apply to triage.ts, caseAnalysis.ts, userDigests.ts. Also fix `✓` log in caseAnalysis.ts — currently prints even on parse failure (analyseCase returns early without throwing).

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

### Significance rubric calibration
The 5 cases selected as top this week (FCAFC 26/25/23, NSWCCA 27, WASCA 37) suggest the AI isn't distinguishing between routine full-court decisions and genuinely significant ones. Review and tighten the rubric. Consider:
- Requiring justification to include whether the decision clarifies previously unsettled law
- Flagging when HCA or constitutional matters appear — these should almost always rank top
- Adding a "novelty" flag: is this a first-instance decision on this point, or one of many?

### Surface the EGH case
Investigate why the EGH HCA case this week wasn't surfaced. Check:
- Was it in the JADE RSS feed? (HCA main feed, not HCASJ)
- Did it get a citation and austliiUrl?
- What significance score did it receive from triage?
- Was it tagged with the correct area?
This will tell us if it's a discovery bug, a triage scoring bug, or a prioritisation bug.

---

## Future / longer term

### Law area tag review
Unsure what area tags are being applied. Need to see a breakdown of tags per court this run — are migration cases being tagged as migration? Are constitutional cases being caught? Build a simple view in the dev console showing tag distribution.

### Idempotency hardening
Currently re-runs of triage will skip already-analysed cases (caseAnalysis: null check). But if a case fails JSON parsing, it has no analysis record and will be retried — this is correct. Verify this works end-to-end.

### HCA feed check
The 79-case run had 0 HCA full-court cases (only 3 HCASJ single-justice). Either: no HCA full-court decisions this week (possible), or the HCA feed URL isn't returning recent items. Check `au-hca.xml` feed directly to verify.

### HCASJ austliiUrl fix
3 HCASJ cases have null austliiUrl. Likely the HCASJ feed uses citation format that doesn't match our AUSTLII_COURT_PATHS regex. Low priority (single justice = low significance) but worth fixing for completeness.
