import { t } from '../i18n/i18n.js';

export function render() {
  return `
    <section class="placeholder-view">
      <h2 data-i18n="compare.title">${t('compare.title')}</h2>
      <p data-i18n="compare.coming_soon">${t('compare.coming_soon')}</p>
    </section>
  `;
}
