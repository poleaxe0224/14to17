/**
 * Occupation profile data service — BLS OOH-style career profiles.
 *
 * Data is split into three files for efficiency:
 * - occupation-profiles.json — structural data (urls, outlook, similar_soc) ~9KB
 * - profile-text-en.json — English descriptions ~18KB
 * - profile-text-zh-TW.json — Chinese descriptions ~15KB
 *
 * Only the current locale's text is loaded, reducing transfer by ~35%.
 */

import { getLocale } from '../i18n/i18n.js';

let staticProfiles = null;
const textCache = {};

async function getStaticProfiles() {
  if (staticProfiles) return staticProfiles;
  try {
    const mod = await import('../data/occupation-profiles.json');
    staticProfiles = mod.default;
  } catch {
    staticProfiles = { profiles: {} };
  }
  return staticProfiles;
}

async function getTextForLocale(locale) {
  if (textCache[locale]) return textCache[locale];
  try {
    const mod = locale === 'zh-TW'
      ? await import('../data/profile-text-zh-TW.json')
      : await import('../data/profile-text-en.json');
    textCache[locale] = mod.default;
  } catch {
    textCache[locale] = {};
  }
  return textCache[locale];
}

/**
 * Get occupation profile for a SOC code, merged with current locale's text.
 * @param {string} socCode — e.g. '15-1252'
 * @returns {Promise<object|null>}
 */
export async function getProfile(socCode) {
  const [data, text] = await Promise.all([
    getStaticProfiles(),
    getTextForLocale(getLocale()),
  ]);

  const structural = data.profiles?.[socCode];
  if (!structural) return null;

  const localeText = text[socCode] || {};

  return {
    ...structural,
    what_they_do: localeText.what_they_do ?? '',
    work_environment: localeText.work_environment ?? '',
    how_to_become: {
      education: localeText.how_to_become?.education ?? '',
      experience: localeText.how_to_become?.experience ?? '',
      training: localeText.how_to_become?.training ?? '',
    },
  };
}

/**
 * Get O*NET URL for a SOC code (deterministic).
 * @param {string} socCode
 * @returns {string}
 */
export function getOnetUrl(socCode) {
  return `https://www.onetonline.org/link/summary/${socCode}.00`;
}

/**
 * Get all available profile SOC codes.
 * @returns {Promise<string[]>}
 */
export async function getAvailableSocCodes() {
  const data = await getStaticProfiles();
  return Object.keys(data.profiles ?? {});
}
