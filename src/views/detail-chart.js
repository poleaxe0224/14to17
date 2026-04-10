/**
 * Detail view — breakeven chart rendering.
 *
 * Builds cost vs. earnings premium curves over time and renders
 * a Chart.js line chart showing the "golden crossover" point.
 */

import { t } from '../i18n/i18n.js';
import { loadChart } from '../utils/load-chart.js';

let breakevenChartInstance = null;

/**
 * Render the breakeven chart comparing cumulative education cost
 * vs. cumulative earnings premium.
 *
 * @param {object} econ — economics data from fetchCareerEconomics
 */
export async function renderBreakevenChart(econ) {
  const wrap = document.getElementById('breakeven-chart-wrap');
  if (!wrap) return;

  const tuition = econ.avgTuition;
  const edYears = econ.duration;
  const salary = econ.medianSalary;
  const baseline = econ.baseline;
  const growthRate = 0.025;
  const totalYears = edYears + 20; // Show 20 years after graduation

  // Build cost and earnings curves
  const labels = [];
  const costData = [];
  const earningsData = [];

  let cumulativeCost = 0;
  let cumulativePremium = 0;

  for (let yr = 0; yr < totalYears; yr++) {
    labels.push(yr);
    if (yr < edYears) {
      // Education phase: cost = tuition + opportunity cost (baseline salary foregone)
      cumulativeCost += tuition + baseline;
    }
    if (yr >= edYears) {
      // Career phase: earnings premium above baseline
      const yearsWorking = yr - edYears;
      const degSalary = salary * Math.pow(1 + growthRate, yearsWorking);
      const altSalary = baseline * Math.pow(1 + growthRate, yr);
      cumulativePremium += degSalary - altSalary;
    }
    costData.push(Math.round(cumulativeCost));
    earningsData.push(Math.round(cumulativePremium));
  }

  let ChartCtor;
  try {
    ChartCtor = await loadChart();
  } catch {
    return;
  }

  const ctx = document.getElementById('breakeven-chart');
  if (!ctx) return;

  if (breakevenChartInstance) {
    breakevenChartInstance.destroy();
    breakevenChartInstance = null;
  }

  breakevenChartInstance = new ChartCtor(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('detail.cost_curve'),
          data: costData,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 8,
        },
        {
          label: t('detail.earnings_curve'),
          data: earningsData,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom' },
      },
      scales: {
        x: {
          title: { display: true, text: t('calculator.year_label') },
        },
        y: {
          title: { display: true, text: t('calculator.amount_label') },
          ticks: {
            callback: (v) => {
              if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
              if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
              return `$${v}`;
            },
          },
        },
      },
    },
  });

  // Inject sr-only data table for screen readers
  wrap.querySelectorAll('.sr-only').forEach((el) => el.remove());
  const srRows = labels.map((yr, i) =>
    `<tr><td>${yr}</td><td>$${costData[i].toLocaleString()}</td><td>$${earningsData[i].toLocaleString()}</td></tr>`
  ).join('');
  wrap.insertAdjacentHTML('beforeend',
    `<table class="sr-only"><caption>${t('detail.breakeven_chart')}</caption>` +
    `<thead><tr><th scope="col">${t('calculator.year_label')}</th><th scope="col">${t('detail.cost_curve')}</th><th scope="col">${t('detail.earnings_curve')}</th></tr></thead>` +
    `<tbody>${srRows}</tbody></table>`
  );

  wrap.classList.remove('hidden');
}
