import { t, getLocale } from '../i18n/i18n.js';
import { searchCareers, CAREER_MAPPINGS } from '../engine/mappings.js';

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

export function render() {
  return `
    <section class="search-view">
      <h2 data-i18n="search.title">${t('search.title')}</h2>
      <input type="search" id="career-search"
             placeholder="${t('search.placeholder')}"
             data-i18n-placeholder="search.placeholder"
             aria-label="${t('search.title')}"
             autofocus />
      <p id="search-count" class="search-count" role="status" aria-live="polite"></p>
      <div id="search-results" role="list" aria-label="${t('search.title')}">
        ${renderCards([...CAREER_MAPPINGS])}
      </div>
    </section>
  `;
}

export function afterRender() {
  const input = document.getElementById('career-search');
  const resultsEl = document.getElementById('search-results');
  const countEl = document.getElementById('search-count');

  function update() {
    const q = input.value.trim();
    const results = q ? searchCareers(q) : [...CAREER_MAPPINGS];
    resultsEl.innerHTML = renderCards(results);
    countEl.textContent = q
      ? t('search.results_count').replace('{count}', results.length)
      : '';
  }

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(update, 150);
  });
}
