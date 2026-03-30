import { t } from '../i18n/i18n.js';

export function render({ soc } = {}) {
  return `
    <section class="placeholder-view">
      <h2 data-i18n="detail.title">${t('detail.title')}</h2>
      ${soc ? `<p>SOC: <code>${soc}</code></p>` : ''}
      <p data-i18n="detail.coming_soon">${t('detail.coming_soon')}</p>
      <a href="#/search" role="button" class="outline" data-i18n="common.back">${t('common.back')}</a>
    </section>
  `;
}
