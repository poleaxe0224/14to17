/**
 * Detail view rendering helpers — extracted from detail.js.
 *
 * Pure rendering functions: take data, return HTML strings.
 * No DOM manipulation, no side effects.
 */

import { t } from '../i18n/i18n.js';
import { formatCurrency, formatNumber } from '../utils/format.js';

/**
 * Render wage data as a definition list.
 * @param {object|null} wageData — from bls.getWageData()
 * @returns {{ html: string, medianSalary: number, totalEmployment: number|null }}
 */
export function renderWagePanel(wageData) {
  if (!wageData) {
    return { html: `<p class="error-text">${t('detail.error_wages')}</p>`, medianSalary: 50_000, totalEmployment: null };
  }

  const w = wageData;
  const medianSalary = w.annualMedian || 50_000;
  const totalEmployment = w.employment ?? w.tot_emp ?? null;

  const wageRows = [
    [t('detail.annual_median'), formatCurrency(w.annualMedian), 'wage-highlight'],
    [t('detail.annual_mean'), formatCurrency(w.annualMean)],
    [t('detail.percentile_10'), formatCurrency(w.annual10)],
    [t('detail.percentile_25'), formatCurrency(w.annual25)],
    [t('detail.percentile_75'), formatCurrency(w.annual75)],
    [t('detail.percentile_90'), formatCurrency(w.annual90)],
  ].filter(([, val]) => val !== 'N/A');

  if (w.employment) wageRows.push([t('detail.employment'), formatNumber(w.employment)]);
  if (w.year) wageRows.push([t('detail.data_year'), String(Number(w.year))]);

  const html = `
    <dl class="detail-dl">
      ${wageRows.map(([dt, dd, cls]) => `<dt>${dt}</dt><dd${cls ? ` class="${cls}"` : ''}>${dd}</dd>`).join('')}
    </dl>
  `;

  return { html, medianSalary, totalEmployment };
}

/**
 * Render tuition data as a definition list.
 * @param {object|null} tuitionData — from scorecard.getAverageTuition()
 * @returns {{ html: string, avgTuition: number }}
 */
export function renderTuitionPanel(tuitionData) {
  if (!tuitionData) {
    return { html: `<p class="muted">${t('detail.tuition_unavailable')}</p>`, avgTuition: 20_000 };
  }

  const tu = tuitionData;
  const avgTuition = tu.netPrice || tu.inState || 20_000;
  const parts = [];

  if (tu.netPrice != null) {
    parts.push(`<dt>${t('detail.avg_tuition')}</dt><dd>${formatCurrency(tu.netPrice)} ${t('detail.per_year')}</dd>`);
  }
  if (tu.inState != null) {
    parts.push(`<dt>${t('detail.tuition_in_state')}</dt><dd>${formatCurrency(tu.inState)} ${t('detail.per_year')}</dd>`);
  }
  if (tu.outOfState != null) {
    parts.push(`<dt>${t('detail.tuition_out_state')}</dt><dd>${formatCurrency(tu.outOfState)} ${t('detail.per_year')}</dd>`);
  }
  if (tu.sampleCount) {
    parts.push(`<dt></dt><dd class="muted">${t('detail.sample_schools').replace('{count}', tu.sampleCount)}</dd>`);
  }

  const html = parts.length
    ? `<dl class="detail-dl">${parts.join('')}</dl>`
    : `<p class="muted">${t('detail.tuition_unavailable')}</p>`;

  return { html, avgTuition };
}

/**
 * Render IPEDS data as a panel.
 * @param {object|null} ipedsData — from ipeds.getIpedsData()
 * @param {number|null} totalEmployment — from wage data
 * @returns {{ html: string, graduationRate: number|null, completionsTotal: number|null }}
 */
export function renderIpedsPanel(ipedsData, totalEmployment) {
  const graduationRate = ipedsData?.graduationRate ?? null;
  const completionsTotal = ipedsData?.completionsTotal ?? null;

  if (!ipedsData) {
    return { html: '', graduationRate, completionsTotal };
  }

  const rows = [];
  if (graduationRate != null) {
    rows.push([t('ipeds.graduation_rate'), `${(graduationRate * 100).toFixed(1)}%`]);
  }
  if (completionsTotal != null) {
    rows.push([t('ipeds.completions'), formatNumber(completionsTotal)]);
  }
  if (totalEmployment != null) {
    rows.push([t('ipeds.market_employment'), formatNumber(totalEmployment)]);
  }
  if (completionsTotal != null && totalEmployment != null && totalEmployment > 0) {
    const ratio = (completionsTotal / totalEmployment * 100).toFixed(2);
    rows.push([t('ipeds.saturation_ratio'), `${ratio}%`]);
  }

  const html = rows.length
    ? `<article class="detail-panel ipeds-panel">
        <h3>IPEDS</h3>
        <dl class="detail-dl">
          ${rows.map(([dt, dd]) => `<dt>${dt}</dt><dd>${dd}</dd>`).join('')}
        </dl>
      </article>`
    : '';

  return { html, graduationRate, completionsTotal };
}

/**
 * Render three-layer ROI cards.
 * @param {{ basic: object, riskAdjusted: object, competitionAdjusted: object }} layers
 * @returns {string}
 */
/**
 * Render the "Calculate ROI" call-to-action button.
 * @param {{ soc: string, tuition: number, salary: number, years: number, baseline: number }} p
 * @returns {string}
 */
export function renderCtaButton({ soc, tuition, salary, years, baseline }) {
  const params = new URLSearchParams({
    soc,
    tuition,
    salary,
    years,
    baseline,
  });
  return `
    <a href="#/calculator?${params}" role="button" class="cta-btn">
      ${t('detail.calculate_roi')}
    </a>
  `;
}

export function renderRoiLayers(layers) {
  const { basic, riskAdjusted, competitionAdjusted } = layers;

  const fallbacks = [];
  if (riskAdjusted.fallback) fallbacks.push(t('ipeds.fallback_no_grad'));
  if (competitionAdjusted.fallback) fallbacks.push(t('ipeds.fallback_no_competition'));

  return `
    <h3 style="margin-top:var(--space-lg)">ROI</h3>
    <div class="roi-layers-grid">
      <div class="roi-layer-card">
        <div class="roi-layer-label">${t('ipeds.basic_roi')}</div>
        <div class="roi-layer-value">${basic.roi.toFixed(1)}%</div>
        <div class="roi-layer-discounted muted">${t('ipeds.discounted_roi_desc')}: ${basic.discountedRoi.toFixed(1)}%</div>
        <div class="roi-layer-desc muted">${t('ipeds.basic_roi_desc')}</div>
      </div>
      <div class="roi-layer-card ${riskAdjusted.fallback ? 'roi-layer-fallback' : ''}">
        <div class="roi-layer-label">${t('ipeds.risk_adjusted_roi')}</div>
        <div class="roi-layer-value">${riskAdjusted.roi.toFixed(1)}%</div>
        <div class="roi-layer-discounted muted">${t('ipeds.discounted_roi_desc')}: ${riskAdjusted.discountedRoi.toFixed(1)}%</div>
        <div class="roi-layer-desc muted">${t('ipeds.risk_adjusted_desc')}</div>
      </div>
      <div class="roi-layer-card roi-layer-primary ${competitionAdjusted.fallback ? 'roi-layer-fallback' : ''}">
        <div class="roi-layer-badge">${t('ipeds.recommended')}</div>
        <div class="roi-layer-label">${t('ipeds.competition_adjusted_roi')}</div>
        <div class="roi-layer-value" id="competition-roi-value">${competitionAdjusted.roi.toFixed(1)}%</div>
        <div class="roi-layer-discounted muted" id="competition-roi-discounted">${t('ipeds.discounted_roi_desc')}: ${competitionAdjusted.discountedRoi.toFixed(1)}%</div>
        <div class="roi-layer-desc muted">${t('ipeds.competition_adjusted_desc')}</div>
      </div>
    </div>
    ${fallbacks.length ? `<div class="roi-fallback-notes">${fallbacks.map((f) => `<p class="muted">${f}</p>`).join('')}</div>` : ''}
  `;
}
