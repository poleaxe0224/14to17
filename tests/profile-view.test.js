/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mocks (hoisted before profile.js import) ────────────────────────

// Pass-through i18n — rendered HTML will contain raw dot-notation keys,
// which makes assertions precise and locale-independent.
vi.mock('../src/i18n/i18n.js', () => ({
  t: (key) => key,
  getLocale: () => 'en',
}));

vi.mock('../src/api/profiles.js', () => ({
  getProfile: vi.fn(async () => ({
    what_they_do: 'RNs provide patient care.',
    work_environment: 'Hospitals, clinics, nursing homes.',
    how_to_become: {
      education: "Bachelor's degree",
      experience: 'None',
      training: 'None',
    },
    outlook: {
      employment_2024: 3282010,
      growth_rate: 6,
      growth_label: 'faster',
      projected_change: 197000,
    },
    similar_soc: [],
    onet_url: 'https://www.onetonline.org/link/summary/29-1141.00',
    ooh_url: 'https://www.bls.gov/ooh/healthcare/registered-nurses.htm',
    state_url: 'https://www.bls.gov/oes/current/oes291141.htm',
  })),
}));

vi.mock('../src/api/onet.js', () => ({
  getOnetData: vi.fn(async () => null),
}));

vi.mock('../src/api/career-data.js', () => ({
  fetchCareerEconomics: vi.fn(async () => ({ wageData: null, roi: null })),
}));

// Under test
const { render, afterRender } = await import('../src/views/profile.js');

const SOC = '29-1141'; // Registered Nurses (exists in CAREER_MAPPINGS)

function mountProfile() {
  document.body.innerHTML = `<main id="app">${render({ soc: SOC })}</main>`;
}

describe('profile.js — Level 4 (Decide) redesign', () => {
  beforeEach(async () => {
    mountProfile();
    await afterRender({ soc: SOC });
  });

  it('renders a "next steps" action section with the new heading key', () => {
    const level4 = document.getElementById('level-4');
    expect(level4).toBeTruthy();
    const nextStepsCard = level4.querySelector('#prof-next-steps');
    expect(nextStepsCard).toBeTruthy();
    expect(nextStepsCard.textContent).toContain('profile.next_steps');
  });

  it('renders 3 next-step cards (compare / report / share)', () => {
    const cards = document.querySelectorAll('#level-4 .next-step-card');
    expect(cards.length).toBe(3);
  });

  it('"Add to Compare" links to Compare page with soc1 query param', () => {
    const compareLink = document.querySelector(
      '#level-4 a[href^="#/compare"]'
    );
    expect(compareLink).toBeTruthy();
    expect(compareLink.getAttribute('href')).toBe(`#/compare?soc1=${SOC}`);
    expect(compareLink.textContent).toContain('profile.add_to_compare');
  });

  it('"Download Report" links to Report page', () => {
    const reportLink = document.querySelector('#level-4 a[href="#/report"]');
    expect(reportLink).toBeTruthy();
    expect(reportLink.textContent).toContain('profile.download_report');
  });

  it('renders share UI inside Level 4 with a wrapper id for handlers', () => {
    const shareWrap = document.getElementById('profile-share-wrap');
    expect(shareWrap).toBeTruthy();
    // Either native button or dropdown fallback — both carry [data-share]
    expect(shareWrap.querySelector('[data-share]')).toBeTruthy();
    // Message element for feedback
    expect(document.getElementById('profile-share-msg')).toBeTruthy();
    expect(shareWrap.textContent).toContain('profile.share_with_mentor');
  });

  it('does NOT render a duplicate ROI deep-dive CTA in Level 4', () => {
    const level4 = document.getElementById('level-4');
    // The old CTA linked to #/detail/:soc inside Level 4 — must be gone.
    expect(level4.querySelector('a[href^="#/detail/"]')).toBeNull();
    // And the old "calculate_roi" label must be gone.
    expect(level4.textContent).not.toContain('profile.calculate_roi');
  });

  it('preserves external O*NET and BLS resource links', () => {
    const level4 = document.getElementById('level-4');
    const onetLink = level4.querySelector('a[href*="onetonline.org"]');
    const blsLink = level4.querySelector('a[href*="bls.gov/ooh"]');
    expect(onetLink).toBeTruthy();
    expect(blsLink).toBeTruthy();
    // External links must open in a new tab with noopener
    expect(onetLink.getAttribute('target')).toBe('_blank');
    expect(onetLink.getAttribute('rel')).toContain('noopener');
    expect(blsLink.getAttribute('target')).toBe('_blank');
    expect(blsLink.getAttribute('rel')).toContain('noopener');
  });

  it('labels the external section with the new "external_resources" key', () => {
    const externalCard = document.querySelector('#level-4 #prof-more');
    expect(externalCard).toBeTruthy();
    expect(externalCard.textContent).toContain('profile.external_resources');
    // And no longer the old generic "more_info" label.
    expect(externalCard.textContent).not.toContain('profile.more_info');
  });

});

describe('profile.js — Level 3 stays unchanged', () => {
  beforeEach(async () => {
    // Level 3 reads fetchCareerEconomics — stub it with ROI layers so
    // the deep-dive button is rendered.
    const careerData = await import('../src/api/career-data.js');
    careerData.fetchCareerEconomics.mockResolvedValueOnce({
      wageData: {
        annualMedian: 93600,
        annual10: 66030,
        annual90: 135320,
      },
      roi: {
        layers: {
          basic: { roi: 790.8, discountedRoi: 355.9 },
          riskAdjusted: { roi: 352.3, discountedRoi: 158.6, fallback: false },
          competitionAdjusted: { roi: 346.6, discountedRoi: 156.0, fallback: false },
        },
      },
    });

    mountProfile();
    await afterRender({ soc: SOC });

    const level3 = document.getElementById('level-3');
    level3.open = true;
    level3.dispatchEvent(new Event('toggle'));
    // Await microtasks for the async toggle handler
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  });

  it('Level 3 still contains the ROI deep-dive link (not removed)', () => {
    const level3 = document.getElementById('level-3');
    const deepDive = level3.querySelector('a[href^="#/detail/"]');
    expect(deepDive).toBeTruthy();
    expect(deepDive.getAttribute('href')).toBe(`#/detail/${SOC}`);
  });
});
