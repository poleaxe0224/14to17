/**
 * Lightweight i18n system.
 *
 * - JSON translation files (en.json, zh-TW.json)
 * - DOM elements with data-i18n, data-i18n-placeholder, data-i18n-title
 * - t(key) for programmatic access
 * - Persists choice in localStorage
 * - Dispatches 'locale-changed' event on switch
 */

const SUPPORTED = ['en', 'zh-TW'];
const translations = {};
let current = 'en';

/** Static loader map — avoids Vite dynamic-import-vars warning */
const LOADERS = {
  'en': () => import('./en.json'),
  'zh-TW': () => import('./zh-TW.json'),
};

async function load(locale) {
  if (translations[locale]) return;
  const loader = LOADERS[locale];
  if (!loader) return;
  const mod = await loader();
  translations[locale] = mod.default;
}

function resolve(key, locale = current) {
  const dict = translations[locale];
  if (!dict) return key;

  const parts = key.split('.');
  let value = dict;
  for (const p of parts) {
    if (value == null) return key;
    value = value[p];
  }
  return value ?? key;
}

function applyToDOM() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = resolve(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = resolve(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = resolve(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = resolve(el.getAttribute('data-i18n-html'));
  });
  document.documentElement.lang = current;
}

/**
 * Get a translated string by dot-notation key.
 */
export function t(key) {
  return resolve(key);
}

/**
 * Get current locale.
 */
export function getLocale() {
  return current;
}

/**
 * Switch locale and re-apply translations.
 */
export async function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) return;
  await load(locale);
  current = locale;
  localStorage.setItem('eduroi-locale', locale);
  applyToDOM();
  document.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
}

/**
 * Toggle between en ↔ zh-TW.
 */
export function toggleLocale() {
  const next = current === 'en' ? 'zh-TW' : 'en';
  return setLocale(next);
}

/**
 * Initialize i18n — call once at app startup.
 * Detects saved preference or browser language.
 */
export async function initI18n() {
  const saved = localStorage.getItem('eduroi-locale');
  const browserLang = navigator.language || 'en';
  const initial = saved || (browserLang.startsWith('zh') ? 'zh-TW' : 'en');

  // Pre-load both locales for instant switching
  await Promise.all(SUPPORTED.map(load));
  current = initial;
  applyToDOM();

  // Re-apply after route changes inject new DOM
  document.addEventListener('route-changed', applyToDOM);
}
