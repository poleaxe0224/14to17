# Education ROI Calculator

## Overview

Static SPA deployed to GitHub Pages. Calculates education return-on-investment using a three-layer model: basic ROI, risk-adjusted (graduation rate), and competition-adjusted (job market saturation). Data from BLS wages, College Scorecard tuition, and IPEDS.

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
├── utils/        # Formatting helpers (currency, percent, number)
├── views/        # Page components (render + optional afterRender)
│   ├── home.js, search.js, calculator.js, compare.js
│   ├── profile.js    # Occupation profile (OOH-style, 8 sections)
│   └── detail.js     # ROI deep dive (wages, tuition, 3-layer ROI)
├── styles/       # Design tokens + main.css + teen.css
├── app.js        # App init (router + i18n wiring)
└── main.js       # Vite entry point
tests/            # Vitest unit tests (108+)
```

## User Flow

```
Home → Search → Profile (#/profile/:soc) → Detail (#/detail/:soc) → Calculator
                                                                   → Compare
```

## Notes

- Chart.js loaded via CDN script tag (esbuild can't parse npm dist on Windows NTFS)
- Views can export `{ render, afterRender }` — router calls afterRender after DOM insertion
- Detail→Calculator pre-fill uses query params in hash: `#/calculator?soc=...&tuition=...`
- Profile page loads static JSON (instant) + wage data (async) in parallel
- Tuition fallback by degree level when CIP-specific data unavailable (scorecard.js `getTuitionFallback`)
- Category gradients and growth badges styled via CSS custom properties (tokens.css + teen.css)

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

## Five-Phase Plan

1. **Foundation** ✓ — skeleton, router, API services, i18n
2. **Core Math** ✓ — NPV, IRR, breakeven, lifetime ROI engine, SOC-CIP mappings, 52 tests
3. **UI Views** ✓ — career search (25 careers, live filter), detail (BLS wages + Scorecard tuition), calculator (9-field form + Chart.js bar/line charts), query-param pre-fill from detail→calculator
4. **Comparison + Report** ✓ — 2-3 career side-by-side comparison table (★ best values), grouped bar chart, PDF export (html2pdf.js lazy-loaded from CDN) on both calculator and compare views
5. **Polish + Deploy** ✓ — a11y (skip-link, focus-visible, aria-labels, landmarks), preconnect hints, 75 tests, CI runs tests before deploy, README
6. **IPEDS + Three-Layer ROI** ✓ — graduation rates (Scorecard/IPEDS), curated completions (NCES), CIP-SOC crosswalk, saturation penalty with adjustable k/maxPenalty sliders, 94 tests
7. **Occupation Profile + Teen UI** ✓ — BLS OOH-style profile page (8 sections: what they do, work environment, how to become, pay, outlook, state data, similar occupations, O*NET links), teen-friendly CSS (gradients, salary meters, growth badges, category cards), 108 tests

## Three-Layer ROI Model

- **Layer 1 (Basic)**: `(totalPremium - totalCost) / totalCost` — existing NPV-based ROI
- **Layer 2 (Risk-Adjusted)**: `graduationRate × basicROI` — expected value weighted by graduation probability
- **Layer 3 (Competition-Adjusted)**: `riskAdjustedROI × (1 - saturationPenalty)` — penalizes oversaturated fields
- Saturation: `penalty = min(completions/employment × k, maxPenalty)`, defaults k=0.3, maxPenalty=0.25
- Graceful fallback: missing data → skip that layer, UI shows warning

## Data Files

- `src/data/wages.json` — BLS OES (25 SOC codes, includes tot_emp) [gitignored, CI-generated]
- `src/data/tuition.json` — College Scorecard (25 CIP codes, median tuition) [gitignored, CI-generated]
- `src/data/ipeds.json` — IPEDS graduation rates + curated completions [tracked]
- `src/data/cip-soc-crosswalk.json` — CIP→SOC mappings [tracked, hand-curated]
- `src/data/occupation-profiles.json` — BLS OOH career profiles, bilingual (25 SOC codes) [tracked, hand-curated]
