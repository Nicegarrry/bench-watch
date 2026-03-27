# BenchWatch — Product Roadmap: Features vs Modules

## How This Is Organised

**Feature Additions** = things that ship inside the existing BenchWatch product as new tabs, sections, or enhancements. Same subscription, more value. These make BenchWatch stickier and justify the Pro/Team price.

**New Modules** = standalone tools or add-ons with their own value proposition. Could be bundled with BenchWatch Pro or sold separately. Each has a distinct buyer moment ("I need this right now") beyond weekly case monitoring.

---

## FEATURE ADDITIONS (BenchWatch v2/v3)

### F1. Legislation Change Tracker
*"What's changed this week" — the other half of staying current*

Ships as a new section in the weekly digest and a new tab on the dashboard. Same infrastructure: poll Federal Register of Legislation + state parliamentary sites via RSS/scraping → AI summarises changes → filter to user's practice areas → include in weekly email alongside case digest.

**User sees:** "3 Acts amended, 2 new regulations, 1 Bill introduced affecting your areas this week" alongside their case digest. One product, complete picture.

**Build effort:** 2-3 weeks. RSS feeds exist for most legislative sources.
**Revenue:** Bundled into Pro. Increases conversion and retention.

---

### F2. Practice Area Trend Reports — Monthly "State of the Law"
*AI-generated thought leadership per practice area*

Monthly long-form report (3000-5000 words) per area: "The State of Administrative Law: March 2026." Synthesises all decisions from the month, identifies themes, flags emerging trends, notes divergences between states. Generated from BenchWatch's accumulated case data using Claude Opus for depth.

Ships as a "Reports" tab in the dashboard (currently greyed out as "Coming Soon"). Monthly email to subscribers. Downloadable PDF.

**Build effort:** 2 weeks once case data is accumulating.
**Revenue:** Pro feature. Could also be a standalone premium add-on ($49/month for non-BenchWatch users). Content marketing flywheel — reports get shared and drive signups.

---

### F3. Regulatory Enforcement Tracker
*ASIC, ACCC, APRA, OAIC, ATO, Fair Work — all in one feed*

New section in the weekly digest. Scrape enforcement actions from regulator websites (media releases, enforcement action registers, court filings). AI categorises by: regulator, industry, type of breach, penalty, practice area.

**User sees:** "This week: ASIC filed 2 civil penalty proceedings (corporations), ACCC accepted 1 court-enforceable undertaking (competition), Fair Work Ombudsman commenced prosecution (employment)" — filtered to their areas.

**Build effort:** 3-4 weeks. Regulator websites are well-structured.
**Revenue:** Bundled into Pro. Expands appeal to compliance officers and in-house counsel (new buyer personas within same subscription).

---

### F4. Citation Network & Case Treatment (Basic)
*How has this case been treated since it was decided?*

Enhancement to every case card in BenchWatch. Below each case analysis, show: "This case has been cited 3 times since its decision. Applied in [case], distinguished in [case]." Builds over time as BenchWatch accumulates more data.

Phase 1: Just show forward citations from BenchWatch's own database.
Phase 2: Ingest historical citation data from AustLII's LawCite (public).
Phase 3: AI analysis of treatment ("This decision is being consistently followed" vs "There's emerging disagreement in the Victorian Court of Appeal").

**Build effort:** Phase 1: 2 weeks. Phase 2-3: ongoing.
**Revenue:** Pro feature. This is the long-term moat — gets more valuable every week.

---

### F5. Legal News Aggregator & Analyser
*One feed for all Australian legal news, deduplicated and analysed*

New tab: "News." Aggregates from law firm blogs, AFR legal, Lawyers Weekly, Law Society journals, court media releases, regulator announcements. AI deduplicates and categorises by practice area. Cross-references with BenchWatch case data ("This article discusses EGH19 — here's our full analysis").

Weekly digest includes a "News highlights" section alongside cases and legislation.

**Build effort:** 3 weeks. RSS feeds exist for most sources.
**Revenue:** Bundled into Pro. Reduces the 6+ email subscriptions lawyers currently manage.

---

## NEW MODULES (Standalone / Add-Ons)

### M1. Bench & Practice Reference
*AI-searchable bench books + practice notes, always current*

Combines three concepts into one module:
- **Bench books:** Ingest all publicly available bench books (NSW Judicial Commission Criminal Trial, Sentencing, Civil Trials; Victorian Judicial College; QLD Benchbook). Build a unified, AI-searchable interface. "What are the model jury directions for self-defence in NSW?" → instant answer with source reference.
- **Practice notes:** Monitor and alert on changes to court practice notes, practice directions, and procedural rules across all jurisdictions. "The Federal Court amended Practice Note IP-1 on 15 March — here's what changed."
- **Court rules reference:** Searchable database of court rules with AI explanation. "What's the time limit for filing a defence in the Federal Court?" → answer with rule reference.

**The value:** Currently lawyers use 5+ different websites to find this information, and they miss practice note updates regularly (which causes procedural errors and costs orders against their clients).

**Build effort:** 6-8 weeks for MVP. Content ingestion is the main work.
**Revenue:** Separate subscription ($19/month) or bundled with BenchWatch Team. Very sticky once adopted — becomes the daily reference tool.

---

### M2. Judicial Officer Intelligence
*Know your bench before you walk into court*

Standalone profiles for every judge and magistrate across target courts. Built from BenchWatch's case database + public biographical sources.

**Each profile shows:**
- Recent decisions (with BenchWatch analysis links)
- Practice areas they typically sit in
- Appointment date, background, notable speeches
- Decision patterns: average time to judgment, appeal rate
- For criminal: sentencing range visualisations by offence type
- Writing style notes (concise vs detailed, tendency to cite HCA authority, etc.)

**The moment:** Barrister gets allocated Justice X for a hearing next Tuesday. Opens BenchWatch Judicial Intelligence, reviews their recent decisions in similar matters, adjusts strategy accordingly.

**Build effort:** 4-6 weeks for MVP. Gets richer over time automatically.
**Revenue:** Premium add-on ($29/month on top of BenchWatch) or included in Team plan. High willingness to pay among barristers and senior litigators.

---

### M3. My Hearings Watchlist
*Track your matters through the court system*

Simple, focused tool for practitioners to track their active matters:
- Add a case by citation or party name
- BenchWatch monitors court lists daily for listings (hearing dates, mention dates)
- Alerts: "Smith v Jones is listed for hearing before Justice X on 14 April in Court 4B"
- Cross-references with BenchWatch case analysis if a related decision is handed down
- Shows filing deadlines based on court rules + matter type (the deadline calculator integrated)
- Calendar integration (iCal/Google Calendar export)

**Build effort:** 4 weeks. Court list scraping is the main technical challenge.
**Revenue:** Free for 3 matters, Pro for unlimited. Low direct revenue but very high engagement and retention — practitioners check this daily.

---

### M4. Expert Witness Directory
*Who testified, where, and how was their evidence received?*

Scrape court judgments for references to expert witnesses. Build profiles:
- Name, qualifications, field of expertise
- Courts appeared in, how many times
- How their evidence was treated (accepted, rejected, qualified, preferred over competing expert)
- Judges who have heard their evidence
- AI-generated reliability summary

**The moment:** Lawyer needs a structural engineering expert for a building defects case. Searches BenchWatch Expert Directory, finds 3 experts who've given evidence in similar NSW cases, sees that Expert A has been accepted 12/12 times while Expert B was criticised in their last two appearances.

**Build effort:** 6-8 weeks. NLP extraction from judgments is the main challenge.
**Revenue:** Separate subscription ($19/month) or bundled with Team. Also potential for expert witnesses to pay for "claimed" profiles (marketplace revenue).

---

### M5. Pro Bono Matching Marketplace
*Connect matters that need help with lawyers who want to give it*

Two-sided marketplace:
- **Supply side:** Practitioners register their pro bono availability, practice areas, jurisdiction, and capacity (hours/month)
- **Demand side:** Community legal centres, legal aid, individuals post matters needing pro bono assistance (matter type + jurisdiction + urgency, no sensitive details)
- AI matches based on practice area fit, jurisdiction, availability
- Referral tracking: how many hours donated, matters completed

**Build effort:** 6-8 weeks. More product/UX than technical.
**Revenue:** Free for practitioners (goodwill, builds community). Revenue from CLCs/Legal Aid (subscription for posting and managing referrals) or sponsorship from law societies. Long-term: connects to BenchWatch's user base as a retention and brand tool.

---

### M6. Law Reform & Consultation Tracker
*What's being proposed, who's asking, and when to respond*

Track ALRC reports, state law reform commission papers, Treasury consultations, ACCC market studies, parliamentary inquiries. AI summarises: what's proposed, which practice areas are affected, submission deadline, likely legislative timeline.

**The moment:** "The ALRC just released a discussion paper on class action reform. Submissions close 30 April. Here's a summary of the 12 proposals and which ones affect your practice."

**Build effort:** 3-4 weeks. Government consultation registers are well-structured.
**Revenue:** Bundled with Pro or standalone for policy/government lawyers. Niche but high-value audience (in-house counsel, government lawyers, law reform specialists).

---

### M7. Legal Forms & Precedent Finder
*Every public court form, in one searchable place*

Index all publicly available court forms, templates, and procedural checklists across all Australian jurisdictions. Currently scattered across 20+ court websites with inconsistent naming and organisation.

- Search: "Notice of appeal Federal Court" → direct link to correct form + filing instructions
- AI explains which form to use for which situation
- Alerts when forms are updated or superseded
- Checklists: "Filing a Federal Court appeal: 7 steps with form references"

**Build effort:** 4-6 weeks. Content curation is the main work.
**Revenue:** Free tier (drives traffic and signups). Pro feature: AI form guidance and filing checklists.

---

## Summary View

### Feature Additions (inside BenchWatch)

| # | Feature | Ships In | Effort | Revenue Impact |
|---|---------|----------|--------|----------------|
| F1 | Legislation Change Tracker | v2 | 2-3 weeks | Pro conversion + retention |
| F2 | Practice Area Trend Reports | v2 | 2 weeks | Pro feature / premium add-on |
| F3 | Regulatory Enforcement Tracker | v2 | 3-4 weeks | Pro + new buyer personas |
| F4 | Citation Network (basic) | v3 | 2+ weeks | Pro feature / long-term moat |
| F5 | Legal News Aggregator | v3 | 3 weeks | Pro / reduces churn |

### New Modules (standalone / add-ons)

| # | Module | Effort | Revenue Model | Priority |
|---|--------|--------|--------------|----------|
| M1 | Bench & Practice Reference | 6-8 weeks | $19/mo or Team bundle | High |
| M2 | Judicial Officer Intelligence | 4-6 weeks | $29/mo add-on or Team | High |
| M3 | My Hearings Watchlist | 4 weeks | Free/Pro gating | High (engagement) |
| M4 | Expert Witness Directory | 6-8 weeks | $19/mo + marketplace | Medium |
| M5 | Pro Bono Matching | 6-8 weeks | CLC subscriptions / brand | Medium-Low |
| M6 | Law Reform Tracker | 3-4 weeks | Pro bundle | Medium |
| M7 | Legal Forms Finder | 4-6 weeks | Free tier + Pro AI features | Medium |

### Suggested Build Sequence

**Phase 1 (Month 1-2):** BenchWatch core (now) → F1 Legislation Tracker
**Phase 2 (Month 3-4):** F2 Trend Reports → F3 Enforcement Tracker → M3 Hearings Watchlist
**Phase 3 (Month 5-6):** M1 Bench & Practice Reference → M2 Judicial Intelligence → F4 Citation Network
**Phase 4 (Month 7+):** M4 Expert Witness → F5 News Aggregator → M6 Law Reform → M5 Pro Bono → M7 Forms
