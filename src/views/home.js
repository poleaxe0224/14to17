import { t } from '../i18n/i18n.js';

export function render() {
  return `
    <section class="hero">
      <h1 data-i18n="home.title">${t('home.title')}</h1>
      <p data-i18n="home.subtitle">${t('home.subtitle')}</p>
      <div class="hero-actions">
        <a href="#/search" role="button" data-i18n="home.cta_search">${t('home.cta_search')}</a>
        <a href="#/calculator" role="button" class="outline" data-i18n="home.cta_calculator">${t('home.cta_calculator')}</a>
      </div>
    </section>

    <section class="features">
      <article class="feature-card">
        <span class="feature-icon" aria-hidden="true">📊</span>
        <h3 data-i18n="home.feature_wage_title">${t('home.feature_wage_title')}</h3>
        <p data-i18n="home.feature_wage_desc">${t('home.feature_wage_desc')}</p>
      </article>

      <article class="feature-card">
        <span class="feature-icon" aria-hidden="true">🎓</span>
        <h3 data-i18n="home.feature_cost_title">${t('home.feature_cost_title')}</h3>
        <p data-i18n="home.feature_cost_desc">${t('home.feature_cost_desc')}</p>
      </article>

      <article class="feature-card">
        <span class="feature-icon" aria-hidden="true">📈</span>
        <h3 data-i18n="home.feature_roi_title">${t('home.feature_roi_title')}</h3>
        <p data-i18n="home.feature_roi_desc">${t('home.feature_roi_desc')}</p>
      </article>
    </section>
  `;
}
