/**
 * Occupation Profile view — BLS OOH-style career exploration page.
 *
 * Sections: What They Do, Work Environment, How to Become One,
 * Pay, Job Outlook, State & Area Data, Similar Occupations, More Info.
 *
 * Route: #/profile/:soc
 */

import { t, getLocale } from '../i18n/i18n.js';
import { findBySoc, getRelatedCareers } from '../engine/mappings.js';
import * as profiles from '../api/profiles.js';
import * as bls from '../api/bls.js';
import { formatCurrency, formatNumber } from '../utils/format.js';

/**
 * Map growth_label enum to i18n key.
 */
function growthLabelKey(label) {
  const map = {
    much_faster: 'profile.growth_much_faster',
    faster: 'profile.growth_faster',
    average: 'profile.growth_average',
    slower: 'profile.growth_slower',
    declining: 'profile.growth_declining',
  };
  return map[label] ?? 'profile.growth_average';
}

/**
 * Map growth_label to a CSS modifier class for the badge.
 */
function growthBadgeClass(label) {
  const map = {
    much_faster: 'growth-badge--fast',
    faster: 'growth-badge--fast',
    average: 'growth-badge--avg',
    slower: 'growth-badge--slow',
    declining: 'growth-badge--decline',
  };
  return map[label] ?? 'growth-badge--avg';
}

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

  return `
    <section class="profile-view" data-category="${career.category}">
      <a href="#/search" class="back-link">&larr; ${t('profile.back_to_search')}</a>

      <!-- Hero -->
      <div class="profile-hero">
        <span class="profile-icon">${career.icon}</span>
        <div>
          <h2 class="profile-title">${name}</h2>
          <p class="profile-sub">${subName}</p>
          <span class="category-badge category-badge--${career.category}">${t('categories.' + career.category)}</span>
        </div>
      </div>

      <!-- Section Nav (sticky) -->
      <nav class="profile-nav" aria-label="Section navigation">
        <a href="#prof-what">${t('profile.what_they_do')}</a>
        <a href="#prof-env">${t('profile.work_environment')}</a>
        <a href="#prof-how">${t('profile.how_to_become')}</a>
        <a href="#prof-pay">${t('profile.pay')}</a>
        <a href="#prof-outlook">${t('profile.job_outlook')}</a>
        <a href="#prof-state">${t('profile.state_area_data')}</a>
        <a href="#prof-similar">${t('profile.similar_occupations')}</a>
        <a href="#prof-more">${t('profile.more_info')}</a>
      </nav>

      <!-- Content (populated by afterRender) -->
      <div id="profile-content" aria-live="polite">
        <p class="loading-text">${t('profile.loading_profile')}</p>
      </div>

      <!-- CTA -->
      <div id="profile-cta" class="profile-cta hidden"></div>
    </section>
  `;
}

export async function afterRender({ soc } = {}) {
  const career = findBySoc(soc);
  if (!career) return;

  // Re-render the full view on locale change (hero, nav, and body text are all locale-dependent)
  function onLocaleChanged() {
    const outlet = document.getElementById('app');
    if (!outlet || !document.getElementById('profile-content')) return;
    outlet.innerHTML = render({ soc });
    afterRender({ soc });
  }
  document.addEventListener('locale-changed', onLocaleChanged, { once: true });

  const contentEl = document.getElementById('profile-content');
  if (!contentEl) return;

  // Fetch profile data and wage data in parallel
  const [profileData, wageData] = await Promise.all([
    profiles.getProfile(soc),
    bls.getWageData(soc).catch(() => null),
  ]);

  // If user navigated away, bail
  if (!document.getElementById('profile-content')) return;

  if (!profileData) {
    contentEl.innerHTML = `<p class="muted">${t('profile.profile_unavailable')}</p>`;
    return;
  }

  const sections = [];

  // 1. What They Do
  sections.push(renderSection('prof-what', 'profile.what_they_do', `
    <p>${profileData.what_they_do}</p>
  `));

  // 2. Work Environment
  sections.push(renderSection('prof-env', 'profile.work_environment', `
    <p>${profileData.work_environment}</p>
  `));

  // 3. How to Become One
  const htb = profileData.how_to_become;
  sections.push(renderSection('prof-how', 'profile.how_to_become', `
    <div class="how-to-grid">
      <div class="how-to-card">
        <h4>${t('profile.education_required')}</h4>
        <p>${htb?.education ?? ''}</p>
      </div>
      <div class="how-to-card">
        <h4>${t('profile.experience_needed')}</h4>
        <p>${htb?.experience ?? ''}</p>
      </div>
      <div class="how-to-card">
        <h4>${t('profile.on_the_job_training')}</h4>
        <p>${htb?.training ?? ''}</p>
      </div>
    </div>
  `));

  // 4. Pay
  sections.push(renderSection('prof-pay', 'profile.pay',
    renderPaySection(wageData),
  ));

  // 5. Job Outlook
  const ol = profileData.outlook;
  const growthSign = ol.growth_rate > 0 ? '+' : '';
  sections.push(renderSection('prof-outlook', 'profile.job_outlook', `
    <div class="outlook-grid">
      <div class="outlook-stat">
        <span class="outlook-value">${formatNumber(ol.employment_2024)}</span>
        <span class="outlook-label">${t('profile.employment_2024')}</span>
      </div>
      <div class="outlook-stat">
        <span class="growth-badge ${growthBadgeClass(ol.growth_label)}">${growthSign}${ol.growth_rate}%</span>
        <span class="outlook-label">${t('profile.projected_growth')}</span>
        <span class="outlook-note">${t(growthLabelKey(ol.growth_label))}</span>
      </div>
      <div class="outlook-stat">
        <span class="outlook-value">${growthSign}${formatNumber(ol.projected_change)}</span>
        <span class="outlook-label">${t('profile.projected_change')}</span>
        <span class="outlook-note muted">${t('profile.new_jobs')}</span>
      </div>
    </div>
  `));

  // 6. State & Area Data
  sections.push(renderSection('prof-state', 'profile.state_area_data', `
    <p>${t('profile.state_area_desc')}</p>
    <a href="${profileData.state_url}" target="_blank" rel="noopener" role="button" class="outline">
      ${t('profile.view_state_data')} &rarr;
    </a>
  `));

  // 7. Similar Occupations
  const similarCareers = (profileData.similar_soc || [])
    .map((s) => findBySoc(s))
    .filter(Boolean);
  sections.push(renderSection('prof-similar', 'profile.similar_occupations',
    renderSimilarCareers(similarCareers),
  ));

  // 8. More Info
  sections.push(renderSection('prof-more', 'profile.more_info', `
    <div class="more-info-links">
      <a href="${profileData.onet_url}" target="_blank" rel="noopener" class="info-link-card">
        <strong>${t('profile.view_on_onet')}</strong>
        <span class="muted">O*NET OnLine</span>
      </a>
      <a href="${profileData.ooh_url}" target="_blank" rel="noopener" class="info-link-card">
        <strong>${t('profile.view_on_bls')}</strong>
        <span class="muted">Bureau of Labor Statistics</span>
      </a>
    </div>
  `));

  contentEl.innerHTML = sections.join('');

  // CTA — link to detail page for ROI deep dive
  const ctaEl = document.getElementById('profile-cta');
  if (ctaEl) {
    ctaEl.innerHTML = `
      <p class="cta-label">${t('profile.calculate_roi')}</p>
      <a href="#/detail/${soc}" role="button" class="cta-btn">
        ${t('profile.deep_dive_roi')} &rarr;
      </a>
    `;
    ctaEl.classList.remove('hidden');
  }
}

/**
 * Render a single profile section card.
 */
function renderSection(id, titleKey, bodyHtml) {
  return `
    <article class="section-card" id="${id}">
      <h3 class="section-card__title">${t(titleKey)}</h3>
      <div class="section-card__body">
        ${bodyHtml}
      </div>
    </article>
  `;
}

/**
 * Render the Pay section with salary meter.
 */
function renderPaySection(wageData) {
  if (!wageData) {
    return `<p class="muted">${t('detail.error_wages')}</p>`;
  }

  const median = wageData.annualMedian;
  const p10 = wageData.annual10;
  const p90 = wageData.annual90;

  let meterHtml = '';
  if (p10 != null && p90 != null && median != null) {
    // Position the median marker as a percentage between p10 and p90
    const range = p90 - p10;
    const pct = range > 0 ? Math.round(((median - p10) / range) * 100) : 50;
    meterHtml = `
      <div class="salary-meter" role="img" aria-label="${t('profile.salary_range')}">
        <div class="salary-meter__bar">
          <div class="salary-meter__marker" style="left:${pct}%"></div>
        </div>
        <div class="salary-meter__labels">
          <span>${formatCurrency(p10)}</span>
          <span class="salary-meter__median">${formatCurrency(median)}</span>
          <span>${formatCurrency(p90)}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="pay-highlight">
      <span class="pay-value">${formatCurrency(median)}</span>
      <span class="pay-label">${t('profile.median_salary_2024')}</span>
    </div>
    ${meterHtml}
  `;
}

/**
 * Render similar occupation mini-cards.
 */
function renderSimilarCareers(careers) {
  if (!careers.length) return `<p class="muted">-</p>`;

  const isZh = getLocale() === 'zh-TW';
  return `
    <div class="similar-grid">
      ${careers.map((c) => `
        <a href="#/profile/${c.soc}" class="career-mini-card" data-category="${c.category}">
          <span class="career-mini-card__icon">${c.icon}</span>
          <span class="career-mini-card__name">${isZh ? c.careerZh : c.career}</span>
          <span class="career-mini-card__degree muted">${t('common.degree_' + c.typicalDegree)}</span>
        </a>
      `).join('')}
    </div>
  `;
}
