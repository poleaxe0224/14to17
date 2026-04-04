/**
 * Shared PDF export utility — lazy-loads html2pdf.js from CDN.
 * Used by compare, calculator, and report views.
 */

import { t } from '../i18n/i18n.js';

const CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js';

async function ensureHtml2Pdf() {
  if (window.html2pdf) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CDN_URL;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Export a DOM element to PDF.
 * @param {HTMLElement} contentEl — element to render
 * @param {object} opts
 * @param {string} opts.filename — PDF filename (without timestamp)
 * @param {'portrait'|'landscape'} [opts.orientation='portrait']
 * @param {HTMLElement} [opts.statusBtn] — button to show progress on
 */
export async function exportPdf(contentEl, { filename, orientation = 'portrait', statusBtn } = {}) {
  const origText = statusBtn?.textContent;
  if (statusBtn) {
    statusBtn.textContent = t('pdf.exporting');
    statusBtn.disabled = true;
  }

  try {
    await ensureHtml2Pdf();

    const header = document.createElement('div');
    header.innerHTML = `
      <h2 style="text-align:center;margin-bottom:4px;">${t('pdf.report_title')}</h2>
      <p style="text-align:center;color:#666;font-size:12px;margin-bottom:16px;">
        ${t('pdf.generated').replace('{date}', new Date().toLocaleDateString())} |
        ${t('pdf.disclaimer')}
      </p>
    `;

    const wrapper = document.createElement('div');
    wrapper.appendChild(header);
    wrapper.appendChild(contentEl.cloneNode(true));

    await window.html2pdf().set({
      margin: [10, 10],
      filename: `${filename}-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation },
    }).from(wrapper).save();
  } catch (err) {
    console.error('PDF export failed:', err);
  } finally {
    if (statusBtn) {
      statusBtn.textContent = origText;
      statusBtn.disabled = false;
    }
  }
}
