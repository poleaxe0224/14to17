/**
 * Fetch BLS CPS median weekly earnings by education level.
 * Run from project root: node scripts/fetch-cps-earnings.mjs
 *
 * Output: src/data/cps_earnings.json
 * BLS API: https://api.bls.gov/publicAPI/v2/timeseries/data/
 *
 * Used by the Layer 2 dropout ROI model to estimate "some college, no degree" earnings.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'cps_earnings.json');

const BLS_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const API_KEY = process.env.BLS_API_KEY || '';

/** BLS LEU series: CPS Usual Weekly Earnings, median, quarterly */
const SERIES = {
  hsGraduatesNoCollege: 'LEU0252917300',
  someCollegeOrAssociate: 'LEU0252916800',
};

const INTERPOLATION_FACTOR = 0.6;

async function fetchSeries(seriesIds, startYear, endYear) {
  const payload = {
    seriesid: seriesIds,
    startyear: String(startYear),
    endyear: String(endYear),
  };
  if (API_KEY) payload.registrationkey = API_KEY;

  const res = await fetch(BLS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`BLS HTTP ${res.status}`);
  const json = await res.json();

  if (json.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS: ${json.message?.join('; ')}`);
  }
  return json.Results.series;
}

function getLatestValue(series) {
  const latest = series.data?.[0];
  if (!latest) return null;
  const val = parseFloat(latest.value);
  return Number.isNaN(val) ? null : { value: val, period: latest.periodName, year: latest.year };
}

async function main() {
  const year = new Date().getFullYear();
  // CPS quarterly data may lag — try current year first, fall back to year-1
  console.log(`Fetching BLS CPS earnings data (${year - 1}–${year})...`);

  const ids = Object.values(SERIES);
  const results = await fetchSeries(ids, year - 1, year);

  // Map results by series ID
  const byId = new Map(results.map((s) => [s.seriesID, s]));

  const hsSeries = byId.get(SERIES.hsGraduatesNoCollege);
  const scSeries = byId.get(SERIES.someCollegeOrAssociate);

  const hsData = hsSeries ? getLatestValue(hsSeries) : null;
  const scData = scSeries ? getLatestValue(scSeries) : null;

  // Fail-fast guard
  if (!hsData && !scData) {
    throw new Error('BLS CPS API returned no earnings data for either series. Aborting build.');
  }

  const hsWeekly = hsData?.value ?? null;
  const scWeekly = scData?.value ?? null;
  const hsAnnual = hsWeekly != null ? hsWeekly * 52 : null;
  const scAnnual = scWeekly != null ? scWeekly * 52 : null;

  // Interpolate "some college, no degree" from HS-only and some-college-or-associate
  let someCollegeNoDegreeAnnual = null;
  if (hsAnnual != null && scAnnual != null) {
    someCollegeNoDegreeAnnual = Math.round(hsAnnual + (scAnnual - hsAnnual) * INTERPOLATION_FACTOR);
  }

  const quarter = hsData?.period ?? scData?.period ?? 'unknown';
  const dataYear = hsData?.year ?? scData?.year ?? String(year);

  console.log(`  HS graduates weekly median: $${hsWeekly} → annual $${hsAnnual}`);
  console.log(`  Some college/associate weekly median: $${scWeekly} → annual $${scAnnual}`);
  console.log(`  Some college no degree (interpolated): $${someCollegeNoDegreeAnnual}`);

  const output = {
    _meta: {
      fetchedAt: new Date().toISOString(),
      source: 'BLS CPS Usual Weekly Earnings (LEU series)',
      seriesIds: ids,
      quarter: `${quarter} ${dataYear}`,
      note: 'someCollegeNoDegree is estimated via interpolation: hsOnly + (someCollegeOrAssoc - hsOnly) × 0.6',
    },
    hsGraduatesNoCollege: {
      seriesId: SERIES.hsGraduatesNoCollege,
      weeklyMedian: hsWeekly,
      annualEstimate: hsAnnual,
    },
    someCollegeOrAssociate: {
      seriesId: SERIES.someCollegeOrAssociate,
      weeklyMedian: scWeekly,
      annualEstimate: scAnnual,
    },
    someCollegeNoDegree: {
      annualEstimate: someCollegeNoDegreeAnnual,
      method: 'interpolation',
      interpolationFactor: INTERPOLATION_FACTOR,
    },
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Written to: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
