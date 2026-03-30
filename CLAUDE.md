# Education ROI Calculator

## Overview

Static SPA deployed to GitHub Pages. Calculates education return-on-investment by combining BLS wage data with College Scorecard tuition/program data.

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
├── api/          # BLS + College Scorecard service layer
├── engine/       # Pure math: ROI, NPV, IRR, breakeven, mappings
├── i18n/         # Translation JSON + runtime
├── router/       # Hash-based SPA router (supports afterRender + query params)
├── utils/        # Formatting helpers (currency, percent, number)
├── views/        # Page components (render + optional afterRender)
├── styles/       # Design tokens + overrides
├── app.js        # App init (router + i18n wiring)
└── main.js       # Vite entry point
tests/            # Vitest unit tests
```

## Notes

- Chart.js loaded via CDN script tag (esbuild can't parse npm dist on Windows NTFS)
- Views can export `{ render, afterRender }` — router calls afterRender after DOM insertion
- Detail→Calculator pre-fill uses query params in hash: `#/calculator?soc=...&tuition=...`

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
