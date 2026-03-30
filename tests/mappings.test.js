import { describe, it, expect } from 'vitest';
import {
  BASELINE_SALARIES,
  DEGREE_LEVELS,
  DEGREE_DURATION,
  CAREER_MAPPINGS,
  findBySoc,
  findByCip,
  searchCareers,
  getBaselineSalary,
  getEducationDuration,
} from '../src/engine/mappings.js';

describe('BASELINE_SALARIES', () => {
  it('has expected education levels', () => {
    expect(BASELINE_SALARIES.highSchool).toBeGreaterThan(0);
    expect(BASELINE_SALARIES.bachelors).toBeGreaterThan(BASELINE_SALARIES.highSchool);
    expect(BASELINE_SALARIES.masters).toBeGreaterThan(BASELINE_SALARIES.bachelors);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(BASELINE_SALARIES)).toBe(true);
  });
});

describe('CAREER_MAPPINGS', () => {
  it('has at least 20 entries', () => {
    expect(CAREER_MAPPINGS.length).toBeGreaterThanOrEqual(20);
  });

  it('every entry has required fields', () => {
    for (const m of CAREER_MAPPINGS) {
      expect(m.soc).toMatch(/^\d{2}-\d{4}$/);
      expect(m.cip).toMatch(/^\d{4}$/);
      expect(m.career).toBeTruthy();
      expect(m.careerZh).toBeTruthy();
      expect(m.typicalDegree).toBeTruthy();
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(CAREER_MAPPINGS)).toBe(true);
  });
});

describe('findBySoc', () => {
  it('finds Software Developer', () => {
    const result = findBySoc('15-1252');
    expect(result).toBeDefined();
    expect(result.career).toBe('Software Developer');
  });

  it('returns undefined for unknown code', () => {
    expect(findBySoc('99-9999')).toBeUndefined();
  });
});

describe('findByCip', () => {
  it('finds by CIP code', () => {
    const results = findByCip('1107');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].career).toBe('Software Developer');
  });

  it('returns empty array for unknown CIP', () => {
    expect(findByCip('9999')).toHaveLength(0);
  });
});

describe('searchCareers', () => {
  it('finds by English name', () => {
    const results = searchCareers('nurse');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('finds by Chinese name', () => {
    const results = searchCareers('律師');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].career).toBe('Lawyer');
  });

  it('is case-insensitive for English', () => {
    const results = searchCareers('SOFTWARE');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty for no match', () => {
    expect(searchCareers('xyznonexistent')).toHaveLength(0);
  });
});

describe('getBaselineSalary', () => {
  it('returns high school for certificate', () => {
    expect(getBaselineSalary('certificate')).toBe(BASELINE_SALARIES.highSchool);
  });

  it('returns someCollege for bachelors', () => {
    expect(getBaselineSalary('bachelors')).toBe(BASELINE_SALARIES.someCollege);
  });

  it('returns bachelors for masters', () => {
    expect(getBaselineSalary('masters')).toBe(BASELINE_SALARIES.bachelors);
  });

  it('defaults to highSchool for unknown', () => {
    expect(getBaselineSalary('unknown')).toBe(BASELINE_SALARIES.highSchool);
  });
});

describe('getEducationDuration', () => {
  it('returns 4 for bachelors', () => {
    expect(getEducationDuration('bachelors')).toBe(4);
  });

  it('returns 2 for associates', () => {
    expect(getEducationDuration('associates')).toBe(2);
  });

  it('defaults to 4 for unknown', () => {
    expect(getEducationDuration('unknown')).toBe(4);
  });
});
