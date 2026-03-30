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
  hourly10:      '07',
  hourly25:      '08',
  hourlyMedian:  '09',
  hourly75:      '10',
  hourly90:      '11',
  annual10:      '13',
  annual25:      '14',
  annualMedian:  '15',
  annual75:      '16',
  annual90:      '17',
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
 * Get annual wage percentiles + employment count for a SOC code.
 * @param {string} socCode — e.g. '15-1252'
 * @param {number} [year] — defaults to last year
 * @returns {Promise<Record<string, number>>}
 */
export async function getWageData(socCode, year) {
  const targetYear = year || new Date().getFullYear() - 1;

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
