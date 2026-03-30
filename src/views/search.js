import { t } from '../i18n/i18n.js';

export function render() {
  return `
    <section class="placeholder-view">
      <h2 data-i18n="search.title">${t('search.title')}</h2>
      <p data-i18n="search.coming_soon">${t('search.coming_soon')}</p>
    </section>
  `;
}
