import { t, getLocale } from '../i18n/i18n.js';
import { findBySoc, getBaselineSalary, getEducationDuration } from '../engine/mappings.js';
import * as bls from '../api/bls.js';
import * as scorecard from '../api/scorecard.js';
import { formatCurrency, formatNumber } from '../utils/format.js';

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
      <a href="#/search" class="back-link">&larr; ${t('common.back')}</a>
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

      <div id="roi-cta" class="roi-cta hidden"></div>
    </section>
  `;
}

export async function afterRender({ soc } = {}) {
  const career = findBySoc(soc);
  if (!career) return;

  const duration = getEducationDuration(career.typicalDegree);
  const baseline = getBaselineSalary(career.typicalDegree);

  // Fetch BLS wage data and Scorecard tuition in parallel
  const [wageResult, tuitionResult] = await Promise.allSettled([
    bls.getWageData(career.soc),
    scorecard.getAverageTuition(career.cip),
  ]);

  // Render wage data
  const wageEl = document.getElementById('wage-content');
  if (!wageEl) return; // user navigated away

  let medianSalary = 50_000; // fallback

  if (wageResult.status === 'fulfilled' && wageResult.value) {
    const w = wageResult.value;
    medianSalary = w.annualMedian || medianSalary;
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

    wageEl.innerHTML = `
      <dl class="detail-dl">
        ${wageRows.map(([dt, dd, cls]) => `<dt>${dt}</dt><dd${cls ? ` class="${cls}"` : ''}>${dd}</dd>`).join('')}
      </dl>
    `;
  } else {
    wageEl.innerHTML = `<p class="error-text">${t('detail.error_wages')}</p>`;
  }

  // Render tuition data
  const tuitionEl = document.getElementById('tuition-content');
  if (!tuitionEl) return;

  let avgTuition = 20_000; // fallback

  if (tuitionResult.status === 'fulfilled' && tuitionResult.value) {
    const tu = tuitionResult.value;
    avgTuition = tu.netPrice || tu.inState || 20_000;
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
    tuitionEl.innerHTML = parts.length
      ? `<dl class="detail-dl">${parts.join('')}</dl>`
      : `<p class="muted">${t('detail.tuition_unavailable')}</p>`;
  } else {
    tuitionEl.innerHTML = `<p class="muted">${t('detail.tuition_unavailable')}</p>`;
  }

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
