/**
 * Detail view — ROI deep dive for a career.
 *
 * Displays wage percentiles, tuition, IPEDS data, and three-layer ROI
 * with adjustable competition parameters.
 *
 * Route: #/detail/:soc (accessed from Profile page)
 * Rendering logic extracted to detail-renderers.js.
 */

import { t, getLocale } from '../i18n/i18n.js';
import { findBySoc, getBaselineSalary, getEducationDuration } from '../engine/mappings.js';
import { calcThreeLayerROI, DEFAULTS } from '../engine/roi.js';
import * as bls from '../api/bls.js';
import * as scorecard from '../api/scorecard.js';
import * as ipeds from '../api/ipeds.js';
import {
  renderWagePanel,
  renderTuitionPanel,
  renderIpedsPanel,
  renderRoiLayers,
} from './detail-renderers.js';

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
        <div class="slider-panel">
          <div class="slider-group">
            <label for="slider-k">
              ${t('ipeds.competition_sensitivity')}: <span id="k-value">${DEFAULTS.competitionK}</span>
            </label>
            <input type="range" id="slider-k" min="0.1" max="1.0" step="0.05" value="${DEFAULTS.competitionK}" />
            <small class="muted">${t('ipeds.competition_sensitivity_tip')}</small>
          </div>
          <div class="slider-group">
            <label for="slider-max-penalty">
              ${t('ipeds.max_penalty_cap')}: <span id="penalty-value">${(DEFAULTS.maxPenalty * 100).toFixed(0)}%</span>
            </label>
            <input type="range" id="slider-max-penalty" min="0.05" max="0.50" step="0.05" value="${DEFAULTS.maxPenalty}" />
            <small class="muted">${t('ipeds.max_penalty_tip')}</small>
          </div>
          <button type="button" id="reset-params" class="outline contrast">${t('ipeds.reset_defaults')}</button>
        </div>
      </details>

      <div id="roi-cta" class="roi-cta hidden"></div>
    </section>
  `;
}

/** Shared state for slider re-computation */
let _layerState = null;

export async function afterRender({ soc } = {}) {
  const career = findBySoc(soc);
  if (!career) return;

  // Re-render on locale change (section headings use t())
  function onLocaleChanged() {
    const outlet = document.getElementById('app');
    if (!outlet || !document.getElementById('wage-content')) return;
    outlet.innerHTML = render({ soc });
    afterRender({ soc });
  }
  document.addEventListener('locale-changed', onLocaleChanged, { once: true });

  const duration = getEducationDuration(career.typicalDegree);
  const baseline = getBaselineSalary(career.typicalDegree);

  // Fetch all data sources in parallel
  const [wageResult, tuitionResult, ipedsResult] = await Promise.allSettled([
    bls.getWageData(career.soc),
    scorecard.getAverageTuition(career.cip),
    ipeds.getIpedsData(career.cip),
  ]);

  // Render wage panel
  const wageEl = document.getElementById('wage-content');
  if (!wageEl) return;

  const wageData = wageResult.status === 'fulfilled' ? wageResult.value : null;
  const { html: wageHtml, medianSalary, totalEmployment } = renderWagePanel(wageData);
  wageEl.innerHTML = wageHtml;

  // Render tuition panel
  const tuitionEl = document.getElementById('tuition-content');
  if (!tuitionEl) return;

  const tuitionData = tuitionResult.status === 'fulfilled' ? tuitionResult.value : null;
  const { html: tuitionHtml, avgTuition } = renderTuitionPanel(tuitionData);
  tuitionEl.innerHTML = tuitionHtml;

  // Render IPEDS panel
  const ipedsEl = document.getElementById('ipeds-content');
  if (!ipedsEl) return;

  const ipedsData = ipedsResult.status === 'fulfilled' ? ipedsResult.value : null;
  const { html: ipedsHtml, graduationRate, completionsTotal } = renderIpedsPanel(ipedsData, totalEmployment);
  ipedsEl.innerHTML = ipedsHtml;

  // Compute and render three-layer ROI
  const roiLayersEl = document.getElementById('roi-layers');
  if (!roiLayersEl) return;

  _layerState = {
    annualTuition: avgTuition,
    educationYears: duration,
    postDegreeSalary: medianSalary,
    baselineSalary: baseline,
    graduationRate,
    completionsTotal,
    totalEmployment,
  };

  const result = calcThreeLayerROI(_layerState);
  roiLayersEl.innerHTML = renderRoiLayers(result.layers);
  roiLayersEl.classList.remove('hidden');

  // Wire up sliders
  wireSliders();

  // Show Calculate ROI button
  const ctaEl = document.getElementById('roi-cta');
  if (!ctaEl) return;

  const params = new URLSearchParams({
    soc: career.soc,
    tuition: avgTuition,
    salary: medianSalary,
    years: duration,
    baseline,
  });
  ctaEl.innerHTML = `
    <a href="#/calculator?${params}" role="button" class="cta-btn">
      ${t('detail.calculate_roi')}
    </a>
  `;
  ctaEl.classList.remove('hidden');
}

function wireSliders() {
  const sliderK = document.getElementById('slider-k');
  const sliderPenalty = document.getElementById('slider-max-penalty');
  const kValueEl = document.getElementById('k-value');
  const penaltyValueEl = document.getElementById('penalty-value');
  const resetBtn = document.getElementById('reset-params');

  function recalc() {
    if (!_layerState) return;
    const k = parseFloat(sliderK.value);
    const maxP = parseFloat(sliderPenalty.value);
    kValueEl.textContent = k.toFixed(2);
    penaltyValueEl.textContent = `${(maxP * 100).toFixed(0)}%`;

    const updated = calcThreeLayerROI({ ..._layerState, competitionK: k, maxPenalty: maxP });
    const compEl = document.getElementById('competition-roi-value');
    if (compEl) {
      compEl.textContent = `${updated.layers.competitionAdjusted.roi.toFixed(1)}%`;
    }
  }

  sliderK.addEventListener('input', recalc);
  sliderPenalty.addEventListener('input', recalc);
  resetBtn.addEventListener('click', () => {
    sliderK.value = DEFAULTS.competitionK;
    sliderPenalty.value = DEFAULTS.maxPenalty;
    recalc();
  });
}
