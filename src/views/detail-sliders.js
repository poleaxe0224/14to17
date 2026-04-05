/**
 * Detail view — competition parameter sliders.
 *
 * Owns the slider HTML template, event wiring, and recalculation
 * when the user adjusts k or maxPenalty.
 */

import { t } from '../i18n/i18n.js';
import { calcThreeLayerROI, DEFAULTS } from '../engine/roi.js';

/**
 * Return the slider panel HTML (used inside <details>).
 * @returns {string}
 */
export function renderSliderPanel() {
  return `
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
  `;
}

/**
 * Wire slider events to recalculate competition-adjusted ROI.
 * @param {object} layerState — shared state from afterRender data fetch
 */
export function wireSliders(layerState) {
  const sliderK = document.getElementById('slider-k');
  const sliderPenalty = document.getElementById('slider-max-penalty');
  const kValueEl = document.getElementById('k-value');
  const penaltyValueEl = document.getElementById('penalty-value');
  const resetBtn = document.getElementById('reset-params');

  function recalc() {
    const k = parseFloat(sliderK.value);
    const maxP = parseFloat(sliderPenalty.value);
    kValueEl.textContent = k.toFixed(2);
    penaltyValueEl.textContent = `${(maxP * 100).toFixed(0)}%`;

    const updated = calcThreeLayerROI({ ...layerState, competitionK: k, maxPenalty: maxP });
    const compEl = document.getElementById('competition-roi-value');
    if (compEl) {
      compEl.textContent = `${updated.layers.competitionAdjusted.roi.toFixed(1)}%`;
    }
    const discEl = document.getElementById('competition-roi-discounted');
    if (discEl) {
      const { discountedRoi } = updated.layers.competitionAdjusted;
      discEl.textContent = `${discEl.textContent.split(':')[0]}: ${discountedRoi.toFixed(1)}%`;
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
