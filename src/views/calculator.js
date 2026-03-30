import { t } from '../i18n/i18n.js';

export function render() {
  return `
    <section class="placeholder-view">
      <h2 data-i18n="calculator.title">${t('calculator.title')}</h2>
      <p data-i18n="calculator.coming_soon">${t('calculator.coming_soon')}</p>
    </section>
  `;
}
