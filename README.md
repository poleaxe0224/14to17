# 14to17

A bilingual (English / Traditional Chinese) career exploration tool for teens (14-17), with progressive disclosure from discovery to ROI analysis. Powered by real US federal data.

**Live**: [poleaxe0224.github.io/14to17](https://poleaxe0224.github.io/14to17/)

## Features

- **Interest-Based Exploration** - Browse 25 careers grouped by interest (build/help/analyze/create)
- **4-Level Progressive Disclosure** - Discover → Plan → Evaluate → Decide
- **O*NET Skills & Knowledge** - Skills bars, knowledge tags, education requirements
- **ROI Calculator** - NPV, IRR, breakeven, three-layer ROI (basic → risk-adjusted → competition-adjusted)
- **Career Comparison** - Side-by-side 2-3 career comparison with best-value markers
- **Exploration Report** - Track viewed careers, export as Markdown / PDF / JSON
- **Bilingual** - Full English and Traditional Chinese with instant toggle

## Data Sources

| Source | Data | Limit |
|--------|------|-------|
| [BLS Public Data API v2](https://www.bls.gov/developers/) | Wage percentiles by SOC code | 500 req/day |
| [College Scorecard API](https://collegescorecard.ed.gov/data/) | Tuition, net price, earnings by CIP code | 1000 req/hr |
| [NCES IPEDS](https://nces.ed.gov/ipeds/) | Graduation rates, annual completions | Static |
| [O*NET Database 30.2](https://www.onetcenter.org/database.html) | Skills, knowledge, education requirements | Static |

## Tech Stack

Vanilla JS (ES modules), Vite 6, Pico CSS 2, Chart.js 4 (CDN), html2pdf.js (CDN, lazy-loaded)

## Development

```bash
npm install
npm run dev        # Start dev server
npm test           # Run 140 unit tests
npm run build      # Production build -> dist/
npm run preview    # Preview production build
```

## API Keys

Development uses `DEMO_KEY` by default. For production, create a `.env` file:

```
VITE_BLS_API_KEY=your_key_here
VITE_SCORECARD_API_KEY=your_key_here
```

- BLS key: https://data.bls.gov/registrationEngine/
- Scorecard key: https://api.data.gov/signup/

## Deploy

Push to `main` branch triggers GitHub Actions -> GitHub Pages deployment.

## License

MIT
