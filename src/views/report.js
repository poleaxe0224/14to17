/**
 * Exploration Report view — compiles the user's exploration history
 * into a summary with export options (Markdown, PDF, JSON).
 *
 * Route: #/report
 */

import { t, getLocale } from '../i18n/i18n.js';
import { findBySoc } from '../engine/mappings.js';
import { getEvents, getExploredSocs, getEventCounts, clearTracker, exportJSON, importJSON } from '../tracker/tracker.js';
import { exportPdf } from '../utils/export-pdf.js';

function careerName(soc) {
  const career = findBySoc(soc);
  if (!career) return t('report.no_career_name');
  return getLocale() === 'zh-TW' ? career.careerZh : career.career;
}

function eventLabel(type) {
  const map = {
    view_profile: t('report.event_view_profile'),
    view_detail: t('report.event_view_detail'),
    calculate_roi: t('report.event_calculate_roi'),
    compare: t('report.event_compare'),
  };
  return map[type] ?? type;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(getLocale() === 'zh-TW' ? 'zh-TW' : 'en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function render() {
  const exploredSocs = getExploredSocs();
  const counts = getEventCounts();
  const events = getEvents();
  const hasData = events.length > 0;

  if (!hasData) {
    return `
      <section class="report-view">
        <h2 data-i18n="report.title">${t('report.title')}</h2>
        <div class="report-empty">
          <p>${t('report.empty')}</p>
          <a href="#/" role="button" class="outline">${t('nav.home')}</a>
        </div>
        <div class="report-import-wrap">
          <button type="button" id="report-import" class="outline secondary">${t('report.import_json')}</button>
          <input type="file" id="report-import-file" accept=".json" class="hidden" />
        </div>
        <div id="report-msg"></div>
      </section>
    `;
  }

  return `
    <section class="report-view">
      <h2 data-i18n="report.title">${t('report.title')}</h2>
      <p class="report-subtitle" data-i18n="report.subtitle">${t('report.subtitle')}</p>

      <!-- Summary cards -->
      <div class="report-summary">
        <div class="report-stat-card">
          <span class="report-stat-value">${exploredSocs.length}</span>
          <span class="report-stat-label">${t('report.careers_explored')}</span>
        </div>
        <div class="report-stat-card">
          <span class="report-stat-value">${counts.view_profile ?? 0}</span>
          <span class="report-stat-label">${t('report.profiles_viewed')}</span>
        </div>
        <div class="report-stat-card">
          <span class="report-stat-value">${counts.compare ?? 0}</span>
          <span class="report-stat-label">${t('report.comparisons_made')}</span>
        </div>
        <div class="report-stat-card">
          <span class="report-stat-value">${counts.calculate_roi ?? 0}</span>
          <span class="report-stat-label">${t('report.calculations_run')}</span>
        </div>
      </div>

      <!-- Career list -->
      <h3>${t('report.explored_careers')}</h3>
      <div class="report-career-list">
        ${exploredSocs.map((soc) => {
          const career = findBySoc(soc);
          if (!career) return '';
          const isZh = getLocale() === 'zh-TW';
          return `
            <a href="#/profile/${soc}" class="report-career-card" data-category="${career.category}" aria-label="${isZh ? career.careerZh : career.career}">
              <span class="report-career-icon" aria-hidden="true">${career.icon}</span>
              <div class="report-career-info">
                <span class="report-career-name">${isZh ? career.careerZh : career.career}</span>
                <span class="report-career-sub muted">${isZh ? career.career : career.careerZh}</span>
              </div>
              <span class="category-badge category-badge--${career.category}">${t('categories.' + career.category)}</span>
            </a>
          `;
        }).join('')}
      </div>

      <!-- Timeline -->
      <h3>${t('report.timeline_title')}</h3>
      <div class="report-timeline" id="report-timeline" role="list" aria-label="${t('report.timeline_title')}">
        ${renderTimeline(events.slice(-20).reverse())}
      </div>

      <!-- Export / Import actions -->
      <div class="report-actions">
        <button type="button" id="report-export-md" class="outline">${t('report.export_md')}</button>
        <button type="button" id="report-export-pdf" class="outline">${t('report.export_pdf')}</button>
        <button type="button" id="report-export-json" class="outline secondary">${t('report.export_json')}</button>
        <button type="button" id="report-import" class="outline secondary">${t('report.import_json')}</button>
        <input type="file" id="report-import-file" accept=".json" class="hidden" />
        <button type="button" id="report-clear" class="outline contrast">${t('report.clear_data')}</button>
      </div>
      <div id="report-msg"></div>
    </section>
  `;
}

function renderTimeline(events) {
  return events.map((ev) => {
    const socs = ev.data?.socs ?? (ev.data?.soc ? [ev.data.soc] : []);
    const names = socs.map((s) => careerName(s)).join(', ');
    return `
      <div class="timeline-item" role="listitem">
        <span class="timeline-dot"></span>
        <div class="timeline-content">
          <span class="timeline-label">${eventLabel(ev.type)}</span>
          ${names ? `<span class="timeline-career">${names}</span>` : ''}
          <span class="timeline-time muted">${formatTime(ev.ts)}</span>
        </div>
      </div>
    `;
  }).join('');
}

/** Generate Markdown report string. */
function buildMarkdown() {
  const exploredSocs = getExploredSocs();
  const counts = getEventCounts();
  const events = getEvents();
  const isZh = getLocale() === 'zh-TW';
  const title = t('report.title');
  const date = new Date().toLocaleDateString(isZh ? 'zh-TW' : 'en-US');

  let md = `# ${title}\n\n`;
  md += `*${t('pdf.generated').replace('{date}', date)}*\n\n`;

  md += `## ${t('report.summary_title')}\n\n`;
  md += `| | |\n|---|---|\n`;
  md += `| ${t('report.careers_explored')} | ${exploredSocs.length} |\n`;
  md += `| ${t('report.profiles_viewed')} | ${counts.view_profile ?? 0} |\n`;
  md += `| ${t('report.comparisons_made')} | ${counts.compare ?? 0} |\n`;
  md += `| ${t('report.calculations_run')} | ${counts.calculate_roi ?? 0} |\n\n`;

  md += `## ${t('report.explored_careers')}\n\n`;
  for (const soc of exploredSocs) {
    const career = findBySoc(soc);
    if (!career) continue;
    const name = isZh ? career.careerZh : career.career;
    const sub = isZh ? career.career : career.careerZh;
    md += `- **${name}** (${sub}) — ${t('common.degree_' + career.typicalDegree)}\n`;
  }
  md += '\n';

  md += `## ${t('report.timeline_title')}\n\n`;
  for (const ev of events.slice(-20).reverse()) {
    const socs = ev.data?.socs ?? (ev.data?.soc ? [ev.data.soc] : []);
    const names = socs.map((s) => careerName(s)).join(', ');
    md += `- ${formatTime(ev.ts)} — ${eventLabel(ev.type)}${names ? `: ${names}` : ''}\n`;
  }
  md += '\n';

  md += `---\n*${t('pdf.disclaimer')}*\n`;
  return md;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function afterRender() {
  const msgEl = document.getElementById('report-msg');

  // Markdown export
  const mdBtn = document.getElementById('report-export-md');
  if (mdBtn) {
    mdBtn.addEventListener('click', () => {
      const md = buildMarkdown();
      downloadFile(md, `futurepath-report-${Date.now()}.md`, 'text/markdown;charset=utf-8');
    });
  }

  // PDF export
  const pdfBtn = document.getElementById('report-export-pdf');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      const content = document.querySelector('.report-view');
      // Hide action buttons in the PDF
      const actions = document.querySelector('.report-actions');
      if (actions) actions.classList.add('hidden');
      if (msgEl) msgEl.classList.add('hidden');

      exportPdf(content, {
        filename: 'futurepath-exploration-report',
        orientation: 'portrait',
        statusBtn: pdfBtn,
      }).finally(() => {
        if (actions) actions.classList.remove('hidden');
        if (msgEl) msgEl.classList.remove('hidden');
      });
    });
  }

  // JSON export
  const jsonBtn = document.getElementById('report-export-json');
  if (jsonBtn) {
    jsonBtn.addEventListener('click', () => {
      const json = exportJSON();
      downloadFile(json, `futurepath-data-${Date.now()}.json`, 'application/json');
    });
  }

  // JSON import
  const importBtn = document.getElementById('report-import');
  const importFile = document.getElementById('report-import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        importJSON(text);
        if (msgEl) {
          msgEl.textContent = t('report.imported_ok');
          msgEl.className = 'report-msg roi-positive';
        }
        // Re-render to show imported data
        const outlet = document.getElementById('app');
        if (outlet) {
          outlet.innerHTML = render();
          afterRender();
        }
      } catch {
        if (msgEl) {
          msgEl.textContent = t('report.import_error');
          msgEl.className = 'report-msg error-text';
        }
      }
      importFile.value = '';
    });
  }

  // Clear data
  const clearBtn = document.getElementById('report-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!window.confirm(t('report.clear_confirm'))) return;
      clearTracker();
      const outlet = document.getElementById('app');
      if (outlet) {
        outlet.innerHTML = render();
        afterRender();
      }
    });
  }

  // Locale change re-render
  document.addEventListener('locale-changed', () => {
    const outlet = document.getElementById('app');
    if (!outlet || !document.querySelector('.report-view')) return;
    outlet.innerHTML = render();
    afterRender();
  }, { once: true });
}
