/**
 * Generate static share pages with career-specific OG tags.
 *
 * Each page lives at dist/share/{soc}.html and contains:
 *   - Career-specific og:title, og:description, og:url
 *   - Shared social card image
 *   - <meta http-equiv="refresh"> redirect to the SPA profile page
 *
 * Runs as a post-build step: vite build && node scripts/generate-share-pages.mjs
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist', 'share');

// Read career mappings from source (avoid importing ES module)
const mappingsSource = readFileSync(resolve(root, 'src', 'engine', 'mappings.js'), 'utf-8');

// Extract CAREER_MAPPINGS array via regex (simple parse — no eval)
const careerBlockMatch = mappingsSource.match(/export const CAREER_MAPPINGS = Object\.freeze\(\[([\s\S]*?)\]\);/);
if (!careerBlockMatch) {
  console.error('Could not parse CAREER_MAPPINGS from mappings.js');
  process.exit(1);
}

// Parse each { soc, career, careerZh } entry
const entryRegex = /\{\s*soc:\s*'([^']+)'[^}]*career:\s*'([^']+)'[^}]*careerZh:\s*'([^']+)'/g;
const careers = [];
let m;
while ((m = entryRegex.exec(careerBlockMatch[1])) !== null) {
  careers.push({ soc: m[1], career: m[2], careerZh: m[3] });
}

const BASE_URL = 'https://poleaxe0224.github.io/14to17';
const SOCIAL_IMAGE = `${BASE_URL}/social-card.webp`;

mkdirSync(distDir, { recursive: true });

for (const { soc, career, careerZh } of careers) {
  const title = `${career} (${careerZh}) — Career Compass`;
  const desc = `Explore ${career} career path: salary, education cost, ROI analysis, and job outlook. 探索${careerZh}的薪資、學費、投資報酬率與就業展望。`;
  const url = `${BASE_URL}/share/${soc}.html`;
  const redirect = `${BASE_URL}/#/profile/${soc}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${redirect}">
<link rel="canonical" href="${redirect}">
</head>
<body>
<p>Redirecting to <a href="${redirect}">${career} — Career Compass</a>…</p>
</body>
</html>
`;

  writeFileSync(resolve(distDir, `${soc}.html`), html, 'utf-8');
}

console.log(`Generated ${careers.length} share pages in dist/share/`);
