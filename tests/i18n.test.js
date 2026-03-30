import { describe, it, expect, beforeEach } from 'vitest';

// We test the i18n JSON files directly (the runtime needs DOM/localStorage)
import en from '../src/i18n/en.json';
import zhTW from '../src/i18n/zh-TW.json';

function resolve(dict, key) {
  const parts = key.split('.');
  let value = dict;
  for (const p of parts) {
    if (value == null) return undefined;
    value = value[p];
  }
  return value;
}

function allKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      keys.push(...allKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('i18n translation files', () => {
  const enKeys = allKeys(en);
  const zhKeys = allKeys(zhTW);

  it('en.json has keys', () => {
    expect(enKeys.length).toBeGreaterThan(50);
  });

  it('zh-TW.json has same number of keys as en.json', () => {
    expect(zhKeys.length).toBe(enKeys.length);
  });

  it('every en key exists in zh-TW', () => {
    const missing = enKeys.filter((k) => !zhKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('every zh-TW key exists in en', () => {
    const extra = zhKeys.filter((k) => !enKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it('no en values are empty strings', () => {
    const empty = enKeys.filter((k) => resolve(en, k) === '');
    expect(empty).toEqual([]);
  });

  it('no zh-TW values are empty strings', () => {
    const empty = zhKeys.filter((k) => resolve(zhTW, k) === '');
    expect(empty).toEqual([]);
  });

  it('nav keys exist in both locales', () => {
    expect(resolve(en, 'nav.home')).toBe('Home');
    expect(resolve(zhTW, 'nav.home')).toBe('首頁');
  });

  it('common degree labels exist', () => {
    const degrees = ['certificate', 'associates', 'bachelors', 'masters', 'doctoral', 'firstProfessional'];
    for (const d of degrees) {
      expect(resolve(en, `common.degree_${d}`)).toBeTruthy();
      expect(resolve(zhTW, `common.degree_${d}`)).toBeTruthy();
    }
  });

  it('compare section has required keys', () => {
    const required = ['title', 'subtitle', 'select_career', 'compare_btn', 'npv', 'irr', 'lifetime_roi'];
    for (const k of required) {
      expect(resolve(en, `compare.${k}`)).toBeTruthy();
      expect(resolve(zhTW, `compare.${k}`)).toBeTruthy();
    }
  });

  it('pdf section has required keys', () => {
    const required = ['export', 'exporting', 'report_title', 'generated', 'disclaimer'];
    for (const k of required) {
      expect(resolve(en, `pdf.${k}`)).toBeTruthy();
      expect(resolve(zhTW, `pdf.${k}`)).toBeTruthy();
    }
  });
});
