import { describe, it, expect } from 'vitest';
import {
  BASELINE_SALARIES,
  DEGREE_LEVELS,
  DEGREE_DURATION,
  GRAD_PHASE_DURATION,
  GRADUATE_DEGREES,
  CAREER_MAPPINGS,
  findBySoc,
  findByCip,
  searchCareers,
  getBaselineSalary,
  getEducationDuration,
  getGradPhaseDuration,
  isGraduateDegree,
  findByInterest,
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

  it('every entry has required fields including interests', () => {
    const validInterests = ['build', 'help', 'analyze', 'create'];
    for (const m of CAREER_MAPPINGS) {
      expect(m.soc).toMatch(/^\d{2}-\d{4}$/);
      expect(m.cip).toMatch(/^\d{4}$/);
      expect(m.career).toBeTruthy();
      expect(m.careerZh).toBeTruthy();
      expect(m.typicalDegree).toBeTruthy();
      expect(Array.isArray(m.interests)).toBe(true);
      expect(m.interests.length).toBeGreaterThanOrEqual(1);
      for (const i of m.interests) {
        expect(validInterests).toContain(i);
      }
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(CAREER_MAPPINGS)).toBe(true);
  });

  it('has no duplicate SOC codes', () => {
    const seen = new Map();
    const dupes = [];
    for (const m of CAREER_MAPPINGS) {
      if (seen.has(m.soc)) {
        dupes.push({ soc: m.soc, career: m.career, firstAt: seen.get(m.soc) });
      } else {
        seen.set(m.soc, m.career);
      }
    }
    expect(dupes).toEqual([]);
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
  it('returns highSchool for certificate (teen mode)', () => {
    expect(getBaselineSalary('certificate')).toBe(BASELINE_SALARIES.highSchool);
  });

  it('returns highSchool for bachelors (teen mode)', () => {
    expect(getBaselineSalary('bachelors')).toBe(BASELINE_SALARIES.highSchool);
  });

  it('returns highSchool for masters (teen mode — full path from HS)', () => {
    expect(getBaselineSalary('masters')).toBe(BASELINE_SALARIES.highSchool);
  });

  it('returns highSchool for firstProfessional (teen mode)', () => {
    expect(getBaselineSalary('firstProfessional')).toBe(BASELINE_SALARIES.highSchool);
  });

  it('defaults to highSchool for unknown', () => {
    expect(getBaselineSalary('unknown')).toBe(BASELINE_SALARIES.highSchool);
  });

  it('postBac mode: returns bachelors salary for masters', () => {
    expect(getBaselineSalary('masters', 'postBac')).toBe(BASELINE_SALARIES.bachelors);
  });

  it('postBac mode: returns bachelors salary for doctoral', () => {
    expect(getBaselineSalary('doctoral', 'postBac')).toBe(BASELINE_SALARIES.bachelors);
  });

  it('postBac mode: returns bachelors salary for firstProfessional', () => {
    expect(getBaselineSalary('firstProfessional', 'postBac')).toBe(BASELINE_SALARIES.bachelors);
  });

  it('postBac mode: non-graduate degrees still use highSchool', () => {
    expect(getBaselineSalary('bachelors', 'postBac')).toBe(BASELINE_SALARIES.highSchool);
    expect(getBaselineSalary('certificate', 'postBac')).toBe(BASELINE_SALARIES.highSchool);
  });
});

describe('findByInterest', () => {
  it('finds careers tagged with build', () => {
    const results = findByInterest('build');
    expect(results.length).toBeGreaterThanOrEqual(5);
    expect(results.every((c) => c.interests.includes('build'))).toBe(true);
  });

  it('finds careers tagged with help', () => {
    const results = findByInterest('help');
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it('finds careers tagged with analyze', () => {
    const results = findByInterest('analyze');
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it('finds careers tagged with create', () => {
    const results = findByInterest('create');
    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  it('returns empty for unknown interest', () => {
    expect(findByInterest('unknown')).toHaveLength(0);
  });

  it('includes multi-tagged careers in both groups', () => {
    const swDev = findBySoc('15-1252');
    expect(swDev.interests).toContain('build');
    expect(swDev.interests).toContain('create');
    expect(findByInterest('build')).toContain(swDev);
    expect(findByInterest('create')).toContain(swDev);
  });
});

describe('getEducationDuration', () => {
  it('returns 4 for bachelors', () => {
    expect(getEducationDuration('bachelors')).toBe(4);
  });

  it('returns 2 for associates', () => {
    expect(getEducationDuration('associates')).toBe(2);
  });

  it('returns 6 for masters (4 undergrad + 2 grad)', () => {
    expect(getEducationDuration('masters')).toBe(6);
  });

  it('returns 9 for doctoral (4 undergrad + 5 grad)', () => {
    expect(getEducationDuration('doctoral')).toBe(9);
  });

  it('returns 7 for firstProfessional (4 undergrad + 3 prof)', () => {
    expect(getEducationDuration('firstProfessional')).toBe(7);
  });

  it('defaults to 4 for unknown', () => {
    expect(getEducationDuration('unknown')).toBe(4);
  });
});

describe('getGradPhaseDuration', () => {
  it('returns 2 for masters (grad phase only)', () => {
    expect(getGradPhaseDuration('masters')).toBe(2);
  });

  it('returns 5 for doctoral (grad phase only)', () => {
    expect(getGradPhaseDuration('doctoral')).toBe(5);
  });

  it('returns 3 for firstProfessional (prof phase only)', () => {
    expect(getGradPhaseDuration('firstProfessional')).toBe(3);
  });

  it('returns 4 for bachelors (same as total)', () => {
    expect(getGradPhaseDuration('bachelors')).toBe(4);
  });
});

describe('isGraduateDegree', () => {
  it('returns true for masters, doctoral, firstProfessional', () => {
    expect(isGraduateDegree('masters')).toBe(true);
    expect(isGraduateDegree('doctoral')).toBe(true);
    expect(isGraduateDegree('firstProfessional')).toBe(true);
  });

  it('returns false for certificate, associates, bachelors', () => {
    expect(isGraduateDegree('certificate')).toBe(false);
    expect(isGraduateDegree('associates')).toBe(false);
    expect(isGraduateDegree('bachelors')).toBe(false);
  });
});

describe('GRADUATE_DEGREES', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(GRADUATE_DEGREES)).toBe(true);
  });

  it('contains exactly masters, doctoral, firstProfessional', () => {
    expect(GRADUATE_DEGREES.size).toBe(3);
    expect(GRADUATE_DEGREES.has('masters')).toBe(true);
    expect(GRADUATE_DEGREES.has('doctoral')).toBe(true);
    expect(GRADUATE_DEGREES.has('firstProfessional')).toBe(true);
  });
});
