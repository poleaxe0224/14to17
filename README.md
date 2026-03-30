# Education ROI Calculator

A bilingual (English / Traditional Chinese) web app that calculates the return on investment for education paths, powered by real US federal data.

**Live**: [education-roi-calculator](https://poleaxe0224.github.io/education-roi-calculator/) (once deployed)

## Features

- **Career Search** - Browse 25 mapped careers with bilingual names, degree badges, and SOC codes
- **Career Detail** - Live BLS wage percentiles + College Scorecard tuition data
- **ROI Calculator** - NPV, IRR, breakeven year, lifetime ROI, loan analysis with interactive charts
- **Career Comparison** - Side-by-side 2-3 career comparison table with best-value markers
- **PDF Export** - Export calculator or comparison results as PDF
- **Bilingual** - Full English and Traditional Chinese support with instant toggle

## Data Sources

| Source | Data | Limit |
|--------|------|-------|
| [BLS Public Data API v2](https://www.bls.gov/developers/) | Wage percentiles by SOC code | 500 req/day |
| [College Scorecard API](https://collegescorecard.ed.gov/data/) | Tuition, net price, earnings by CIP code | 1000 req/hr |

## Tech Stack

Vanilla JS (ES modules), Vite 6, Pico CSS 2, Chart.js 4 (CDN), html2pdf.js (CDN, lazy-loaded)

## Development

```bash
npm install
npm run dev        # Start dev server
npm test           # Run 75 unit tests
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
