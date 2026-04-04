# Career Compass — 職涯羅盤

## Overview

Static SPA deployed to GitHub Pages. Progressive career exploration tool for teens (14-17) with 4-level disclosure: Discover → Plan → Evaluate → Decide. Three-layer ROI model surfaces at Level 3 as the culminating analytical tool. Data from BLS wages, College Scorecard tuition, and IPEDS.

## Tech Stack

- **Build**: Vite 6, Vanilla JS (ES modules)
- **Styles**: Pico CSS 2 + custom design tokens
- **Charts**: Chart.js 4 (Phase 3+)
- **PDF**: html2pdf.js, lazy-loaded (Phase 4+)
- **i18n**: Self-built JSON system (en / zh-TW)
- **Deploy**: GitHub Pages via Actions

## Commands

```bash
npm run dev      # Dev server
npm run build    # Production build → dist/
npm run preview  # Preview production build
npm test         # Run tests (vitest)
npm run test:watch  # Watch mode
```

## Architecture

```
src/
├── api/          # BLS + Scorecard + IPEDS + Profiles service layer
├── engine/       # Pure math: ROI (3-layer), NPV, IRR, breakeven, mappings
├── data/         # Static JSON (wages, tuition, ipeds, cip-soc-crosswalk, occupation-profiles)
├── i18n/         # Translation JSON + runtime (en / zh-TW)
├── router/       # Hash-based SPA router (supports afterRender + query params)
├── tracker/      # localStorage exploration tracker (tracker.js)
├── utils/        # Formatting helpers + shared export-pdf utility
├── views/        # Page components (render + optional afterRender)
│   ├── home.js           # Interest-based exploration entry (4 category cards)
│   ├── search.js         # Career search with interest filter chips
│   ├── profile.js        # 4-level progressive disclosure (Discover/Plan/Evaluate/Decide)
│   ├── detail.js         # ROI deep dive (wages, tuition, 3-layer ROI)
│   ├── detail-renderers.js  # Pure HTML renderers for detail panels
│   ├── detail-sliders.js    # Competition parameter slider wiring
│   ├── calculator.js     # 9-field ROI calculator + Chart.js
│   ├── compare.js        # 2-3 career side-by-side comparison
│   └── report.js         # Exploration report + export (Markdown/PDF/JSON)
├── styles/       # Design tokens + main.css + enhanced.css
├── app.js        # App init (router + i18n wiring)
└── main.js       # Vite entry point
tests/            # Vitest unit tests (140+)
```

## User Flow

```
Home (interest cards) → Search (filter chips + keyword) → Profile (#/profile/:soc)
  Level 1 (Discover): What They Do, Work Environment, Similar Occupations
  Level 2 (Plan): How to Become One [collapsed]
  Level 3 (Evaluate): Pay, Job Outlook, State Data [collapsed, lazy-loads wage data]
  Level 4 (Decide): More Info + ROI deep dive link [collapsed]
    → Detail (#/detail/:soc) → Calculator
                              → Compare (via nav Tools dropdown)
```

## Interest Groups (Home Page)

4 groups, multi-tagged (careers can appear in multiple):
- **build**: engineers, developers, trades (8 careers)
- **help**: healthcare, education, legal support (7 careers)
- **analyze**: data, finance, security, law (7 careers)
- **create**: design, media, marketing (5 careers)

## Notes

- Chart.js loaded via CDN script tag (esbuild can't parse npm dist on Windows NTFS)
- Views can export `{ render, afterRender }` — router calls afterRender after DOM insertion
- Detail→Calculator pre-fill uses query params in hash: `#/calculator?soc=...&tuition=...`
- Profile Level 3 lazy-loads wage data on `<details>` toggle (saves API calls for casual browsers)
- Tuition fallback by degree level when CIP-specific data unavailable (scorecard.js `getTuitionFallback`)
- Category gradients and growth badges styled via CSS custom properties (tokens.css + enhanced.css)

## API Keys

- Development: uses `DEMO_KEY` by default
- Production: set `VITE_BLS_API_KEY` and `VITE_SCORECARD_API_KEY` in `.env`
- BLS limit: 500 req/day; Scorecard limit: 1000 req/hour

## Conventions

- Hash routing (`#/path`) — no server config needed for GitHub Pages
- Views export `render(params)` → HTML string
- i18n keys: dot-notation (`nav.home`, `home.title`)
- DOM elements use `data-i18n` attribute for auto-translation
- Immutable data patterns — never mutate API responses
- All fetch calls go through service layer with in-memory caching

## Phase Plan

1. **Foundation** ✓
2. **Core Math** ✓
3. **UI Views** ✓
4. **Comparison + Report** ✓
5. **Polish + Deploy** ✓
6. **IPEDS + Three-Layer ROI** ✓
7. **Occupation Profile + Teen UI** ✓
8. **Career Explorer UX Pivot (Phase 1)** ✓ — rebrand to Career Compass/職涯羅盤, interest-based home page (build/help/analyze/create), search filter chips, 4-level progressive disclosure in profile, lazy-load Level 3 data
9. **O*NET API Integration** ✓ — knowledge, skills, education, certifications for Level 2
10. **ROI Quick View in Level 3** ✓ — inline ROI badges + shared career-data.js fetcher
11. **Assessment Report Export** ✓ — localStorage tracker, report view (#/report), Markdown + PDF + JSON export/import, shared export-pdf.js utility
12. **Polish** ✓ — a11y (focus management, ARIA labels, skip link), responsive report view, CI verified

## Three-Layer ROI Model

- **Layer 1 (Basic)**: `(totalPremium - totalCost) / totalCost`
- **Layer 2 (Risk-Adjusted)**: `graduationRate × basicROI`
- **Layer 3 (Competition-Adjusted)**: `riskAdjustedROI × (1 - saturationPenalty)`
- Saturation: `penalty = min(completions/employment × k, maxPenalty)`, defaults k=0.3, maxPenalty=0.25
- Graceful fallback: missing data → skip that layer, UI shows warning

## Data Files

- `src/data/wages.json` — BLS OES (25 SOC codes, includes tot_emp) [gitignored, CI-generated]
- `src/data/tuition.json` — College Scorecard (25 CIP codes, median tuition) [gitignored, CI-generated]
- `src/data/ipeds.json` — IPEDS graduation rates + curated completions [tracked]
- `src/data/cip-soc-crosswalk.json` — CIP→SOC mappings [tracked, hand-curated]
- `src/data/occupation-profiles.json` — BLS OOH career profiles, bilingual (25 SOC codes) [tracked, hand-curated]
