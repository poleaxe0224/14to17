/**
 * Occupation Profile view — progressive disclosure career exploration.
 *
 * Level 1 (Discover): What They Do, Work Environment, Similar Occupations — always open
 * Level 2 (Plan): How to Become One — collapsed
 * Level 3 (Evaluate): Pay, Job Outlook, State & Area Data — collapsed, lazy-loads wage data
 * Level 4 (Decide): More Info + ROI deep dive link — collapsed
 *
 * Route: #/profile/:soc
 */

import { t, getLocale } from '../i18n/i18n.js';
import { findBySoc, getRelatedCareers } from '../engine/mappings.js';
import * as profiles from '../api/profiles.js';
import * as bls from '../api/bls.js';
import { formatCurrency, formatNumber } from '../utils/format.js';

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

      <!-- Level Nav (sticky) -->
      <nav class="profile-nav" aria-label="Section navigation">
        <a data-scroll="level-1" href="javascript:void(0)" class="level-tab level-tab--active">
          <span class="level-num">1</span> ${t('profile.level1_title')}
        </a>
        <a data-scroll="level-2" href="javascript:void(0)" class="level-tab">
          <span class="level-num">2</span> ${t('profile.level2_title')}
        </a>
        <a data-scroll="level-3" href="javascript:void(0)" class="level-tab">
          <span class="level-num">3</span> ${t('profile.level3_title')}
        </a>
        <a data-scroll="level-4" href="javascript:void(0)" class="level-tab">
          <span class="level-num">4</span> ${t('profile.level4_title')}
        </a>
      </nav>

      <!-- Content (populated by afterRender) -->
      <div id="profile-content" aria-live="polite">
        <p class="loading-text">${t('profile.loading_profile')}</p>
      </div>
    </section>
  `;
}

export async function afterRender({ soc } = {}) {
  const career = findBySoc(soc);
  if (!career) return;

  // Re-render on locale change
  document.addEventListener('locale-changed', () => {
    const outlet = document.getElementById('app');
    if (!outlet || !document.getElementById('profile-content')) return;
    outlet.innerHTML = render({ soc });
    afterRender({ soc });
  }, { once: true });

  // Wire level nav scroll
  document.querySelectorAll('.profile-nav [data-scroll]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.scroll);
      if (target) {
        // If it's a collapsed details, open it first
        if (target.tagName === 'DETAILS' && !target.open) {
          target.open = true;
        }
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const contentEl = document.getElementById('profile-content');
  if (!contentEl) return;

  // Fetch profile data (Level 1+2 content)
  const profileData = await profiles.getProfile(soc);

  if (!document.getElementById('profile-content')) return;

  if (!profileData) {
    contentEl.innerHTML = `<p class="muted">${t('profile.profile_unavailable')}</p>`;
    return;
  }

  // Build all 4 levels
  contentEl.innerHTML = [
    renderLevel1(profileData, career),
    renderLevel2(profileData),
    renderLevel3Skeleton(),
    renderLevel4(profileData, soc),
  ].join('');

  // Lazy-load Level 3 wage data when expanded
  const level3 = document.getElementById('level-3');
  if (level3) {
    level3.addEventListener('toggle', async () => {
      if (!level3.open) return;
      const body = level3.querySelector('.level-body');
      if (body.dataset.loaded) return;
      body.dataset.loaded = '1';
      body.innerHTML = `<p class="loading-text">${t('common.loading')}</p>`;

      const wageData = await bls.getWageData(soc).catch(() => null);
      if (!document.getElementById('level-3')) return;
      body.innerHTML = renderLevel3Content(wageData, profileData);
    }, { once: true });
  }
}

/* ── Level 1: Discover (always open) ──────────────────────────── */

function renderLevel1(profile, career) {
  const similarCareers = getRelatedCareers(career.soc);
  const isZh = getLocale() === 'zh-TW';

  return `
    <div class="disclosure-level" id="level-1">
      <div class="level-header level-header--open">
        <span class="level-badge">1</span>
        <div>
          <h3 class="level-title">${t('profile.level1_title')}</h3>
          <p class="level-desc muted">${t('profile.level1_desc')}</p>
        </div>
      </div>
      <div class="level-body">
        ${renderSection('prof-what', 'profile.what_they_do', `<p>${profile.what_they_do}</p>`)}
        ${renderSection('prof-env', 'profile.work_environment', `<p>${profile.work_environment}</p>`)}
        ${renderSection('prof-similar', 'profile.similar_occupations', renderSimilarCareers(similarCareers, isZh))}
      </div>
    </div>
  `;
}

/* ── Level 2: Plan (collapsed) ────────────────────────────────── */

function renderLevel2(profile) {
  const htb = profile.how_to_become;
  return `
    <details class="disclosure-level" id="level-2">
      <summary class="level-header">
        <span class="level-badge">2</span>
        <div>
          <h3 class="level-title">${t('profile.level2_title')}</h3>
          <p class="level-desc muted">${t('profile.level2_desc')}</p>
        </div>
      </summary>
      <div class="level-body">
        ${renderSection('prof-how', 'profile.how_to_become', `
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
        `)}
      </div>
    </details>
  `;
}

/* ── Level 3: Evaluate (collapsed, lazy-loaded) ───────────────── */

function renderLevel3Skeleton() {
  return `
    <details class="disclosure-level" id="level-3">
      <summary class="level-header">
        <span class="level-badge">3</span>
        <div>
          <h3 class="level-title">${t('profile.level3_title')}</h3>
          <p class="level-desc muted">${t('profile.level3_desc')}</p>
        </div>
      </summary>
      <div class="level-body">
        <p class="loading-text">${t('common.loading')}</p>
      </div>
    </details>
  `;
}

function renderLevel3Content(wageData, profile) {
  const paySectionHtml = renderPaySection(wageData);

  const ol = profile.outlook;
  const growthSign = ol.growth_rate > 0 ? '+' : '';
  const outlookHtml = `
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
  `;

  return `
    ${renderSection('prof-pay', 'profile.pay', paySectionHtml)}
    ${renderSection('prof-outlook', 'profile.job_outlook', outlookHtml)}
    ${renderSection('prof-state', 'profile.state_area_data', `
      <p>${t('profile.state_area_desc')}</p>
      <a href="${profile.state_url}" target="_blank" rel="noopener" role="button" class="outline">
        ${t('profile.view_state_data')} &rarr;
      </a>
    `)}
  `;
}

/* ── Level 4: Decide (collapsed) ──────────────────────────────── */

function renderLevel4(profile, soc) {
  return `
    <details class="disclosure-level" id="level-4">
      <summary class="level-header">
        <span class="level-badge">4</span>
        <div>
          <h3 class="level-title">${t('profile.level4_title')}</h3>
          <p class="level-desc muted">${t('profile.level4_desc')}</p>
        </div>
      </summary>
      <div class="level-body">
        ${renderSection('prof-more', 'profile.more_info', `
          <div class="more-info-links">
            <a href="${profile.onet_url}" target="_blank" rel="noopener" class="info-link-card">
              <strong>${t('profile.view_on_onet')}</strong>
              <span class="muted">O*NET OnLine</span>
            </a>
            <a href="${profile.ooh_url}" target="_blank" rel="noopener" class="info-link-card">
              <strong>${t('profile.view_on_bls')}</strong>
              <span class="muted">Bureau of Labor Statistics</span>
            </a>
          </div>
        `)}
        <div class="profile-cta">
          <p class="cta-label">${t('profile.calculate_roi')}</p>
          <a href="#/detail/${soc}" role="button" class="cta-btn">
            ${t('profile.deep_dive_roi')} &rarr;
          </a>
        </div>
      </div>
    </details>
  `;
}

/* ── Shared renderers ─────────────────────────────────────────── */

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

function renderPaySection(wageData) {
  if (!wageData) {
    return `<p class="muted">${t('detail.error_wages')}</p>`;
  }

  const median = wageData.annualMedian;
  const p10 = wageData.annual10;
  const p90 = wageData.annual90;

  let meterHtml = '';
  if (p10 != null && p90 != null && median != null) {
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

function renderSimilarCareers(careers, isZh) {
  if (!careers.length) return `<p class="muted">-</p>`;

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
