/**
 * College Scorecard API service.
 *
 * Fetches school and program-level data (tuition, earnings, completion rates).
 * Uses 4-digit CIP codes to find programs and cross-reference with SOC codes.
 *
 * Free tier: 1000 requests/hour with api.data.gov key.
 * Docs: https://collegescorecard.ed.gov/data/documentation/
 */

const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';
const cache = new Map();

/**
 * Static tuition data bundled at build time (Scorecard API doesn't support browser CORS).
 * Regenerate with: node scripts/fetch-scorecard-tuition.mjs
 */
let staticTuition = null;
async function getStaticTuition() {
  if (staticTuition) return staticTuition;
  const mod = await import('../data/tuition.json');
  staticTuition = mod.default;
  return staticTuition;
}

function getApiKey() {
  return import.meta.env.VITE_SCORECARD_API_KEY || 'DEMO_KEY';
}

/**
 * Build a query URL with API key and parameters.
 */
function buildUrl(params) {
  const searchParams = new URLSearchParams({
    api_key: getApiKey(),
    ...params,
  });
  return `${BASE_URL}?${searchParams}`;
}

/**
 * Cached fetch wrapper.
 */
async function cachedFetch(cacheKey, url) {
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Scorecard API rate limit exceeded. Please wait and try again.');
    }
    throw new Error(`Scorecard API HTTP ${res.status}`);
  }

  const json = await res.json();
  cache.set(cacheKey, json);
  return json;
}

/** Default school-level fields */
const SCHOOL_FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.school_url',
  'school.ownership',
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.cost.avg_net_price.overall',
  'latest.admissions.admission_rate.overall',
  'latest.completion.rate_suppressed.overall',
  'latest.earnings.10_yrs_after_entry.median',
];

/** Program-level fields (CIP 4-digit) */
const PROGRAM_FIELDS = [
  ...SCHOOL_FIELDS,
  'latest.programs.cip_4_digit.code',
  'latest.programs.cip_4_digit.title',
  'latest.programs.cip_4_digit.credential.level',
  'latest.programs.cip_4_digit.earnings.highest.3_yr.overall_median_earnings',
];

/**
 * Search schools offering a specific CIP-4 program.
 * @param {string} cipCode — 4-digit CIP code, e.g. '1107' (Computer Science)
 * @param {object} [options]
 * @param {number} [options.page=0]
 * @param {number} [options.perPage=20]
 * @param {string[]} [options.fields]
 * @returns {Promise<{metadata: object, results: object[]}>}
 */
export async function searchByProgram(cipCode, options = {}) {
  const { page = 0, perPage = 20, fields = PROGRAM_FIELDS } = options;

  const cacheKey = `prog:${cipCode}:${page}:${perPage}`;
  const url = buildUrl({
    'latest.programs.cip_4_digit.code': cipCode,
    fields: fields.join(','),
    page: String(page),
    per_page: String(perPage),
    sort: 'latest.earnings.10_yrs_after_entry.median:desc',
  });

  return cachedFetch(cacheKey, url);
}

/**
 * Search schools by name.
 * @param {string} name — partial school name
 * @param {object} [options]
 * @returns {Promise<{metadata: object, results: object[]}>}
 */
export async function searchByName(name, options = {}) {
  const { page = 0, perPage = 20, fields = SCHOOL_FIELDS } = options;

  const cacheKey = `name:${name}:${page}:${perPage}`;
  const url = buildUrl({
    'school.name': name,
    fields: fields.join(','),
    page: String(page),
    per_page: String(perPage),
  });

  return cachedFetch(cacheKey, url);
}

/**
 * Get a single school by ID.
 * @param {number|string} schoolId
 * @returns {Promise<object|null>}
 */
export async function getSchoolById(schoolId) {
  const cacheKey = `school:${schoolId}`;
  const url = buildUrl({
    id: String(schoolId),
    fields: SCHOOL_FIELDS.join(','),
  });

  const json = await cachedFetch(cacheKey, url);
  return json.results?.[0] || null;
}

/**
 * Get average tuition across schools for a CIP program.
 * Uses bundled static data (primary) with live API fallback.
 * @param {string} cipCode
 * @param {number} [sampleSize=50]
 * @returns {Promise<{inState: number, outOfState: number, netPrice: number, sampleCount: number}>}
 */
export async function getAverageTuition(cipCode, sampleSize = 50) {
  // Primary: static bundled data (no CORS issues)
  try {
    const data = await getStaticTuition();
    const entry = data.programs?.[cipCode];
    if (entry?.netPrice != null) {
      return { ...entry };
    }
  } catch { /* fall through to live API */ }

  // Fallback: live Scorecard API (works server-side or with CORS proxy)
  const perPage = Math.min(sampleSize, 100);
  const data = await searchByProgram(cipCode, { perPage });
  const schools = data.results || [];

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

export { SCHOOL_FIELDS, PROGRAM_FIELDS };
