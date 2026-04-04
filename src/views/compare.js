import { t, getLocale } from '../i18n/i18n.js';
import { CAREER_MAPPINGS, findBySoc } from '../engine/mappings.js';
import { fetchCareerEconomics } from '../api/career-data.js';
import { formatCurrency, formatPercent } from '../utils/format.js';
import { exportPdf } from '../utils/export-pdf.js';
import { trackEvent } from '../tracker/tracker.js';

const getChart = () => window.Chart;

/** State: selected SOC codes */
let selections = ['', ''];
let comparisonChart = null;

function careerName(career) {
  return getLocale() === 'zh-TW' ? career.careerZh : career.career;
}

function optionsHtml(selectedSoc, excludeSocs) {
  const opts = CAREER_MAPPINGS
    .filter((c) => c.soc === selectedSoc || !excludeSocs.includes(c.soc))
    .map((c) => `<option value="${c.soc}" ${c.soc === selectedSoc ? 'selected' : ''}>${careerName(c)} (${c.soc})</option>`)
    .join('');
  return `<option value="">${t('compare.select_career')}</option>${opts}`;
}

function renderSelectors() {
  const otherSocs = selections.filter(Boolean);
  return selections.map((soc, i) => `
    <div class="compare-selector">
      <select class="career-select" data-idx="${i}">
        ${optionsHtml(soc, otherSocs)}
      </select>
      ${i >= 2 ? `<button type="button" class="outline remove-btn" data-idx="${i}">${t('compare.remove')}</button>` : ''}
    </div>
  `).join('');
}

export function render() {
  selections = ['', ''];
  return `
    <section class="compare-view">
      <h2 data-i18n="compare.title">${t('compare.title')}</h2>
      <p class="compare-subtitle" data-i18n="compare.subtitle">${t('compare.subtitle')}</p>

      <div id="compare-selectors" class="compare-selectors">
        ${renderSelectors()}
      </div>

      <div class="compare-actions">
        <button type="button" id="add-career-btn" class="outline">${t('compare.add_career')}</button>
        <button type="button" id="compare-btn">${t('compare.compare_btn')}</button>
      </div>

      <div id="compare-msg" class="compare-msg"></div>
      <div id="compare-results" class="hidden"></div>
      <div id="compare-chart-wrap" class="compare-chart-wrap hidden">
        <canvas id="compare-chart"></canvas>
      </div>
      <div id="compare-pdf-wrap" class="hidden" style="text-align:center; margin-top:var(--space-lg);">
        <button type="button" id="compare-export-pdf" class="outline">${t('pdf.export')}</button>
      </div>
    </section>
  `;
}

/** Fetch tuition + wage + IPEDS for one career, return enriched object */
async function fetchCareerData(career) {
  const econ = await fetchCareerEconomics(career);
  return {
    career,
    duration: econ.duration,
    baseline: econ.baseline,
    medianSalary: econ.medianSalary,
    annualTuition: econ.avgTuition,
    salaryFallback: econ.salaryFallback,
    graduationRate: econ.graduationRate,
    roi: econ.roi,
  };
}

function bestIdx(values, mode = 'max') {
  let best = mode === 'max' ? -Infinity : Infinity;
  let idx = 0;
  values.forEach((v, i) => {
    if (v == null) return;
    if (mode === 'max' ? v > best : v < best) { best = v; idx = i; }
  });
  return idx;
}

function renderTable(results) {
  const isZh = getLocale() === 'zh-TW';
  const hasFallback = results.some((r) => r.salaryFallback);

  // Helper to mark best value
  const best = (vals, mode = 'max') => {
    const bi = bestIdx(vals, mode);
    return vals.map((v, i) => i === bi ? 'best-cell' : '');
  };

  const npvs = results.map((r) => r.roi.npv);
  const irrs = results.map((r) => r.roi.irr);
  const rois = results.map((r) => r.roi.lifetime.roi);
  const gains = results.map((r) => r.roi.lifetime.netGain);
  const bkevens = results.map((r) => r.roi.breakevenYear);
  const payments = results.map((r) => r.roi.loan.monthlyPayment);
  const gradRates = results.map((r) => r.graduationRate);
  const adjRois = results.map((r) => r.roi.layers?.competitionAdjusted?.roi ?? r.roi.lifetime.roi);

  const npvBest = best(npvs);
  const irrBest = best(irrs);
  const roiBest = best(rois);
  const gainBest = best(gains);
  const bkBest = best(bkevens.map((b) => b ?? 999), 'min');
  const payBest = best(payments, 'min');
  const gradBest = best(gradRates.map((g) => g ?? -1));
  const adjRoiBest = best(adjRois);

  function row(label, cells) {
    return `<tr><th>${label}</th>${cells.map((c) => `<td${c.cls ? ` class="${c.cls}"` : ''}>${c.val}</td>`).join('')}</tr>`;
  }

  const breakevenText = (v) => v != null ? `${v} ${t('compare.breakeven').includes('年') ? '' : t('calculator.years')}` : t('compare.never');

  return `
    <h3>${t('compare.results_title')}</h3>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th></th>
            ${results.map((r) => `<th>${careerName(r.career)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${row(t('compare.degree'), results.map((r) => ({ val: t('common.degree_' + r.career.typicalDegree) })))}
          ${row(t('compare.duration_label'), results.map((r) => ({ val: `${r.duration} ${t('calculator.years')}` })))}
          ${row(t('compare.tuition_label'), results.map((r) => ({ val: formatCurrency(r.annualTuition) })))}
          ${row(t('compare.salary_label'), results.map((r, i) => ({ val: formatCurrency(r.medianSalary) + (r.salaryFallback ? ' *' : '') })))}
          ${row(t('ipeds.graduation_rate'), results.map((r, i) => ({ val: r.graduationRate != null ? `${(r.graduationRate * 100).toFixed(1)}%` : t('ipeds.data_unavailable'), cls: gradBest[i] })))}
          ${row(t('compare.npv'), results.map((r, i) => ({ val: formatCurrency(r.roi.npv), cls: `${npvBest[i]} ${r.roi.npv >= 0 ? 'roi-positive' : 'roi-negative'}` })))}
          ${row(t('compare.irr'), results.map((r, i) => ({ val: formatPercent(r.roi.irr), cls: irrBest[i] })))}
          ${row(t('compare.breakeven'), results.map((r, i) => ({ val: breakevenText(r.roi.breakevenYear), cls: bkBest[i] })))}
          ${row(t('compare.lifetime_roi'), results.map((r, i) => ({ val: `${r.roi.lifetime.roi.toFixed(1)}%`, cls: `${roiBest[i]} ${r.roi.lifetime.roi >= 0 ? 'roi-positive' : 'roi-negative'}` })))}
          ${row(t('ipeds.competition_adjusted_roi'), results.map((r, i) => ({ val: `${adjRois[i].toFixed(1)}%`, cls: `${adjRoiBest[i]} ${adjRois[i] >= 0 ? 'roi-positive' : 'roi-negative'}` })))}
          ${row(t('compare.net_gain'), results.map((r, i) => ({ val: formatCurrency(r.roi.lifetime.netGain), cls: `${gainBest[i]} ${r.roi.lifetime.netGain >= 0 ? 'roi-positive' : 'roi-negative'}` })))}
          ${row(t('compare.total_cost'), results.map((r) => ({ val: formatCurrency(r.roi.lifetime.totalCost) })))}
          ${row(t('compare.monthly_payment'), results.map((r, i) => ({ val: formatCurrency(r.roi.loan.monthlyPayment), cls: payBest[i] })))}
        </tbody>
      </table>
    </div>
    ${hasFallback ? `<p class="muted">${t('compare.salary_note')}</p>` : ''}
  `;
}

function renderChart(results) {
  if (comparisonChart) { comparisonChart.destroy(); comparisonChart = null; }

  const ChartCtor = getChart();
  if (!ChartCtor) return;

  const ctx = document.getElementById('compare-chart');
  if (!ctx) return;

  const labels = results.map((r) => careerName(r.career));
  const colors = ['#2563eb', '#059669', '#d97706'];

  comparisonChart = new ChartCtor(ctx, {
    type: 'bar',
    data: {
      labels: [t('compare.npv'), t('compare.net_gain'), t('compare.total_cost')],
      datasets: results.map((r, i) => ({
        label: labels[i],
        data: [r.roi.npv, r.roi.lifetime.netGain, r.roi.lifetime.totalCost],
        backgroundColor: colors[i % colors.length],
      })),
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: t('compare.chart_title') },
      },
      scales: {
        y: {
          ticks: { callback: (v) => formatCurrency(v) },
        },
      },
    },
  });
}

export function afterRender() {
  const selectorsEl = document.getElementById('compare-selectors');
  const addBtn = document.getElementById('add-career-btn');
  const compareBtn = document.getElementById('compare-btn');
  const msgEl = document.getElementById('compare-msg');
  const resultsEl = document.getElementById('compare-results');
  const chartWrap = document.getElementById('compare-chart-wrap');
  const pdfWrap = document.getElementById('compare-pdf-wrap');

  function refreshSelectors() {
    selectorsEl.innerHTML = renderSelectors();
    addBtn.style.display = selections.length >= 3 ? 'none' : '';
  }

  // Event delegation for selects and remove buttons
  selectorsEl.addEventListener('change', (e) => {
    if (e.target.matches('.career-select')) {
      const idx = Number(e.target.dataset.idx);
      selections[idx] = e.target.value;
      refreshSelectors();
    }
  });

  selectorsEl.addEventListener('click', (e) => {
    if (e.target.matches('.remove-btn')) {
      const idx = Number(e.target.dataset.idx);
      selections.splice(idx, 1);
      refreshSelectors();
    }
  });

  addBtn.addEventListener('click', () => {
    if (selections.length < 3) {
      selections.push('');
      refreshSelectors();
    }
  });

  compareBtn.addEventListener('click', async () => {
    const valid = selections.filter(Boolean);
    if (valid.length < 2) {
      msgEl.textContent = t('compare.no_selection');
      msgEl.className = 'compare-msg error-text';
      return;
    }

    msgEl.textContent = t('compare.comparing');
    msgEl.className = 'compare-msg loading-text';
    compareBtn.disabled = true;

    try {
      const careers = valid.map((soc) => findBySoc(soc));
      const results = await Promise.all(careers.map(fetchCareerData));

      trackEvent('compare', { socs: valid });

      resultsEl.innerHTML = renderTable(results);
      resultsEl.classList.remove('hidden');

      chartWrap.classList.remove('hidden');
      renderChart(results);

      pdfWrap.classList.remove('hidden');
      msgEl.textContent = '';
      msgEl.className = 'compare-msg';

      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      msgEl.textContent = t('common.error');
      msgEl.className = 'compare-msg error-text';
    } finally {
      compareBtn.disabled = false;
    }
  });

  // PDF export
  const exportBtn = document.getElementById('compare-export-pdf');
  exportBtn.addEventListener('click', () => {
    exportPdf(resultsEl, {
      filename: 'education-roi-comparison',
      orientation: 'landscape',
      statusBtn: exportBtn,
    });
  });
}
