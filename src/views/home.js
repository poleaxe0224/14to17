/**
 * Home view — career exploration entry point.
 *
 * Shows 4 interest-based category cards, popular career picks,
 * and a subtle "Advanced Tools" section at the bottom.
 */

import { t, getLocale } from '../i18n/i18n.js';
import { CAREER_MAPPINGS } from '../engine/mappings.js';

const INTEREST_GROUPS = [
  { key: 'build', icon: '\u{1F6E0}' },
  { key: 'help',  icon: '\u{1F91D}' },
  { key: 'analyze', icon: '\u{1F4CA}' },
  { key: 'create', icon: '\u{1F3A8}' },
];

/** Hand-picked popular careers (diverse across interest groups) */
const POPULAR_SOC = ['15-1252', '29-1141', '17-2141', '27-1024', '13-2051', '47-2111'];

function renderInterestCards() {
  return INTEREST_GROUPS.map((g) => {
    const count = CAREER_MAPPINGS.filter((c) => c.interests.includes(g.key)).length;
    return `
      <a href="#/search?interest=${g.key}" class="interest-card interest-card--${g.key}" aria-label="${t('interests.' + g.key)}">
        <span class="interest-card__icon" aria-hidden="true">${g.icon}</span>
        <h3 class="interest-card__title">${t('interests.' + g.key)}</h3>
        <p class="interest-card__desc">${t('interests.' + g.key + '_desc')}</p>
        <span class="interest-card__count">${count} careers</span>
      </a>
    `;
  }).join('');
}

function renderPopularCareers() {
  const isZh = getLocale() === 'zh-TW';
  return POPULAR_SOC
    .map((soc) => CAREER_MAPPINGS.find((c) => c.soc === soc))
    .filter(Boolean)
    .map((c) => `
      <a href="#/profile/${c.soc}" class="popular-card" data-category="${c.category}">
        <span class="popular-card__icon" aria-hidden="true">${c.icon}</span>
        <span class="popular-card__name">${isZh ? c.careerZh : c.career}</span>
      </a>
    `).join('');
}

export function render() {
  return `
    <section class="hero">
      <h1 data-i18n="home.title">${t('home.title')}</h1>
      <p data-i18n="home.subtitle">${t('home.subtitle')}</p>
    </section>

    <section class="home-interests">
      <h2 data-i18n="home.explore_by_interest">${t('home.explore_by_interest')}</h2>
      <div class="interest-grid">
        ${renderInterestCards()}
      </div>
    </section>

    <section class="home-popular">
      <h2 data-i18n="home.popular_careers">${t('home.popular_careers')}</h2>
      <div class="popular-grid">
        ${renderPopularCareers()}
      </div>
    </section>

    <section class="home-tools">
      <h2 data-i18n="home.tools_section">${t('home.tools_section')}</h2>
      <div class="tools-grid">
        <a href="#/calculator" class="tool-card">
          <h3>${t('home.tools_calculator')}</h3>
          <p class="muted">${t('home.tools_calculator_desc')}</p>
        </a>
        <a href="#/compare" class="tool-card">
          <h3>${t('home.tools_compare')}</h3>
          <p class="muted">${t('home.tools_compare_desc')}</p>
        </a>
      </div>
    </section>
  `;
}
