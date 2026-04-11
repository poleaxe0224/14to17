import { describe, it, expect } from 'vitest';
import profilesData from '../src/data/occupation-profiles.json';
import textEn from '../src/data/profile-text-en.json';
import textZhTW from '../src/data/profile-text-zh-TW.json';
import { CAREER_MAPPINGS, findBySoc, getRelatedCareers, findByCategory } from '../src/engine/mappings.js';

// ── Structural Profile Data ───────────────────────────────────────────

describe('occupation-profiles.json (structural)', () => {
  const profiles = profilesData.profiles;
  const socCodes = CAREER_MAPPINGS.map((m) => m.soc);

  it('has profiles for all 25 CAREER_MAPPINGS SOC codes', () => {
    for (const soc of socCodes) {
      expect(profiles[soc], `missing profile for SOC ${soc}`).toBeDefined();
    }
  });

  it('every profile has required structural fields', () => {
    for (const [soc, profile] of Object.entries(profiles)) {
      expect(profile.ooh_url, `${soc} missing ooh_url`).toBeTruthy();
      expect(profile.onet_url, `${soc} missing onet_url`).toBeTruthy();
      expect(profile.state_url, `${soc} missing state_url`).toBeTruthy();
      expect(profile.outlook, `${soc} missing outlook`).toBeDefined();
      expect(profile.similar_soc, `${soc} missing similar_soc`).toBeDefined();
    }
  });

  it('O*NET URLs follow deterministic pattern', () => {
    for (const [soc, profile] of Object.entries(profiles)) {
      expect(profile.onet_url).toBe(`https://www.onetonline.org/link/summary/${soc}.00`);
    }
  });

  it('similar_soc references only valid SOC codes in CAREER_MAPPINGS', () => {
    for (const [soc, profile] of Object.entries(profiles)) {
      for (const ref of profile.similar_soc) {
        expect(socCodes, `${soc} references unknown SOC ${ref}`).toContain(ref);
      }
    }
  });

  it('growth_label is from valid enum', () => {
    const valid = ['much_faster', 'faster', 'average', 'slower', 'declining'];
    for (const [soc, profile] of Object.entries(profiles)) {
      expect(valid, `${soc} has invalid growth_label: ${profile.outlook.growth_label}`)
        .toContain(profile.outlook.growth_label);
    }
  });

  it('outlook fields are numeric', () => {
    for (const [soc, profile] of Object.entries(profiles)) {
      const ol = profile.outlook;
      expect(typeof ol.employment_2024, `${soc}.employment_2024`).toBe('number');
      expect(typeof ol.growth_rate, `${soc}.growth_rate`).toBe('number');
      expect(typeof ol.projected_change, `${soc}.projected_change`).toBe('number');
    }
  });
});

// ── Per-Locale Text Data ──────────────────────────────────────────────

describe('profile text files (per-locale)', () => {
  const socCodes = CAREER_MAPPINGS.map((m) => m.soc);

  it('EN text covers all 25 SOC codes', () => {
    for (const soc of socCodes) {
      expect(textEn[soc], `EN missing SOC ${soc}`).toBeDefined();
    }
  });

  it('zh-TW text covers all 25 SOC codes', () => {
    for (const soc of socCodes) {
      expect(textZhTW[soc], `zh-TW missing SOC ${soc}`).toBeDefined();
    }
  });

  it('all EN text fields are non-empty strings', () => {
    for (const [soc, text] of Object.entries(textEn)) {
      expect(text.what_they_do, `${soc}.what_they_do`).toBeTruthy();
      expect(text.work_environment, `${soc}.work_environment`).toBeTruthy();
      expect(text.how_to_become.education, `${soc}.education`).toBeTruthy();
      expect(text.how_to_become.experience, `${soc}.experience`).toBeTruthy();
      expect(text.how_to_become.training, `${soc}.training`).toBeTruthy();
    }
  });

  it('all zh-TW text fields are non-empty strings', () => {
    for (const [soc, text] of Object.entries(textZhTW)) {
      expect(text.what_they_do, `${soc}.what_they_do`).toBeTruthy();
      expect(text.work_environment, `${soc}.work_environment`).toBeTruthy();
      expect(text.how_to_become.education, `${soc}.education`).toBeTruthy();
      expect(text.how_to_become.experience, `${soc}.experience`).toBeTruthy();
      expect(text.how_to_become.training, `${soc}.training`).toBeTruthy();
    }
  });

  it('EN and zh-TW have the same SOC codes', () => {
    expect(Object.keys(textEn).sort()).toEqual(Object.keys(textZhTW).sort());
  });
});

// ── Mappings Extension ────────────────────────────────────────────────

describe('CAREER_MAPPINGS category/icon fields', () => {
  const validCategories = ['tech', 'healthcare', 'business', 'engineering', 'education', 'trades', 'legal', 'creative', 'community', 'science', 'protective', 'transportation'];

  it('every career has a category field', () => {
    for (const c of CAREER_MAPPINGS) {
      expect(c.category, `${c.soc} missing category`).toBeTruthy();
    }
  });

  it('every category is from the valid set', () => {
    for (const c of CAREER_MAPPINGS) {
      expect(validCategories, `${c.soc} has invalid category: ${c.category}`)
        .toContain(c.category);
    }
  });

  it('every career has an icon field', () => {
    for (const c of CAREER_MAPPINGS) {
      expect(c.icon, `${c.soc} missing icon`).toBeTruthy();
    }
  });
});

describe('getRelatedCareers', () => {
  it('returns careers in the same category, excluding self', () => {
    const related = getRelatedCareers('15-1252');
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((r) => r.category === 'tech')).toBe(true);
    expect(related.find((r) => r.soc === '15-1252')).toBeUndefined();
  });

  it('returns empty array for unknown SOC', () => {
    expect(getRelatedCareers('99-9999')).toEqual([]);
  });
});

describe('findByCategory', () => {
  it('returns all tech careers', () => {
    const tech = findByCategory('tech');
    expect(tech.length).toBe(5);
    expect(tech.every((c) => c.category === 'tech')).toBe(true);
  });

  it('returns empty for non-existent category', () => {
    expect(findByCategory('nonexistent')).toEqual([]);
  });
});
