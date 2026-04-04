/**
 * Detail view — ROI deep dive for a career.
 *
 * Thin orchestrator: renders the shell, fetches data via shared career-data
 * service, then delegates to detail-renderers (pure HTML) and detail-sliders.
 *
 * Route: #/detail/:soc (accessed from Profile page)
 */

import { t, getLocale } from '../i18n/i18n.js';
import { findBySoc, getEducationDuration } from '../engine/mappings.js';
import { fetchCareerEconomics } from '../api/career-data.js';
import {
  renderWagePanel,
  renderTuitionPanel,
  renderIpedsPanel,
  renderRoiLayers,
  renderCtaButton,
} from './detail-renderers.js';
import { renderSliderPanel, wireSliders } from './detail-sliders.js';

export function render({ soc } = {}) {
  const career = findBySoc(soc);

  if (!career) {
    return `
      <section class="placeholder-view">
        <h2>${t('detail.not_found')}</h2>
        <p>${t('detail.not_found_msg').replace('{soc}', soc || '?')}</p>
        <a href="#/search" role="button" class="outline">${t('common.back')}</a>
      </section>
    `;
  }

  const isZh = getLocale() === 'zh-TW';
  const name = isZh ? career.careerZh : career.career;
  const subName = isZh ? career.career : career.careerZh;
  const duration = getEducationDuration(career.typicalDegree);

  return `
    <section class="detail-view">
      <a href="#/profile/${soc}" class="back-link">&larr; ${t('common.back')}</a>
      <h2>${name}</h2>
      <p class="detail-sub">${subName}</p>

      <div class="detail-grid">
        <article class="detail-panel">
          <h3>${t('detail.wage_data')}</h3>
          <div id="wage-content" aria-live="polite">
            <p class="loading-text">${t('detail.loading')}</p>
          </div>
        </article>

        <article class="detail-panel">
          <h3>${t('detail.education_info')}</h3>
          <dl class="detail-dl">
            <dt>${t('detail.typical_degree')}</dt>
            <dd>${t('common.degree_' + career.typicalDegree)}</dd>
            <dt>${t('detail.education_duration')}</dt>
            <dd>${duration} ${t(duration === 1 ? 'detail.year' : 'detail.years')}</dd>
            <dt>${t('detail.soc_code')}</dt>
            <dd><code>${career.soc}</code></dd>
            <dt>${t('detail.cip_code')}</dt>
            <dd><code>${career.cip}</code></dd>
          </dl>
          <div id="tuition-content" aria-live="polite">
            <p class="loading-text">${t('common.loading')}</p>
          </div>
        </article>
      </div>

      <div id="ipeds-content" aria-live="polite"></div>
      <div id="roi-layers" class="hidden"></div>

      <details id="advanced-params" class="advanced-params">
        <summary>${t('ipeds.advanced_params')}</summary>
        ${renderSliderPanel()}
      </details>

      <div id="roi-cta" class="roi-cta hidden"></div>
    </section>
  `;
}

export async function afterRender({ soc } = {}) {
  const career = findBySoc(soc);
  if (!career) return;

  // Re-render on locale change
  document.addEventListener('locale-changed', () => {
    const outlet = document.getElementById('app');
    if (!outlet || !document.getElementById('wage-content')) return;
    outlet.innerHTML = render({ soc });
    afterRender({ soc });
  }, { once: true });

  // Fetch all economic data via shared service
  const econ = await fetchCareerEconomics(career);

  // Render wage panel
  const wageEl = document.getElementById('wage-content');
  if (!wageEl) return;
  const { html: wageHtml } = renderWagePanel(econ.wageData);
  wageEl.innerHTML = wageHtml;

  // Render tuition panel
  const tuitionEl = document.getElementById('tuition-content');
  if (!tuitionEl) return;
  const { html: tuitionHtml } = renderTuitionPanel(econ.tuitionData);
  tuitionEl.innerHTML = tuitionHtml;

  // Render IPEDS panel
  const ipedsEl = document.getElementById('ipeds-content');
  if (!ipedsEl) return;
  const { html: ipedsHtml } = renderIpedsPanel(econ.ipedsData, econ.totalEmployment);
  ipedsEl.innerHTML = ipedsHtml;

  // Render three-layer ROI
  const roiLayersEl = document.getElementById('roi-layers');
  if (!roiLayersEl) return;

  const layerState = {
    annualTuition: econ.avgTuition,
    educationYears: econ.duration,
    postDegreeSalary: econ.medianSalary,
    baselineSalary: econ.baseline,
    graduationRate: econ.graduationRate,
    completionsTotal: econ.completionsTotal,
    totalEmployment: econ.totalEmployment,
  };

  roiLayersEl.innerHTML = renderRoiLayers(econ.roi.layers);
  roiLayersEl.classList.remove('hidden');

  // Wire sliders
  wireSliders(layerState);

  // Show CTA
  const ctaEl = document.getElementById('roi-cta');
  if (!ctaEl) return;
  ctaEl.innerHTML = renderCtaButton({
    soc: career.soc,
    tuition: econ.avgTuition,
    salary: econ.medianSalary,
    years: econ.duration,
    baseline: econ.baseline,
  });
  ctaEl.classList.remove('hidden');
}
