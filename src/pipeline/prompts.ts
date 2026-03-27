// All AI prompt builder functions for the BenchWatch pipeline.
// Prompt text lives in ./prompts/ — one file per prompt for easy editing.

import { triagePrompt } from './prompts/triage'
import { batchAnalysisPrompt } from './prompts/batch-analysis'
import { caseAnalysisPrompt, WEB_SEARCH_INSTRUCTION } from './prompts/case-analysis'
import { legislationTriagePrompt } from './prompts/legislation-triage'
import { legislationDeepPrompt } from './prompts/legislation-deep'
import { digestPrompt } from './prompts/digest'

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

  return triagePrompt(cases.length, caseList)
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

  return batchAnalysisPrompt(cases.length, caseBlocks)
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

  const searchInstruction = c.useWebSearch ? WEB_SEARCH_INSTRUCTION : ''

  return caseAnalysisPrompt(
    c.citation,
    c.caseName,
    c.court,
    c.catchwords ?? 'none provided',
    textSection,
    searchInstruction,
  )
}

// ── Legislation prompts ───────────────────────────────────────────────────────

export type LegislationTriageItem = {
  id: string
  title: string
  jurisdiction: string
  changeType: string
  feedSummary: string | null
}

export type LegislationTriageResult = {
  id: string
  areaSlugs: string[]          // up to 3 matching practice areas
  significanceScore: number    // 1-10
  changeSummary: string        // 2-3 sentences: what changed
  practiceImpact: string | null // 1 sentence: why it matters (score 5+ only)
}

export function buildLegislationTriagePrompt(items: LegislationTriageItem[]): string {
  const itemList = items
    .map(
      (item) =>
        `ID: ${item.id}\nTitle: ${item.title}\nJurisdiction: ${item.jurisdiction.toUpperCase()}\nType: ${item.changeType}\nDescription: ${item.feedSummary ?? 'none provided'}`
    )
    .join('\n\n---\n\n')

  return legislationTriagePrompt(items.length, itemList)
}

export type LegislationDeepAnalysisItem = {
  id: string
  title: string
  jurisdiction: string
  fullText: string
  existingSummary: string
}

export type LegislationDeepAnalysisResult = {
  id: string
  changeSummary: string
  practiceImpact: string
  significanceScore: number
}

export function buildLegislationDeepAnalysisPrompt(items: LegislationDeepAnalysisItem[]): string {
  const blocks = items
    .map(
      (item) =>
        `ID: ${item.id}
Title: ${item.title}
Jurisdiction: ${item.jurisdiction.toUpperCase()}
Initial summary: ${item.existingSummary}

Full text excerpt:
${item.fullText.slice(0, 3000)}${item.fullText.length > 3000 ? '\n[truncated]' : ''}`
    )
    .join('\n\n===\n\n')

  return legislationDeepPrompt(blocks)
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

  return digestPrompt(input.userAreas.join(', '), input.cases.length, casesText)
}
