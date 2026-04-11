/**
 * IPEDS data service — graduation rates + completions.
 *
 * Uses bundled static data (primary) with live College Scorecard fallback
 * for graduation rates. Completions are curated from NCES.
 *
 * Regenerate with: node scripts/fetch-ipeds-data.mjs
 */

let staticIpeds = null;

async function getStaticIpeds() {
  if (staticIpeds) return staticIpeds;
  try {
    const mod = await import('../data/ipeds.json');
    staticIpeds = mod.default;
  } catch {
    staticIpeds = { by_cip: {} };
  }
  return staticIpeds;
}

let staticCrosswalk = null;

async function getStaticCrosswalk() {
  if (staticCrosswalk) return staticCrosswalk;
  try {
    const mod = await import('../data/cip-soc-crosswalk.json');
    staticCrosswalk = mod.default;
  } catch {
    staticCrosswalk = { mappings: [] };
  }
  return staticCrosswalk;
}

/**
 * Get IPEDS data for a CIP-4 code.
 * @param {string} cipCode — e.g. '1107'
 * @returns {Promise<{graduationRate: number|null, completionsTotal: number|null, cipTitle: string|null}>}
 */
export async function getIpedsData(cipCode) {
  const ipeds = await getStaticIpeds();
  const entry = ipeds.by_cip?.[cipCode];

  return {
    graduationRate: entry?.graduation_rate_150pct ?? null,
    completionsTotal: entry?.completions_total ?? null,
    cipTitle: entry?.cip_title ?? null,
    proxyCip: entry?.proxyCip ?? null,
    proxyTitle: entry?.proxyTitle ?? null,
  };
}

/**
 * Get primary SOC code for a CIP code from the crosswalk.
 * @param {string} cipCode — e.g. '1107'
 * @returns {Promise<string|null>}
 */
export async function getPrimarySoc(cipCode) {
  const crosswalk = await getStaticCrosswalk();
  const entry = crosswalk.mappings?.find((m) => m.cip_code === cipCode);
  return entry?.primary_soc ?? null;
}

/**
 * Get all SOC codes for a CIP code from the crosswalk.
 * @param {string} cipCode
 * @returns {Promise<string[]>}
 */
export async function getSocCodes(cipCode) {
  const crosswalk = await getStaticCrosswalk();
  const entry = crosswalk.mappings?.find((m) => m.cip_code === cipCode);
  return entry?.soc_codes ?? [];
}
