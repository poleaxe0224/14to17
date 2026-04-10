/**
 * Detail view — ROI deep dive for a career.
 *
 * Thin orchestrator: renders the shell, fetches data via shared career-data
 * service, then delegates to detail-renderers (pure HTML) and detail-sliders.
 *
 * Route: #/detail/:soc (accessed from Profile page)
 */

import { t, getLocale } from '../i18n/i18n.js';
import { findBySoc, getEducationDuration, isGraduateDegree, getGradPhaseDuration } from '../engine/mappings.js';
import { fetchCareerEconomics } from '../api/career-data.js';
import {
  renderWagePanel,
  renderTuitionPanel,
  renderIpedsPanel,
  renderRoiLayers,
  renderCtaButton,
  renderUndergradMajorSelect,
} from './detail-renderers.js';
import { renderSliderPanel, wireSliders } from './detail-sliders.js';
import { trackEvent } from '../tracker/tracker.js';
import { tooltip, degreeLabel } from '../utils/glossary.js';
import { exportPdf, renderShareMenu, initShareHandlers } from '../utils/export-pdf.js';
import { renderBreakevenChart } from './detail-chart.js';

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
  const subName = isZh ? career.career : '';
  const duration = getEducationDuration(career.typicalDegree);
  const isGrad = isGraduateDegree(career.typicalDegree);
  const gradPhase = isGrad ? getGradPhaseDuration(career.typicalDegree) : null;

  // Duration display: "6 years (4 undergrad + 2 grad)" for graduate degrees
  const durationLabel = isGrad
    ? `${duration} ${t('detail.years')} <span class="muted">(4 ${t('detail.undergrad')} + ${gradPhase} ${t('detail.grad')})</span>`
    : `${duration} ${t(duration === 1 ? 'detail.year' : 'detail.years')}`;

  return `
    <section class="detail-view">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="#/search">${t('detail.breadcrumb_search')}</a>
        <span aria-hidden="true">/</span>
        <a href="#/profile/${soc}">${t('detail.breadcrumb_profile')}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${t('detail.breadcrumb_detail')}</span>
      </nav>
      <h2>${name}</h2>
      <p class="detail-sub">${subName}</p>

      <div class="detail-grid">
        <article class="detail-panel">
          <h3>${tooltip(t('detail.wage_data'), 'bls')}</h3>
          <div id="wage-content" aria-live="polite">
            <p class="loading-text">${t('detail.loading')}</p>
          </div>
        </article>

        <article class="detail-panel">
          <h3>${t('detail.education_info')}</h3>
          <dl class="detail-dl">
            <dt>${t('detail.typical_degree')}</dt>
            <dd>${degreeLabel(career.typicalDegree)}</dd>
            <dt>${t('detail.education_duration')}</dt>
            <dd>${durationLabel}</dd>
            <dt>${tooltip(t('detail.soc_code'), 'soc')}</dt>
            <dd><code>${career.soc}</code></dd>
            <dt>${tooltip(t('detail.cip_code'), 'cip')}</dt>
            <dd><code>${career.cip}</code></dd>
          </dl>
          ${isGrad ? '<div id="undergrad-major-wrap"></div>' : ''}
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

      <div id="breakeven-chart-wrap" class="breakeven-chart-wrap hidden">
        <h3>${t('detail.breakeven_chart')}</h3>
        <canvas id="breakeven-chart" role="img" aria-label="${t('detail.breakeven_chart_label')}"></canvas>
        <p class="breakeven-note">${t('detail.breakeven_note')}</p>
      </div>

      <div id="roi-cta" class="roi-cta hidden"></div>

      <div id="detail-pdf-wrap" class="action-bar hidden" style="text-align:center; margin-top:var(--space-lg); display:flex; gap:var(--space-md); justify-content:center; align-items:start; flex-wrap:wrap;">
        <button type="button" id="detail-export-pdf" class="outline">${t('pdf.export')}</button>
        ${renderShareMenu('detail-share-msg')}
      </div>
    </section>
  `;
}

export async function afterRender({ soc } = {}) {
  const career = findBySoc(soc);
  if (!career) return;

  trackEvent('view_detail', { soc });

  // Fetch all economic data via shared service
  let econ = await fetchCareerEconomics(career);

  // Render wage panel
  const wageEl = document.getElementById('wage-content');
  if (!wageEl) return;
  const { html: wageHtml } = renderWagePanel(econ.wageData);
  wageEl.innerHTML = wageHtml;

  // Render undergrad major selector for graduate degrees
  const majorWrap = document.getElementById('undergrad-major-wrap');
  const defaultUndergradCip = career.defaultUndergradCip || null;
  if (majorWrap && econ.isGraduateDegree) {
    majorWrap.innerHTML = renderUndergradMajorSelect(defaultUndergradCip);
    // Re-fetch with default undergrad CIP for initial tuition estimate
    if (defaultUndergradCip) {
      econ = await fetchCareerEconomics(career, { undergradCip: defaultUndergradCip });
    }
  }

  // Render all panels from current econ data
  renderEconPanels(econ, career);

  // Show PDF export bar once data is loaded
  const pdfWrap = document.getElementById('detail-pdf-wrap');
  if (pdfWrap) {
    pdfWrap.classList.remove('hidden');

    const pdfBtn = document.getElementById('detail-export-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        const content = document.querySelector('.detail-view');
        exportPdf(content, { statusBtn: pdfBtn });
      });
    }

    const shareMsgEl = document.getElementById('detail-share-msg');
    initShareHandlers(pdfWrap, () => `#/detail/${soc}`, shareMsgEl);
  }

  // Wire undergrad major change handler
  if (majorWrap && econ.isGraduateDegree) {
    const select = document.getElementById('undergrad-major-select');
    if (select) {
      select.addEventListener('change', async () => {
        const cip = select.value || null;
        econ = await fetchCareerEconomics(career, { undergradCip: cip });
        renderEconPanels(econ, career);
      });
    }
  }
}

/**
 * Render tuition, IPEDS, ROI, breakeven chart, and CTA panels.
 * Extracted so it can be called on initial load and on undergrad major change.
 */
function renderEconPanels(econ, career) {
  // Render tuition panel (pass grad info for split display)
  const tuitionEl = document.getElementById('tuition-content');
  if (!tuitionEl) return;
  const { html: tuitionHtml } = renderTuitionPanel(econ.tuitionData, {
    isGraduateDegree: econ.isGraduateDegree,
    undergradTuition: econ.undergradTuition,
    gradTuition: econ.gradTuition,
  });
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

  // Show breakeven chart
  renderBreakevenChart(econ);

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

