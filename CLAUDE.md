# Career Compass — 職涯羅盤

## Overview

Static SPA deployed to GitHub Pages. Progressive career exploration tool for teens (14-17) with 4-level disclosure: Discover → Plan → Evaluate → Decide. Three-layer ROI model surfaces at Level 3 as the culminating analytical tool. Data from BLS wages, College Scorecard tuition, and IPEDS.

## Tech Stack

- **Build**: Vite 6, Vanilla JS (ES modules)
- **Styles**: Pico CSS 2 + custom design tokens
- **Charts**: Chart.js 4, lazy-loaded from CDN on demand (load-chart.js)
- **PDF**: html2pdf.js, lazy-loaded from CDN (Phase 4+)
- **i18n**: Self-built JSON system (en / zh-TW)
- **Theme**: Dark/light mode (theme.js) — toggle, prefers-color-scheme auto-detect, localStorage persistence
- **PWA**: manifest.json + compass PNG assets in public/
- **Deploy**: GitHub Pages via Actions

## Commands

```bash
npm run dev           # Dev server
npm run build         # Generate freshness badge + production build → dist/
npm run preview       # Preview production build
npm test              # Run tests (vitest)
npm run test:watch    # Watch mode
npm run refresh-data  # Re-fetch all 5 data sources (needs API keys in env)
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
├── utils/        # Formatting helpers, shared export-pdf, glossary tooltips
├── views/        # Page components (render + optional afterRender)
│   ├── home.js           # Interest-based exploration entry (4 category cards)
│   ├── search.js         # Career search with interest filter chips
│   ├── profile.js        # 4-level progressive disclosure (Discover/Plan/Evaluate/Decide)
│   ├── detail.js         # ROI deep dive orchestrator (thin: delegates to sub-modules)
│   ├── detail-chart.js      # Breakeven chart (cost vs. earnings crossover)
│   ├── detail-renderers.js  # Pure HTML renderers for detail panels
│   ├── detail-sliders.js    # Competition parameter slider wiring
│   ├── calculator.js     # 9-field ROI calculator + Chart.js
│   ├── compare.js        # 2-3 career side-by-side comparison
│   └── report.js         # Exploration report + export (Markdown/PDF/JSON)
├── styles/       # Design tokens + main.css + enhanced.css
├── app.js        # App init (router + i18n wiring)
└── main.js       # Vite entry point
tests/            # Vitest unit tests (214+)
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
- **build**: engineers, developers, trades, protective (14 careers)
- **help**: healthcare, education, community, protective (21 careers)
- **analyze**: data, finance, security, science, law (14 careers)
- **create**: design, media, marketing, culinary (9 careers)

## Notes

- Chart.js lazy-loaded from CDN via `src/utils/load-chart.js` (esbuild can't parse npm dist on Windows NTFS; loaded on-demand with 10s timeout fallback)
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
13. **Impact & Completeness Upgrade** ✓ — US data disclaimer, glossary tooltips (CSS-only), onboarding quiz (4Q→interest routing), Search→Calculator quick ROI (auto-fetch), Detail breakeven chart (crossover), mobile compare cards (scroll-snap), Report share link (base64 URL)
14. **Phase 4 Polish** ✓ — Dark mode (toggle + auto-detect + localStorage), Social card WebP, bilingual degree tooltips (en↔zh-TW)
15. **Phase 15** (in progress) — Tech debt resolved (detail.js 4-module split), SEO dynamic meta + SSG share pages (50 career-specific OG pages), personalized recommendations (quiz→localStorage→home), PWA offline (build-time SW, 68-file pre-cache, CDN caching, offline banner)
16. **Phase 16** ✓ — Career database expansion (25→50 careers), 4 new categories (community, science, protective, transportation), BLS OOH-sourced profiles
17. **Phase 17** ✓ — Full BLS OOH expansion (50→330 careers), 10 new categories (management, media, food_service, maintenance, personal_service, sales, office, agriculture, production, military), dynamic SOC/CIP loading in fetch scripts

## Three-Layer ROI Model

- **Layer 1 (Basic)**: `(totalPremium - totalCost) / totalCost` + discounted (present-value) variant
- **Layer 2 (Risk-Adjusted)**: `E[ROI] = P(grad) × fullROI + P(dropout) × dropoutROI` (falls back to `gradRate × ROI` when dropout data unavailable)
- **Layer 3 (Competition-Adjusted)**: `riskAdjustedROI × (1 - saturationPenalty)`
- Saturation: `penalty = min(completions/employment × k, maxPenalty)`, defaults k=0.3, maxPenalty=0.25
- Dropout model: `estimateAvgDropoutYear` (geometric from retention rate) + `calcDropoutROI` (partial tuition + some-college premium)
- Graceful fallback: missing data → skip that layer, UI shows warning
- **Graduate degree model**: Masters/Doctoral/Professional include 4yr undergrad + N yr grad, split tuition (undergrad fallback + CIP-specific grad), baseline = HS salary (teen perspective). `baselineMode: 'postBac'` reserved for future toggle.

## Data Files

- `src/data/wages.json` — BLS OES (327 SOC codes, includes tot_emp) [tracked, CI-refreshed]
- `src/data/tuition.json` — College Scorecard (100+ CIP codes, median tuition) [tracked, CI-refreshed]
- `src/data/cps_earnings.json` — BLS CPS weekly earnings by education level (dropout model) [tracked, CI-refreshed]
- `src/data/ipeds.json` — IPEDS graduation rates, retention rates + curated completions [tracked, CI-refreshed]
- `src/data/onet-data.json` — O*NET 30.2 skills, knowledge, education (327 SOC codes) [tracked, CC BY 4.0 public data]
- `src/data/cip-soc-crosswalk.json` — CIP→SOC mappings (317 entries) [tracked, hand-curated]
- `src/data/occupation-profiles.json` — BLS OOH career profiles, bilingual (327 SOC codes) [tracked, hand-curated]
- `scripts/fallback/*.json` — Static fallbacks for all 5 API-fetched data files [tracked, committed]

## Data Refresh Notes

- **BLS API key**: Free at https://www.bls.gov/developers/. Set `BLS_API_KEY` in `.env`. Without key: ~11 req/day; with key: 500 req/day (50 series/req → 46 batches for 327 careers)
- **SOC proxy mapping**: BLS revises SOC codes periodically (last major: 2018). When a SOC in our profiles has no OES data, `SOC_PROXIES` in `fetch-bls-wages.mjs` maps it to the nearest equivalent. After refresh, check for zero-data SOCs and update the map
- **Node.js libuv file-write bug**: On this Windows system, ALL Node.js versions (v22/v24) writeFileSync produces 0x887d-compressed files unreadable by other programs (Python, esbuild, .NET). Root cause unknown (not version-specific, not drive-specific). Workarounds in place:
  - `npm run refresh-data` auto-runs `python scripts/fix-wof.py` as the last step to rewrite data JSON
  - `vite.config.js` sets `esbuild: false` so the Go-based esbuild binary never reads Node-written temp files
  - CI builds on Linux are unaffected
