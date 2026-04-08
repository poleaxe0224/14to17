import { addRoute, setNotFound, initRouter, refresh } from './router/router.js';
import { initI18n, toggleLocale, getLocale, t } from './i18n/i18n.js';
import { findBySoc } from './engine/mappings.js';

import * as homeView from './views/home.js';
import * as searchView from './views/search.js';
import * as profileView from './views/profile.js';
import * as detailView from './views/detail.js';
import * as calculatorView from './views/calculator.js';
import * as compareView from './views/compare.js';
import * as reportView from './views/report.js';

/**
 * One-time migration: move legacy localStorage keys (career-compass-*, eduroi-*)
 * to the current 14to17-* namespace, then clean up.
 */
function migrateStorage() {
  const FLAG = '14to17-migrated';
  if (localStorage.getItem(FLAG)) return;

  const LEGACY_PREFIXES = ['career-compass-', 'eduroi-'];
  const KEY_MAP = {
    locale: '14to17-locale',
    tracker: '14to17-tracker',
  };

  for (const prefix of LEGACY_PREFIXES) {
    for (const [suffix, newKey] of Object.entries(KEY_MAP)) {
      const oldKey = prefix + suffix;
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldVal);
      }
      localStorage.removeItem(oldKey);
    }
  }

  localStorage.setItem(FLAG, '1');
}

function notFound() {
  return `
    <section class="placeholder-view">
      <h1>404</h1>
      <p>Page not found.</p>
      <a href="#/" role="button" class="outline">Home</a>
    </section>
  `;
}

function setupLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;

  function updateLabel() {
    // Show the OTHER language as the toggle label
    btn.textContent = getLocale() === 'en' ? '中文' : 'EN';
  }

  btn.addEventListener('click', async () => {
    await toggleLocale();
    updateLabel();
  });

  document.addEventListener('locale-changed', updateLabel);
  updateLabel();
}

function setupDisclaimerBanner() {
  const banner = document.getElementById('us-data-banner');
  const btn = document.getElementById('dismiss-banner');
  if (!banner || !btn) return;

  if (localStorage.getItem('14to17-banner-dismissed')) {
    banner.classList.add('hidden');
    return;
  }

  btn.addEventListener('click', () => {
    banner.classList.add('hidden');
    localStorage.setItem('14to17-banner-dismissed', '1');
  });
}

function updatePageTitle(path, params) {
  const suffix = t('page_title.suffix');
  const isZh = getLocale() === 'zh-TW';

  let pageTitle;
  if (path === '/') {
    pageTitle = t('page_title.home');
  } else if (path === '/search') {
    pageTitle = t('page_title.search');
  } else if (path.startsWith('/profile/') && params.soc) {
    const career = findBySoc(params.soc);
    const name = career ? (isZh ? career.careerZh : career.career) : params.soc;
    pageTitle = t('page_title.profile').replace('{name}', name);
  } else if (path.startsWith('/detail/') && params.soc) {
    const career = findBySoc(params.soc);
    const name = career ? (isZh ? career.careerZh : career.career) : params.soc;
    pageTitle = t('page_title.detail').replace('{name}', name);
  } else if (path === '/calculator') {
    pageTitle = t('page_title.calculator');
  } else if (path === '/compare') {
    pageTitle = t('page_title.compare');
  } else if (path === '/report') {
    pageTitle = t('page_title.report');
  } else {
    pageTitle = t('page_title.not_found');
  }

  document.title = `${pageTitle} — ${suffix}`;
}

function setupNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  function closeMenu() {
    menu.classList.remove('nav-menu--open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('nav-menu--open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when a nav link is clicked
  menu.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      closeMenu();
    }
  });

  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

export async function initApp() {
  // Migrate legacy localStorage keys before anything reads storage
  migrateStorage();

  // Register routes (views with afterRender pass the module; others pass render fn)
  addRoute('/', homeView);
  addRoute('/search', searchView);
  addRoute('/profile/:soc', profileView);
  addRoute('/detail/:soc', detailView);
  addRoute('/calculator', calculatorView);
  addRoute('/compare', compareView);
  addRoute('/report', reportView);
  setNotFound(notFound);

  // Init i18n (loads translations, applies to static DOM)
  await initI18n();

  // Init router (renders first view, applies i18n to dynamic DOM)
  initRouter('app');

  // Wire up language toggle button
  setupLangToggle();

  // Wire up mobile navigation toggle
  setupNavToggle();

  // Wire up US data disclaimer banner dismiss
  setupDisclaimerBanner();

  // Update page title on route change
  document.addEventListener('route-changed', (e) => {
    updatePageTitle(e.detail.path, e.detail.params);
  });

  // Re-render current route when locale changes (so t() calls in render() update)
  document.addEventListener('locale-changed', () => refresh());

  // Force re-render when clicking a nav link for the current route
  document.querySelectorAll('header nav a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('href').replace('#', '') || '/';
      const current = (window.location.hash.replace('#', '') || '/').split('?')[0];
      if (target === current) {
        e.preventDefault();
        refresh();
      }
    });
  });
}
