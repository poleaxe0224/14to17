/**
 * PDF export (via print) + social share utilities.
 * Used by compare, calculator, and report views.
 */

import { t } from '../i18n/i18n.js';

/* ------------------------------------------------------------------ */
/*  PDF Export via window.print()                                      */
/* ------------------------------------------------------------------ */

/**
 * Export the current view as PDF via the browser's print dialog.
 * Converts Chart.js <canvas> elements to <img> so they render in print.
 *
 * @param {HTMLElement} _contentEl — unused (kept for API compat)
 * @param {object} [opts]
 * @param {HTMLElement} [opts.statusBtn] — button to show progress on
 */
export async function exportPdf(_contentEl, { statusBtn } = {}) {
  const origText = statusBtn?.textContent;
  if (statusBtn) {
    statusBtn.textContent = t('pdf.exporting');
    statusBtn.disabled = true;
  }

  const restored = [];
  try {
    // Convert visible <canvas> to <img> so print captures charts
    document.querySelectorAll('canvas').forEach((canvas) => {
      if (canvas.offsetWidth === 0) return; // skip hidden
      try {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.className = 'print-chart-img';
        img.style.width = `${canvas.offsetWidth}px`;
        img.style.maxWidth = '100%';
        img.setAttribute('aria-hidden', 'true');
        canvas.after(img);
        canvas.classList.add('print-hidden');
        restored.push({ img, canvas });
      } catch { /* tainted canvas — skip */ }
    });

    window.print();
  } finally {
    // Restore canvases after print dialog closes
    restored.forEach(({ img, canvas }) => {
      canvas.classList.remove('print-hidden');
      img.remove();
    });
    if (statusBtn) {
      statusBtn.textContent = origText;
      statusBtn.disabled = false;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Share: Copy Link (legacy, kept for backward compat)                */
/* ------------------------------------------------------------------ */

/**
 * @deprecated Use renderShareMenu + initShareHandlers instead.
 */
export function copyShareLink(hashRoute, msgEl) {
  const url = buildShareUrl(hashRoute);
  navigator.clipboard.writeText(url).then(() => {
    if (msgEl) {
      msgEl.textContent = t('share.copied');
      msgEl.className = 'share-msg roi-positive';
    }
  }).catch(() => {
    if (msgEl) {
      msgEl.textContent = t('share.copy_fail');
      msgEl.className = 'share-msg error-text';
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Share: Social media dropdown                                       */
/* ------------------------------------------------------------------ */

function buildShareUrl(hashRoute) {
  const baseUrl = window.location.href.split('#')[0];
  return `${baseUrl}${hashRoute}`;
}

/**
 * Returns HTML for the share dropdown menu.
 * @param {string} msgElId — id for the feedback message element
 */
export function renderShareMenu(msgElId) {
  return `
    <details class="dropdown share-dropdown">
      <summary class="outline share-link-btn">${t('share.button')}</summary>
      <ul>
        <li><a href="#" data-share="copy">${t('share.copy_link')}</a></li>
        <li><a href="#" data-share="line">LINE</a></li>
        <li><a href="#" data-share="facebook">Facebook</a></li>
        <li><a href="#" data-share="threads">Threads</a></li>
        <li><a href="#" data-share="instagram">Instagram</a></li>
        <li><a href="#" data-share="twitter">${t('share.twitter')}</a></li>
        <li><a href="#" data-share="whatsapp">WhatsApp</a></li>
        <li><a href="#" data-share="linkedin">LinkedIn</a></li>
        <li><a href="#" data-share="email">${t('share.email')}</a></li>
        <li><a href="#" data-share="pinterest">Pinterest</a></li>
        <li><a href="#" data-share="reddit">Reddit</a></li>
      </ul>
    </details>
    <div id="${msgElId}" class="share-msg"></div>
  `;
}

/**
 * Attach click handlers to share dropdown items.
 * @param {HTMLElement} containerEl — element containing the [data-share] links
 * @param {() => string} getHashRoute — returns the hash route to share (e.g. '#/calculator?soc=...')
 * @param {HTMLElement} [msgEl] — element to show copy feedback
 */
export function initShareHandlers(containerEl, getHashRoute, msgEl) {
  const title = t('share.default_title');

  containerEl.querySelectorAll('[data-share]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const shareUrl = buildShareUrl(getHashRoute());
      const encoded = encodeURIComponent(shareUrl);
      const encodedTitle = encodeURIComponent(title);

      switch (link.dataset.share) {
        case 'copy':
          navigator.clipboard.writeText(shareUrl).then(() => {
            showMsg(msgEl, t('share.copied'), 'roi-positive');
          }).catch(() => {
            showMsg(msgEl, t('share.copy_fail'), 'error-text');
          });
          break;

        case 'line':
          window.open(
            `https://social-plugins.line.me/lineit/share?url=${encoded}`,
            '_blank', 'noopener'
          );
          break;

        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
            '_blank', 'noopener'
          );
          break;

        case 'threads':
          // Threads uses intent URL with text containing the link
          window.open(
            `https://www.threads.net/intent/post?text=${encodedTitle}%20${encoded}`,
            '_blank', 'noopener'
          );
          break;

        case 'instagram':
          // Instagram has no direct share URL — copy link + open Instagram
          navigator.clipboard.writeText(shareUrl).then(() => {
            showMsg(msgEl, t('share.ig_copied'), 'roi-positive');
          }).catch(() => {
            showMsg(msgEl, t('share.copy_fail'), 'error-text');
          });
          window.open('https://www.instagram.com/', '_blank', 'noopener');
          break;

        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
            '_blank', 'noopener'
          );
          break;

        case 'whatsapp':
          window.open(
            `https://api.whatsapp.com/send?text=${encodedTitle}%20${encoded}`,
            '_blank', 'noopener'
          );
          break;

        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
            '_blank', 'noopener'
          );
          break;

        case 'email':
          window.location.href =
            `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A${encoded}`;
          break;

        case 'pinterest':
          window.open(
            `https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodedTitle}`,
            '_blank', 'noopener'
          );
          break;

        case 'reddit':
          window.open(
            `https://www.reddit.com/submit?url=${encoded}&title=${encodedTitle}`,
            '_blank', 'noopener'
          );
          break;
      }

      // Close the dropdown after action
      const details = containerEl.querySelector('.share-dropdown');
      if (details) details.open = false;
    });
  });
}

function showMsg(el, text, cls) {
  if (!el) return;
  el.textContent = text;
  el.className = `share-msg ${cls}`;
}
