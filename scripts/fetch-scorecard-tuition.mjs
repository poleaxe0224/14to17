/**
 * Fetch College Scorecard tuition data for all 25 mapped CIP codes.
 * Run from project root: node scripts/fetch-scorecard-tuition.mjs
 *
 * Output: src/data/tuition.json
 * Scorecard API: https://api.data.gov/ed/collegescorecard/v1/schools.json
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'tuition.json');

const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';
const API_KEY = process.env.SCORECARD_API_KEY || 'DEMO_KEY';

/** CIP codes from CAREER_MAPPINGS (soc → cip) */
const CIP_CAREERS = [
  { cip: '1107', career: 'Software Developer' },
  { cip: '1101', career: 'Computer Systems Analyst' },
  { cip: '1104', career: 'Information Security Analyst' },
  { cip: '2701', career: 'Data Scientist' },
  { cip: '5138', career: 'Registered Nurse' },
  { cip: '5117', career: 'Physician Assistant' },
  { cip: '5112', career: 'Dentist' },
  { cip: '5102', career: 'Pharmacist' },
  { cip: '5203', career: 'Accountant' },
  { cip: '5208', career: 'Financial Analyst' },
  { cip: '5214', career: 'Marketing Manager' },
  { cip: '5210', career: 'Financial Manager' },
  { cip: '1409', career: 'Civil Engineer' },
  { cip: '1410', career: 'Electrical Engineer' },
  { cip: '1419', career: 'Mechanical Engineer' },
  { cip: '1312', career: 'Elementary School Teacher' },
  { cip: '1313', career: 'High School Teacher' },
  { cip: '4702', career: 'HVAC Technician' },
  { cip: '4601', career: 'Electrician' },
  { cip: '5109', career: 'Licensed Practical Nurse' },
  { cip: '1106', career: 'Web Developer' },
  { cip: '2201', career: 'Lawyer' },
  { cip: '2203', career: 'Paralegal' },
  { cip: '5010', career: 'Graphic Designer' },
  { cip: '0904', career: 'News Analyst / Reporter' },
];

const FIELDS = [
  'id',
  'school.name',
  'school.ownership',
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.cost.avg_net_price.overall',
];

const SAMPLE_SIZE = 50;

async function fetchTuitionForCip(cipCode) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    'latest.programs.cip_4_digit.code': cipCode,
    fields: FIELDS.join(','),
    per_page: String(SAMPLE_SIZE),
    sort: 'latest.cost.avg_net_price.overall:asc',
  });

  const url = `${BASE_URL}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for CIP ${cipCode}`);
  }

  const json = await res.json();
  const schools = json.results || [];

  let inStateSum = 0, outOfStateSum = 0, netPriceSum = 0;
  let inStateCount = 0, outOfStateCount = 0, netPriceCount = 0;

  for (const s of schools) {
    const inState = s['latest.cost.tuition.in_state'];
    const outOfState = s['latest.cost.tuition.out_of_state'];
    const netPrice = s['latest.cost.avg_net_price.overall'];

    if (inState != null) { inStateSum += inState; inStateCount++; }
    if (outOfState != null) { outOfStateSum += outOfState; outOfStateCount++; }
    if (netPrice != null) { netPriceSum += netPrice; netPriceCount++; }
  }

  return {
    inState: inStateCount ? Math.round(inStateSum / inStateCount) : null,
    outOfState: outOfStateCount ? Math.round(outOfStateSum / outOfStateCount) : null,
    netPrice: netPriceCount ? Math.round(netPriceSum / netPriceCount) : null,
    sampleCount: schools.length,
  };
}

async function main() {
  // Load existing data for incremental fetching
  let existing = {};
  try {
    const { readFileSync } = await import('fs');
    const prev = JSON.parse(readFileSync(OUT_FILE, 'utf-8'));
    existing = prev.programs || {};
    console.log(`Loaded ${Object.keys(existing).length} existing CIP entries`);
  } catch { /* first run, no file */ }

  const toFetch = CIP_CAREERS.filter((c) => !existing[c.cip]);
  console.log(`Fetching Scorecard tuition for ${toFetch.length} CIP codes (${CIP_CAREERS.length - toFetch.length} cached)...`);

  const tuition = { ...existing };

  for (let i = 0; i < toFetch.length; i++) {
    const { cip, career } = toFetch[i];
    process.stdout.write(`  [${i + 1}/${toFetch.length}] CIP ${cip} (${career})...`);

    try {
      tuition[cip] = await fetchTuitionForCip(cip);
      console.log(` ${tuition[cip].sampleCount} schools, net $${tuition[cip].netPrice}`);
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
    }

    // DEMO_KEY: ~1 req/sec limit, use 4s to be safe
    if (i < toFetch.length - 1) {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  // Summary
  const count = Object.keys(tuition).length;
  const withNet = Object.values(tuition).filter((t) => t.netPrice != null).length;
  console.log(`\nFetched: ${count} CIP codes, ${withNet} with net price data`);

  // Write output
  mkdirSync(OUT_DIR, { recursive: true });
  const output = {
    _meta: {
      fetchedAt: new Date().toISOString(),
      source: 'College Scorecard API (api.data.gov)',
      sampleSize: SAMPLE_SIZE,
    },
    programs: tuition,
  };
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Written to: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
