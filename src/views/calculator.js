import { t, getLocale } from '../i18n/i18n.js';
import { calcFullROI, DEFAULTS } from '../engine/roi.js';
import { findBySoc } from '../engine/mappings.js';
import { fetchCareerEconomics } from '../api/career-data.js';
import { formatCurrency, formatPercent } from '../utils/format.js';
import { exportPdf, renderShareMenu, initShareHandlers } from '../utils/export-pdf.js';
import { trackEvent } from '../tracker/tracker.js';
import { loadChart } from '../utils/load-chart.js';
import { tooltip } from '../utils/glossary.js';

/** Parse query params from the hash (e.g. #/calculator?soc=15-1252&salary=120000) */
function getQueryParams() {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return {};
  return Object.fromEntries(new URLSearchParams(hash.slice(qIdx + 1)));
}

function field(name, label, value, attrs = '', helpKey = '') {
  const helpId = helpKey ? `help-${name}` : '';
  const helpText = helpKey ? t(helpKey) : '';
  const describedBy = helpId ? `aria-describedby="${helpId}"` : '';
  return `
    <label>
      ${label}
      <input type="number" name="${name}" value="${value}" ${attrs} ${describedBy} required />
      ${helpText ? `<small id="${helpId}" class="field-help">${helpText}</small>` : ''}
    </label>
  `;
}

export function render() {
  const qp = getQueryParams();
  const tuition = qp.tuition || '20000';
  const years = qp.years || String(DEFAULTS.educationYears);
  const salary = qp.salary || '60000';
  const baseline = qp.baseline || String(DEFAULTS.highSchoolBaseline);

  // Check if pre-filled from a career
  const career = qp.soc ? findBySoc(qp.soc) : null;
  const isZh = getLocale() === 'zh-TW';
  const preFillNote = career
    ? `<p class="pre-fill-note">${t('calculator.pre_filled').replace('{career}', isZh ? career.careerZh : career.career)}</p>`
    : '';

  return `
    <section class="calculator-view">
      <h2 data-i18n="calculator.title">${t('calculator.title')}</h2>
      ${preFillNote}

      <form id="calc-form" class="calc-form">
        <div class="form-grid">
          ${field('annualTuition', t('calculator.annual_tuition'), tuition, 'min="0" step="500"', 'calculator.help_annual_tuition')}
          ${field('educationYears', t('calculator.education_years'), years, 'min="1" max="10" step="1"', 'calculator.help_education_years')}
          ${field('postDegreeSalary', t('calculator.post_degree_salary'), salary, 'min="0" step="1000"', 'calculator.help_post_degree_salary')}
          ${field('baselineSalary', t('calculator.baseline_salary'), baseline, 'min="0" step="1000"', 'calculator.help_baseline_salary')}
          ${field('salaryGrowthRate', t('calculator.salary_growth'), String(DEFAULTS.salaryGrowthRate * 100), 'min="0" max="20" step="0.1"', 'calculator.help_salary_growth')}
          ${field('discountRate', t('calculator.discount_rate'), String(DEFAULTS.discountRate * 100), 'min="0" max="20" step="0.1"', 'calculator.help_discount_rate')}
          ${field('careerYears', t('calculator.career_years'), String(DEFAULTS.careerYears), 'min="1" max="50" step="1"', 'calculator.help_career_years')}
          ${field('loanRate', t('calculator.loan_rate'), '6.5', 'min="0" max="20" step="0.1"', 'calculator.help_loan_rate')}
          ${field('loanTermYears', t('calculator.loan_term'), '10', 'min="1" max="30" step="1"', 'calculator.help_loan_term')}
        </div>
        <div class="form-actions">
          <button type="submit">${t('calculator.calculate')}</button>
          <button type="reset" class="outline">${t('calculator.reset')}</button>
        </div>
      </form>

      <div id="calc-results" class="hidden"></div>
      <div id="calc-charts" class="calc-charts hidden">
        <div class="chart-wrapper">
          <canvas id="chart-cashflow"></canvas>
        </div>
        <div class="chart-wrapper">
          <canvas id="chart-cumulative"></canvas>
        </div>
      </div>
      <div id="calc-pdf-wrap" class="action-bar hidden" style="text-align:center; margin-top:var(--space-lg); display:flex; gap:var(--space-md); justify-content:center; align-items:start; flex-wrap:wrap;">
        <button type="button" id="calc-export-pdf" class="outline">${t('pdf.export')}</button>
        ${renderShareMenu('calc-share-msg')}
      </div>
    </section>
  `;
}

let cashflowChart = null;
let cumulativeChart = null;

function destroyCharts() {
  if (cashflowChart) { cashflowChart.destroy(); cashflowChart = null; }
  if (cumulativeChart) { cumulativeChart.destroy(); cumulativeChart = null; }
}

function renderResults(result) {
  const { npv, irr, breakevenYear, breakevenYearDiscounted, lifetime, discountedLifetime, loan } = result;
  const npvClass = npv >= 0 ? 'roi-positive' : 'roi-negative';

  function breakevenText(val) {
    return val != null ? `${val} ${t('calculator.years')}` : t('calculator.never');
  }

  return `
    <h3>${t('calculator.results_title')}</h3>
    <div class="results-grid">
      <div class="result-card ${npvClass}">
        <div class="result-label">${tooltip(t('calculator.npv'), 'npv')}</div>
        <div class="result-value">${formatCurrency(npv)}</div>
      </div>
      <div class="result-card">
        <div class="result-label">${tooltip(t('calculator.irr'), 'irr')}</div>
        <div class="result-value">${formatPercent(irr)}</div>
      </div>
      <div class="result-card">
        <div class="result-label">${tooltip(t('calculator.breakeven'), 'breakeven')}</div>
        <div class="result-value">${breakevenText(breakevenYear)}</div>
      </div>
      <div class="result-card">
        <div class="result-label">${t('calculator.breakeven_discounted')}</div>
        <div class="result-value">${breakevenText(breakevenYearDiscounted)}</div>
      </div>
      <div class="result-card ${lifetime.roi >= 0 ? 'roi-positive' : 'roi-negative'}">
        <div class="result-label">${t('calculator.lifetime_roi')}</div>
        <div class="result-value">${lifetime.roi.toFixed(1)}%</div>
      </div>
      <div class="result-card ${discountedLifetime.roi >= 0 ? 'roi-positive' : 'roi-negative'}">
        <div class="result-label">${t('calculator.discounted_roi')}</div>
        <div class="result-value">${discountedLifetime.roi.toFixed(1)}%</div>
      </div>
      <div class="result-card">
        <div class="result-label">${t('calculator.total_cost')}</div>
        <div class="result-value">${formatCurrency(lifetime.totalCost)}</div>
      </div>
      <div class="result-card">
        <div class="result-label">${t('calculator.total_premium')}</div>
        <div class="result-value">${formatCurrency(lifetime.totalPremium)}</div>
      </div>
      <div class="result-card ${lifetime.netGain >= 0 ? 'roi-positive' : 'roi-negative'}">
        <div class="result-label">${t('calculator.net_gain')}</div>
        <div class="result-value">${formatCurrency(lifetime.netGain)}</div>
      </div>
    </div>

    <h3>${t('calculator.loan_section')}</h3>
    <div class="results-grid results-grid-sm">
      <div class="result-card">
        <div class="result-label">${t('calculator.total_borrowed')}</div>
        <div class="result-value">${formatCurrency(loan.totalBorrowed)}</div>
      </div>
      <div class="result-card">
        <div class="result-label">${t('calculator.monthly_payment')}</div>
        <div class="result-value">${formatCurrency(loan.monthlyPayment)}</div>
      </div>
      <div class="result-card">
        <div class="result-label">${t('calculator.total_repaid')}</div>
        <div class="result-value">${formatCurrency(loan.totalRepaid)}</div>
      </div>
    </div>
  `;
}

async function renderCharts(result) {
  const ChartCtor = await loadChart();
  const { cashFlows, inputs } = result;
  const discountRate = inputs.discountRate;
  const educationYears = inputs.educationYears || DEFAULTS.educationYears;

  // Sample every N years if too many data points
  const step = cashFlows.length > 50 ? Math.ceil(cashFlows.length / 50) : 1;
  const sampled = cashFlows.filter((_, i) => i % step === 0);

  const labels = sampled.map((cf) => cf.year);
  const netValues = sampled.map((cf) => Math.round(cf.net));

  // Build cumulative discounted values
  let cumulative = 0;
  const cumulativeValues = cashFlows.map((cf, i) => {
    cumulative += cf.net / Math.pow(1 + discountRate, i);
    return Math.round(cumulative);
  }).filter((_, i) => i % step === 0);

  // Colors: red for education years, green for career years
  const barColors = sampled.map((cf) =>
    cf.year < educationYears
      ? 'rgba(220, 38, 38, 0.7)'   // brand-danger
      : 'rgba(5, 150, 105, 0.7)'    // brand-secondary
  );

  destroyCharts();

  const cashflowCtx = document.getElementById('chart-cashflow');
  if (cashflowCtx) {
    cashflowChart = new ChartCtor(cashflowCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: t('calculator.chart_cashflow'),
          data: netValues,
          backgroundColor: barColors,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: t('calculator.chart_cashflow') },
          legend: { display: false },
        },
        scales: {
          x: { title: { display: true, text: t('calculator.year_label') } },
          y: { title: { display: true, text: t('calculator.amount_label') } },
        },
      },
    });
  }

  const cumulativeCtx = document.getElementById('chart-cumulative');
  if (cumulativeCtx) {
    cumulativeChart = new ChartCtor(cumulativeCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: t('calculator.cumulative_line'),
          data: cumulativeValues,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: t('calculator.chart_cumulative') },
        },
        scales: {
          x: { title: { display: true, text: t('calculator.year_label') } },
          y: {
            title: { display: true, text: t('calculator.amount_label') },
            ticks: {
              callback: (v) => formatCurrency(v),
            },
          },
        },
      },
    });
  }
}

export function afterRender() {
  const form = document.getElementById('calc-form');
  const resultsEl = document.getElementById('calc-results');
  const chartsEl = document.getElementById('calc-charts');
  const pdfWrap = document.getElementById('calc-pdf-wrap');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const inputs = {
      annualTuition: Number(fd.get('annualTuition')),
      educationYears: Number(fd.get('educationYears')),
      postDegreeSalary: Number(fd.get('postDegreeSalary')),
      baselineSalary: Number(fd.get('baselineSalary')),
      salaryGrowthRate: Number(fd.get('salaryGrowthRate')) / 100,
      discountRate: Number(fd.get('discountRate')) / 100,
      careerYears: Number(fd.get('careerYears')),
      loanRate: Number(fd.get('loanRate')) / 100,
      loanTermYears: Number(fd.get('loanTermYears')),
    };

    const result = calcFullROI(inputs);

    const qp = getQueryParams();
    trackEvent('calculate_roi', { soc: qp.soc || null });

    resultsEl.innerHTML = renderResults(result);
    resultsEl.classList.remove('hidden');

    pdfWrap.classList.remove('hidden');
    renderCharts(result).then(() => {
      chartsEl.classList.remove('hidden');
    }).catch(() => {
      chartsEl.innerHTML = '<p class="muted" style="text-align:center;padding:var(--space-md)">Charts unavailable — check your internet connection.</p>';
      chartsEl.classList.remove('hidden');
    });

    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('reset', () => {
    destroyCharts();
    resultsEl.innerHTML = '';
    resultsEl.classList.add('hidden');
    chartsEl.classList.add('hidden');
    pdfWrap.classList.add('hidden');
  });

  // PDF export
  const pdfBtn = document.getElementById('calc-export-pdf');
  pdfBtn.addEventListener('click', () => {
    exportPdf(resultsEl, {
      filename: '14to17-roi',
      orientation: 'portrait',
      statusBtn: pdfBtn,
    });
  });

  // Share menu
  const pdfWrapEl = document.getElementById('calc-pdf-wrap');
  const shareMsgEl = document.getElementById('calc-share-msg');
  initShareHandlers(pdfWrapEl, () => {
    const fd = new FormData(form);
    const params = new URLSearchParams();
    const qp = getQueryParams();
    if (qp.soc) params.set('soc', qp.soc);
    params.set('tuition', fd.get('annualTuition'));
    params.set('years', fd.get('educationYears'));
    params.set('salary', fd.get('postDegreeSalary'));
    params.set('baseline', fd.get('baselineSalary'));
    return `#/calculator?${params.toString()}`;
  }, shareMsgEl);

  // Auto-calculate if pre-filled from detail page
  const qp = getQueryParams();
  if (qp.soc && qp.salary) {
    // Fully pre-filled from detail page — calculate immediately
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  } else if (qp.soc && !qp.salary) {
    // Only SOC provided (from search page) — fetch data, then pre-fill and calculate
    const career = findBySoc(qp.soc);
    if (career) {
      const loadingMsg = document.createElement('p');
      loadingMsg.className = 'loading-text';
      loadingMsg.textContent = t('calculator.loading_data');
      form.before(loadingMsg);

      fetchCareerEconomics(career).then((econ) => {
        loadingMsg.remove();
        form.annualTuition.value = Math.round(econ.avgTuition);
        form.educationYears.value = econ.duration;
        form.postDegreeSalary.value = Math.round(econ.medianSalary);
        form.baselineSalary.value = Math.round(econ.baseline);
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }).catch(() => {
        loadingMsg.remove();
        // Fall back to defaults — user can still manually calculate
      });
    }
  }
}
