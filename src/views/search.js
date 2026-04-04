/**
 * Search view — career exploration with keyword search + interest filters.
 *
 * Supports query param: #/search?interest=build
 * Filter chips let users switch interest groups or show all.
 */

import { t, getLocale } from '../i18n/i18n.js';
import { searchCareers, CAREER_MAPPINGS, findByInterest } from '../engine/mappings.js';

const INTEREST_KEYS = ['build', 'help', 'analyze', 'create'];

function degreeLabel(key) {
  return t(`common.degree_${key}`) || key;
}

function renderCards(careers) {
  if (careers.length === 0) {
    return `<p class="search-empty">${t('search.no_results')}</p>`;
  }

  const isZh = getLocale() === 'zh-TW';
  return `
    <div class="career-grid">
      ${careers.map((c) => `
        <a href="#/profile/${c.soc}" class="career-card" data-category="${c.category}" aria-label="${c.career} - ${c.careerZh}">
          <span class="career-card__icon" aria-hidden="true">${c.icon}</span>
          <h3>${isZh ? c.careerZh : c.career}</h3>
          <p class="career-card-sub">${isZh ? c.career : c.careerZh}</p>
          <div class="career-card-meta">
            <span class="badge">${degreeLabel(c.typicalDegree)}</span>
            <code>${c.soc}</code>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

function getActiveInterest() {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return null;
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  return params.get('interest');
}

function renderFilterChips(active) {
  const chips = INTEREST_KEYS.map((key) => {
    const isActive = key === active;
    return `<button type="button" class="chip ${isActive ? 'chip--active' : ''}" data-interest="${key}">${t('interests.' + key)}</button>`;
  });
  const allActive = !active;
  chips.unshift(
    `<button type="button" class="chip ${allActive ? 'chip--active' : ''}" data-interest="">${t('search.filter_all')}</button>`,
  );
  return `<div class="filter-chips" role="group" aria-label="Filter by interest">${chips.join('')}</div>`;
}

function getFilteredCareers(interest, query) {
  let base = interest ? findByInterest(interest) : [...CAREER_MAPPINGS];
  if (query) {
    const q = query.toLowerCase();
    base = base.filter(
      (m) => m.career.toLowerCase().includes(q) || m.careerZh.includes(query),
    );
  }
  return base;
}

export function render() {
  const active = getActiveInterest();
  const careers = getFilteredCareers(active, '');

  return `
    <section class="search-view">
      <h2 data-i18n="search.title">${t('search.title')}</h2>
      ${renderFilterChips(active)}
      <input type="search" id="career-search"
             placeholder="${t('search.placeholder')}"
             data-i18n-placeholder="search.placeholder"
             aria-label="${t('search.title')}"
             autofocus />
      <p id="search-count" class="search-count" role="status" aria-live="polite"></p>
      <div id="search-results" role="list" aria-label="${t('search.title')}">
        ${renderCards(careers)}
      </div>
    </section>
  `;
}

export function afterRender() {
  const input = document.getElementById('career-search');
  const resultsEl = document.getElementById('search-results');
  const countEl = document.getElementById('search-count');

  let activeInterest = getActiveInterest();

  function update() {
    const q = input.value.trim();
    const results = getFilteredCareers(activeInterest, q);
    resultsEl.innerHTML = renderCards(results);
    countEl.textContent = (q || activeInterest)
      ? t('search.results_count').replace('{count}', results.length)
      : '';
  }

  // Wire filter chips
  document.querySelectorAll('.chip[data-interest]').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeInterest = chip.dataset.interest || null;
      // Update active state
      document.querySelectorAll('.chip[data-interest]').forEach((c) => {
        c.classList.toggle('chip--active', c.dataset.interest === (activeInterest || ''));
      });
      update();
    });
  });

  // Wire search input
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(update, 150);
  });
}
