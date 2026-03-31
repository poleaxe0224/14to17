/**
 * BLS Public Data API v2 service.
 *
 * Fetches Occupational Employment and Wage Statistics (OES) data.
 * Series ID format (national, all industries):
 *   OEUN + 0000000 (area) + 000000 (industry) + SSSSSS (SOC-6) + TT (data type)
 *
 * Free tier: 500 requests/day with a registered API key.
 * Docs: https://www.bls.gov/developers/api_signature_v2.htm
 */

const BASE_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const cache = new Map();

/** Data type codes for OES survey */
const OES_DATA_TYPES = Object.freeze({
  employment:    '01',
  empPer1000:    '02',
  hourlyMean:    '03',
  annualMean:    '04',
  hourly10:      '06',
  hourly25:      '07',
  hourlyMedian:  '08',
  hourly75:      '09',
  hourly90:      '10',
  annual10:      '11',
  annual25:      '12',
  annualMedian:  '13',
  annual75:      '14',
  annual90:      '15',
});

function getApiKey() {
  return import.meta.env.VITE_BLS_API_KEY || '';
}

/**
 * Build an OES series ID for national-level, all-industry data.
 * @param {string} socCode — e.g. '15-1252' or '151252'
 * @param {keyof typeof OES_DATA_TYPES} dataType
 * @returns {string} series ID
 */
export function buildOesSeries(socCode, dataType) {
  const soc = socCode.replace('-', '');
  const code = OES_DATA_TYPES[dataType];
  if (!code) throw new Error(`Unknown OES data type: ${dataType}`);
  if (soc.length !== 6) throw new Error(`SOC code must be 6 digits: ${soc}`);
  return `OEUN0000000000000${soc}${code}`;
}

/**
 * Fetch one or more BLS time series.
 * @param {string[]} seriesIds
 * @param {number} startYear
 * @param {number} endYear
 * @returns {Promise<Array>} array of series results
 */
export async function fetchSeries(seriesIds, startYear, endYear) {
  const cacheKey = `${seriesIds.join(',')}|${startYear}-${endYear}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const payload = {
    seriesid: seriesIds,
    startyear: String(startYear),
    endyear: String(endYear),
  };

  const apiKey = getApiKey();
  if (apiKey) {
    payload.registrationkey = apiKey;
  }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`BLS API HTTP ${res.status}`);
  }

  const json = await res.json();

  if (json.status !== 'REQUEST_SUCCEEDED') {
    const msg = json.message?.join('; ') || 'Unknown BLS API error';
    throw new Error(`BLS API: ${msg}`);
  }

  const series = json.Results.series;
  cache.set(cacheKey, series);
  return series;
}

/**
 * Static wage data bundled at build time (BLS API doesn't support browser CORS).
 * Regenerate with: node scripts/fetch-bls-wages.mjs
 */
let staticWages = null;
async function getStaticWages() {
  if (staticWages) return staticWages;
  const mod = await import('../data/wages.json');
  staticWages = mod.default;
  return staticWages;
}

/**
 * Get annual wage percentiles + employment count for a SOC code.
 * Uses bundled static data (primary) with live API fallback.
 * @param {string} socCode — e.g. '15-1252'
 * @param {number} [year] — defaults to last year
 * @returns {Promise<Record<string, number>>}
 */
export async function getWageData(socCode, year) {
  // Primary: static bundled data (no CORS issues)
  try {
    const wages = await getStaticWages();
    const entry = wages.careers?.[socCode];
    if (entry?.annualMedian != null) {
      return { ...entry, year: entry.year || wages._meta?.year };
    }
  } catch { /* fall through to live API */ }

  // Fallback: live BLS API (works server-side or with CORS proxy)
  const targetYear = year || new Date().getFullYear() - 2;

  const fields = [
    'annual10', 'annual25', 'annualMedian', 'annual75', 'annual90',
    'annualMean', 'employment',
  ];

  const seriesIds = fields.map((f) => buildOesSeries(socCode, f));
  const results = await fetchSeries(seriesIds, targetYear, targetYear);

  const data = {};
  results.forEach((series, i) => {
    const latest = series.data?.[0];
    if (latest) {
      const val = parseFloat(latest.value);
      data[fields[i]] = Number.isNaN(val) ? null : val;
      data.year = parseInt(latest.year, 10);
    }
  });

  return data;
}

/**
 * Get wage trend over multiple years.
 * @param {string} socCode
 * @param {number} startYear
 * @param {number} endYear
 * @returns {Promise<Array<{year: number, median: number, mean: number}>>}
 */
export async function getWageTrend(socCode, startYear, endYear) {
  const seriesIds = [
    buildOesSeries(socCode, 'annualMedian'),
    buildOesSeries(socCode, 'annualMean'),
  ];

  const results = await fetchSeries(seriesIds, startYear, endYear);
  const medianData = results[0]?.data || [];
  const meanData = results[1]?.data || [];

  const byYear = new Map();
  for (const d of medianData) {
    byYear.set(d.year, { year: parseInt(d.year, 10), median: parseFloat(d.value) });
  }
  for (const d of meanData) {
    const entry = byYear.get(d.year) || { year: parseInt(d.year, 10) };
    entry.mean = parseFloat(d.value);
    byYear.set(d.year, entry);
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

export { OES_DATA_TYPES };
