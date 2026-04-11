/**
 * Fetch IPEDS-derived graduation rates and completions data for 46 CIP codes.
 * Run from project root: node scripts/fetch-ipeds-data.mjs
 *
 * Output: src/data/ipeds.json
 *
 * Data sources:
 *   - Graduation rates: College Scorecard API (IPEDS-derived latest.completion.consumer_rate)
 *   - Completions: NCES IPEDS Completions Survey 2022 (curated for 25 CIP-4 codes)
 *
 * Note: Urban Institute Education Data Portal API (educationdata.urban.org) was the
 * intended primary source but returns 404/500 as of 2026-04. College Scorecard is
 * used as the IPEDS-derived alternative for graduation rates.
 */

import { writeFileSync, readFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'ipeds.json');
const FALLBACK_FILE = join(__dirname, 'fallback', 'ipeds.json');

const SCORECARD_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';
const API_KEY = process.env.SCORECARD_API_KEY || 'DEMO_KEY';

/**
 * NCES IPEDS Completions Survey 2021-22 — curated totals for 25 CIP-4 codes.
 * Source: NCES Digest of Education Statistics, Tables 325.10-325.95
 * These are total awards (all degree levels) conferred nationally per CIP-4.
 * Updated annually; next update expected ~late 2026.
 */
const CURATED_COMPLETIONS = {
  // Original 25
  '1107': { total: 114_000, title: 'Computer Science', year: 2022 },
  '1101': { total: 56_000,  title: 'Computer and Information Sciences, General', year: 2022 },
  '1104': { total: 8_500,   title: 'Information Science/Studies', year: 2022 },
  '2701': { total: 28_000,  title: 'Mathematics, General', year: 2022 },
  '5138': { total: 178_000, title: 'Registered Nursing', year: 2022 },
  '5109': { total: 42_000,  title: 'Allied Health Diagnostic (PA + LPN)', year: 2022 },
  '5104': { total: 6_800,   title: 'Dentistry (D.D.S., D.M.D.)', year: 2022 },
  '5120': { total: 13_500,  title: 'Pharmacy, Pharmaceutical Sciences', year: 2022 },
  '5203': { total: 62_000,  title: 'Accounting and Related Services', year: 2022 },
  '5208': { total: 72_000,  title: 'Finance and Financial Management', year: 2022 },
  '5214': { total: 49_000,  title: 'Marketing', year: 2022 },
  '5210': { total: 19_000,  title: 'Human Resources Management', year: 2022 },
  '1409': { total: 18_500,  title: 'Civil Engineering', year: 2022 },
  '1410': { total: 23_000,  title: 'Electrical, Electronics Engineering', year: 2022 },
  '1419': { total: 34_000,  title: 'Mechanical Engineering', year: 2022 },
  '1312': { total: 26_000,  title: 'Teacher Education, Specific Levels (Elementary)', year: 2022 },
  '1313': { total: 13_000,  title: 'Teacher Education, Specific Subjects (Secondary)', year: 2022 },
  '4702': { total: 29_000,  title: 'Heating, Ventilation, AC and Refrigeration', year: 2022 },
  '4601': { total: 13_000,  title: 'Construction Trades, General', year: 2022 },
  '1106': { total: 11_000,  title: 'Data Entry/Computer Applications', year: 2022 },
  '2201': { total: 38_500,  title: 'Law (J.D.)', year: 2022 },
  '2203': { total: 8_200,   title: 'Legal Support Services', year: 2022 },
  '5010': { total: 13_000,  title: 'Arts, Entertainment, and Media (Graphic Design)', year: 2022 },
  '0904': { total: 23_000,  title: 'Journalism', year: 2022 },
  '3070': { total: 15_000,  title: 'Data Science', year: 2022 },
  // Expanded 25
  '0402': { total: 9_200,   title: 'Architecture', year: 2022 },
  '1405': { total: 7_800,   title: 'Biomedical / Medical Engineering', year: 2022 },
  '4407': { total: 38_000,  title: 'Social Work', year: 2022 },
  '5115': { total: 35_000,  title: 'Mental and Social Health Services', year: 2022 },
  '1103': { total: 42_000,  title: 'Information Technology', year: 2022 },
  '4605': { total: 5_200,   title: 'Plumbing Technology', year: 2022 },
  '4602': { total: 7_800,   title: 'Carpentry', year: 2022 },
  '1205': { total: 16_000,  title: 'Culinary Arts / Food Service', year: 2022 },
  '5123': { total: 22_000,  title: 'Rehabilitation and Therapeutic Professions', year: 2022 },
  '5118': { total: 4_200,   title: 'Veterinary Medicine (D.V.M.)', year: 2022 },
  '5106': { total: 12_500,  title: 'Dental Hygiene / Dental Clinical Sciences', year: 2022 },
  '5117': { total: 22_000,  title: 'Medicine (M.D., D.O.)', year: 2022 },
  '4201': { total: 121_000, title: 'Psychology, General', year: 2022 },
  '0301': { total: 14_000,  title: 'Natural Resources Conservation and Research', year: 2022 },
  '4301': { total: 54_000,  title: 'Criminal Justice and Corrections', year: 2022 },
  '5202': { total: 92_000,  title: 'Business Administration and Management', year: 2022 },
  '5107': { total: 18_000,  title: 'Health and Medical Administrative Services', year: 2022 },
  '0902': { total: 28_000,  title: 'Public Relations, Advertising, Communication', year: 2022 },
  '3105': { total: 31_000,  title: 'Kinesiology and Exercise Science', year: 2022 },
  '4302': { total: 10_000,  title: 'Fire Protection and Safety Technology', year: 2022 },
  '4902': { total: 5_500,   title: 'Aviation / Airline Pilot Training', year: 2022 },
};

/**
 * CIP proxy mapping: when Scorecard returns 0 schools for grad rate,
 * use the proxy CIP's graduation/retention data instead.
 * Completions stay original (curated separately per CIP).
 */
const CIP_PROXIES = {
  '0902': { cip: '0904', title: 'Journalism (CIP 09.04)' },
};

const CIP_CODES = Object.keys(CURATED_COMPLETIONS);
const SAMPLE_SIZE = 100;

function median(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Fetch graduation rate (IPEDS-derived) from College Scorecard for a CIP-4 code.
 * Returns median of latest.completion.consumer_rate across schools offering that CIP.
 */
async function fetchGradRateForCip(cipCode) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    'latest.programs.cip_4_digit.code': cipCode,
    fields: 'id,latest.completion.consumer_rate,latest.student.retention_rate.four_year.full_time',
    per_page: String(SAMPLE_SIZE),
  });

  const url = `${SCORECARD_URL}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for CIP ${cipCode}`);
  }

  const json = await res.json();
  const schools = json.results || [];

  const rates = schools
    .map((s) => s['latest.completion.consumer_rate'])
    .filter((r) => r != null && !Number.isNaN(r));

  const retentionRates = schools
    .map((s) => s['latest.student.retention_rate.four_year.full_time'])
    .filter((r) => r != null && !Number.isNaN(r));

  return {
    graduationRate: median(rates),
    schoolCount: rates.length,
    retentionRate: median(retentionRates),
    retentionSample: retentionRates.length,
  };
}

async function main() {
  console.log(`Fetching IPEDS data for ${CIP_CODES.length} CIP codes...`);
  console.log('  Graduation rates: College Scorecard (IPEDS-derived)');
  console.log('  Completions: NCES IPEDS Completions Survey 2022 (curated)');

  const byCip = {};
  const MAX_RETRIES = 3;

  for (let i = 0; i < CIP_CODES.length; i++) {
    const cip = CIP_CODES[i];
    const info = CURATED_COMPLETIONS[cip];
    process.stdout.write(`  [${i + 1}/${CIP_CODES.length}] CIP ${cip} (${info.title})...`);

    let gradData = { graduationRate: null, schoolCount: 0 };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        gradData = await fetchGradRateForCip(cip);
        break;
      } catch (err) {
        if (attempt === MAX_RETRIES) {
          console.log(` WARN: ${err.message} (${MAX_RETRIES} retries exhausted)`);
        } else {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    }

    byCip[cip] = {
      graduation_rate_150pct: gradData.graduationRate != null
        ? Math.round(gradData.graduationRate * 10000) / 10000
        : null,
      retention_rate_ft: gradData.retentionRate != null
        ? Math.round(gradData.retentionRate * 10000) / 10000
        : null,
      retention_rate_sample: gradData.retentionSample,
      completions_total: info.total,
      cip_title: info.title,
      grad_rate_sample_schools: gradData.schoolCount,
    };

    const gr = byCip[cip].graduation_rate_150pct;
    const rr = byCip[cip].retention_rate_ft;
    console.log(` grad_rate=${gr != null ? (gr * 100).toFixed(1) + '%' : 'null'}, retention=${rr != null ? (rr * 100).toFixed(1) + '%' : 'null'}, completions=${info.total.toLocaleString()}`);

    // DEMO_KEY: ~1 req/sec limit
    if (i < CIP_CODES.length - 1) {
      await new Promise((r) => setTimeout(r, API_KEY === 'DEMO_KEY' ? 4000 : 1500));
    }
  }

  // Apply proxy grad rate/retention for CIP codes with no Scorecard results
  for (const [origCip, proxy] of Object.entries(CIP_PROXIES)) {
    const orig = byCip[origCip];
    const source = byCip[proxy.cip];
    if (orig && orig.grad_rate_sample_schools === 0 && source && source.graduation_rate_150pct != null) {
      byCip[origCip] = {
        ...orig,
        graduation_rate_150pct: source.graduation_rate_150pct,
        retention_rate_ft: source.retention_rate_ft,
        retention_rate_sample: source.retention_rate_sample,
        grad_rate_sample_schools: source.grad_rate_sample_schools,
        proxyCip: proxy.cip,
        proxyTitle: proxy.title,
      };
      console.log(`  Proxy: CIP ${origCip} grad rate ← CIP ${proxy.cip} (${proxy.title})`);
    }
  }

  // Summary
  const withGrad = Object.values(byCip).filter((v) => v.graduation_rate_150pct != null).length;
  const withComp = Object.values(byCip).filter((v) => v.completions_total != null).length;
  console.log(`\nResult: ${Object.keys(byCip).length} CIP codes, ${withGrad} with graduation rate, ${withComp} with completions`);

  // Write output
  mkdirSync(OUT_DIR, { recursive: true });

  // Preserve existing data if re-fetch fails partially
  let existing = {};
  try {
    const prev = JSON.parse(readFileSync(OUT_FILE, 'utf-8'));
    existing = prev.by_cip || {};
  } catch { /* first run */ }

  const merged = { ...existing, ...byCip };

  const output = {
    metadata: {
      source: 'IPEDS via College Scorecard API (graduation rates) + NCES Completions Survey (curated)',
      graduation_rate_source: 'College Scorecard latest.completion.consumer_rate (IPEDS-derived)',
      completions_source: 'NCES IPEDS Completions Survey 2021-22',
      year: '2022',
      fetched_at: new Date().toISOString(),
    },
    by_cip: merged,
  };

  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Written to: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(`IPEDS fetch failed: ${err.message}`);
  if (existsSync(FALLBACK_FILE)) {
    console.warn('Using static fallback: scripts/fallback/ipeds.json');
    mkdirSync(OUT_DIR, { recursive: true });
    copyFileSync(FALLBACK_FILE, OUT_FILE);
    console.log(`Fallback copied to: ${OUT_FILE}`);
  } else {
    console.error('No fallback available. Aborting.');
    process.exit(1);
  }
});
