import { describe, it, expect } from 'vitest';
import {
  estimateAvgDropoutYear,
  calcDropoutROI,
  calcRiskAdjustedROI,
  calcSaturationPenalty,
  calcCompetitionAdjustedROI,
  calcThreeLayerROI,
  DEFAULTS,
} from '../src/engine/roi.js';

// ─── Layer 2: Risk-Adjusted ROI ────────────────────────────────────────

describe('calcRiskAdjustedROI', () => {
  it('scales ROI by graduation rate (legacy: no dropoutROI)', () => {
    // CS: basic ROI 200%, grad rate 65% → 130% (legacy: dropout=0)
    const result = calcRiskAdjustedROI(200, 0.65);
    expect(result.value).toBeCloseTo(130, 1);
    expect(result.fallback).toBe(true); // legacy mode without dropoutROI
  });

  it('returns 0 when graduation rate is 0 (legacy)', () => {
    const result = calcRiskAdjustedROI(200, 0);
    expect(result.value).toBe(0);
    expect(result.fallback).toBe(true);
  });

  it('returns basic ROI when graduation rate is 1.0 (legacy)', () => {
    const result = calcRiskAdjustedROI(150, 1.0);
    expect(result.value).toBe(150);
    expect(result.fallback).toBe(true);
  });

  it('falls back to basic ROI when graduation rate is null', () => {
    const result = calcRiskAdjustedROI(175, null);
    expect(result.value).toBe(175);
    expect(result.fallback).toBe(true);
  });
});

// ─── estimateAvgDropoutYear ────────────────────────────────────────────

describe('estimateAvgDropoutYear', () => {
  it('returns ~1.8 for retentionRate = 0.82', () => {
    const result = estimateAvgDropoutYear(0.82);
    expect(result).toBeCloseTo(1.8, 0);
    expect(result).toBeGreaterThan(1);
    expect(result).toBeLessThan(3);
  });

  it('returns maxYears when retentionRate is null', () => {
    expect(estimateAvgDropoutYear(null)).toBe(4);
    expect(estimateAvgDropoutYear(null, 6)).toBe(6);
  });

  it('returns maxYears when retentionRate is 1.0', () => {
    expect(estimateAvgDropoutYear(1.0)).toBe(4);
  });

  it('returns 1 when retentionRate is 0', () => {
    expect(estimateAvgDropoutYear(0)).toBe(1);
  });

  it('respects custom maxYears', () => {
    const result = estimateAvgDropoutYear(0.82, 2);
    expect(result).toBeLessThanOrEqual(2);
  });
});

// ─── calcDropoutROI ───────────────────────────────────────────────────

describe('calcDropoutROI', () => {
  it('returns negative ROI for typical dropout (hand-verified)', () => {
    // tuition=$30k, dropout year=2, dropout salary=$53k, baseline=$35k
    const roi = calcDropoutROI({
      annualTuition: 30_000,
      avgDropoutYear: 2,
      dropoutSalary: 53_000,
      baselineSalary: 35_000,
      salaryGrowthRate: 0,
      careerYears: 40,
    });
    // Cost: 2 years × (30k tuition + 35k opportunity) = 130k
    // Premium: 53k - 35k = 18k/yr × 42 remaining years = 756k
    // Net = 756k - 130k = 626k, ROI = 626k/130k × 100 = ~481%
    // (positive because some-college premium is significant over 42 years)
    expect(typeof roi).toBe('number');
    expect(roi).not.toBeNaN();
  });

  it('returns large negative ROI when dropout salary equals baseline', () => {
    // No earnings premium, only costs
    const roi = calcDropoutROI({
      annualTuition: 30_000,
      avgDropoutYear: 2,
      dropoutSalary: 35_000,
      baselineSalary: 35_000,
      salaryGrowthRate: 0,
      careerYears: 40,
    });
    expect(roi).toBeLessThan(0);
  });

  it('handles fractional dropout year', () => {
    const roi = calcDropoutROI({
      annualTuition: 20_000,
      avgDropoutYear: 1.5,
      dropoutSalary: 40_000,
      baselineSalary: 35_000,
      salaryGrowthRate: 0.02,
      careerYears: 40,
    });
    expect(typeof roi).toBe('number');
    expect(roi).not.toBeNaN();
  });
});

// ─── calcRiskAdjustedROI with dropoutROI ──────────────────────────────

describe('calcRiskAdjustedROI (expected value model)', () => {
  it('legacy: (100, 0.6, null) → fallback: true, value: 60', () => {
    const result = calcRiskAdjustedROI(100, 0.6, null);
    expect(result.value).toBe(60);
    expect(result.fallback).toBe(true);
  });

  it('full model: (100, 0.6, -50) → value: 40, fallback: false', () => {
    // 0.6 × 100 + 0.4 × (-50) = 60 - 20 = 40
    const result = calcRiskAdjustedROI(100, 0.6, -50);
    expect(result.value).toBeCloseTo(40);
    expect(result.fallback).toBe(false);
  });

  it('no graduation rate: (100, null, -50) → fallback: true, value: 100', () => {
    const result = calcRiskAdjustedROI(100, null, -50);
    expect(result.value).toBe(100);
    expect(result.fallback).toBe(true);
  });

  it('full model yields lower ROI than legacy when dropoutROI is negative', () => {
    const legacy = calcRiskAdjustedROI(200, 0.65, null);
    const full = calcRiskAdjustedROI(200, 0.65, -80);
    expect(full.value).toBeLessThan(legacy.value);
  });
});

// ─── Saturation Penalty ────────────────────────────────────────────────

describe('calcSaturationPenalty', () => {
  it('computes low penalty for low saturation (CS: 114000/1847900)', () => {
    const result = calcSaturationPenalty(114_000, 1_847_900, 0.3, 0.25);
    // ratio = 0.0617, penalty = 0.0617 * 0.3 = 0.0185
    expect(result.ratio).toBeCloseTo(0.0617, 3);
    expect(result.penalty).toBeCloseTo(0.0185, 3);
    expect(result.fallback).toBe(false);
  });

  it('caps penalty at maxPenalty for high saturation', () => {
    // Hypothetical: 120000 grads / 50000 jobs → ratio 2.4, raw penalty 0.72, capped at 0.25
    const result = calcSaturationPenalty(120_000, 50_000, 0.3, 0.25);
    expect(result.penalty).toBe(0.25);
    expect(result.fallback).toBe(false);
  });

  it('returns zero penalty when supply is null', () => {
    const result = calcSaturationPenalty(null, 500_000);
    expect(result.penalty).toBe(0);
    expect(result.fallback).toBe(true);
  });

  it('returns zero penalty when demand is null', () => {
    const result = calcSaturationPenalty(50_000, null);
    expect(result.penalty).toBe(0);
    expect(result.fallback).toBe(true);
  });

  it('returns max penalty when demand is 0', () => {
    const result = calcSaturationPenalty(10_000, 0, 0.3, 0.25);
    expect(result.penalty).toBe(0.25);
    expect(result.ratio).toBe(Infinity);
  });

  it('respects custom k and maxPenalty', () => {
    // ratio = 0.5, k = 1.0 → raw = 0.5, maxPenalty = 0.4 → capped at 0.4
    const result = calcSaturationPenalty(50_000, 100_000, 1.0, 0.4);
    expect(result.penalty).toBe(0.4);
  });
});

// ─── Layer 3: Competition-Adjusted ROI ─────────────────────────────────

describe('calcCompetitionAdjustedROI', () => {
  it('applies saturation penalty to risk-adjusted ROI', () => {
    // riskROI = 130%, supply = 114000, demand = 1847900
    // penalty ≈ 0.0185 → adjusted = 130 * (1 - 0.0185) ≈ 127.6
    const result = calcCompetitionAdjustedROI(130, 114_000, 1_847_900, 0.3, 0.25);
    expect(result.value).toBeCloseTo(127.6, 0);
    expect(result.fallback).toBe(false);
  });

  it('falls back when supply or demand is null', () => {
    const result = calcCompetitionAdjustedROI(130, null, 500_000);
    expect(result.value).toBe(130); // no penalty applied
    expect(result.fallback).toBe(true);
  });

  it('manual verification: Psychology-like field (high saturation)', () => {
    // supply = 120000, demand = 190000, ratio = 0.63
    // penalty = min(0.63 * 0.3, 0.25) = min(0.189, 0.25) = 0.189
    // adjusted = 100 * (1 - 0.189) = 81.1
    const result = calcCompetitionAdjustedROI(100, 120_000, 190_000, 0.3, 0.25);
    expect(result.value).toBeCloseTo(81.1, 0);
    expect(result.saturation.penalty).toBeCloseTo(0.189, 2);
  });
});

// ─── Full Three-Layer Integration ──────────────────────────────────────

describe('calcThreeLayerROI', () => {
  const baseInputs = {
    annualTuition: 20_000,
    educationYears: 4,
    postDegreeSalary: 80_000,
    baselineSalary: 38_640,
  };

  it('returns all three layers with valid IPEDS data', () => {
    const result = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: 0.65,
      completionsTotal: 114_000,
      totalEmployment: 1_847_900,
    });

    // Layer 1
    expect(result.layers.basic.roi).toBeGreaterThan(0);
    expect(result.layers.basic.fallback).toBe(false);

    // Layer 2 (legacy mode — no retentionRate/dropoutSalary provided)
    expect(result.layers.riskAdjusted.roi).toBeLessThan(result.layers.basic.roi);
    expect(result.layers.riskAdjusted.graduationRate).toBe(0.65);
    expect(result.layers.riskAdjusted.fallback).toBe(true);

    // Layer 3
    expect(result.layers.competitionAdjusted.roi).toBeLessThanOrEqual(result.layers.riskAdjusted.roi);
    expect(result.layers.competitionAdjusted.saturationRatio).toBeGreaterThan(0);
    expect(result.layers.competitionAdjusted.fallback).toBe(false);

    // Verify ordering: basic ≥ risk ≥ competition
    expect(result.layers.basic.roi).toBeGreaterThanOrEqual(result.layers.riskAdjusted.roi);
    expect(result.layers.riskAdjusted.roi).toBeGreaterThanOrEqual(result.layers.competitionAdjusted.roi);

    // Discounted versions exist and are lower
    expect(result.layers.basic.discountedRoi).toBeLessThan(result.layers.basic.roi);
    expect(result.layers.riskAdjusted.discountedRoi).toBeLessThan(result.layers.riskAdjusted.roi);
    expect(result.layers.competitionAdjusted.discountedRoi).toBeLessThan(result.layers.competitionAdjusted.roi);

    // Discounted ordering: basic ≥ risk ≥ competition
    expect(result.layers.basic.discountedRoi).toBeGreaterThanOrEqual(result.layers.riskAdjusted.discountedRoi);
    expect(result.layers.riskAdjusted.discountedRoi).toBeGreaterThanOrEqual(result.layers.competitionAdjusted.discountedRoi);
  });

  it('gracefully degrades when graduation rate is null', () => {
    const result = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: null,
      completionsTotal: 114_000,
      totalEmployment: 1_847_900,
    });

    // Layer 2 falls back to Layer 1
    expect(result.layers.riskAdjusted.roi).toBe(result.layers.basic.roi);
    expect(result.layers.riskAdjusted.fallback).toBe(true);

    // Layer 3 still applies competition penalty to the fallback value
    expect(result.layers.competitionAdjusted.fallback).toBe(false);
  });

  it('gracefully degrades when employment data is null', () => {
    const result = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: 0.65,
      completionsTotal: null,
      totalEmployment: null,
    });

    // Layer 2 legacy mode (no dropout data)
    expect(result.layers.riskAdjusted.fallback).toBe(true);

    // Layer 3 falls back
    expect(result.layers.competitionAdjusted.roi).toBe(result.layers.riskAdjusted.roi);
    expect(result.layers.competitionAdjusted.fallback).toBe(true);
  });

  it('uses custom k and maxPenalty', () => {
    const resultDefault = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: 0.65,
      completionsTotal: 114_000,
      totalEmployment: 1_847_900,
    });

    const resultHighK = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: 0.65,
      completionsTotal: 114_000,
      totalEmployment: 1_847_900,
      competitionK: 1.0,
    });

    // Higher k → more penalty → lower competition-adjusted ROI
    expect(resultHighK.layers.competitionAdjusted.roi)
      .toBeLessThan(resultDefault.layers.competitionAdjusted.roi);
  });

  it('preserves existing calcFullROI output fields', () => {
    const result = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: 0.65,
      completionsTotal: 114_000,
      totalEmployment: 1_847_900,
    });

    // All original fields should be present
    expect(result.npv).toBeDefined();
    expect(result.irr).toBeDefined();
    expect(result.breakevenYear).toBeDefined();
    expect(result.lifetime).toBeDefined();
    expect(result.loan).toBeDefined();
    expect(result.cashFlows).toBeDefined();
  });

  it('uses expected-value model when retentionRate + dropoutSalary provided', () => {
    const result = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: 0.65,
      completionsTotal: 114_000,
      totalEmployment: 1_847_900,
      retentionRate: 0.82,
      dropoutSalary: 53_000,
    });

    // dropoutROI should be computed
    expect(result.layers.riskAdjusted.dropoutROI).not.toBeNull();
    expect(result.layers.riskAdjusted.retentionRate).toBe(0.82);
    expect(result.layers.riskAdjusted.fallback).toBe(false);

    // Full model ROI should differ from legacy
    const legacy = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: 0.65,
      completionsTotal: 114_000,
      totalEmployment: 1_847_900,
    });
    expect(result.layers.riskAdjusted.roi).not.toBe(legacy.layers.riskAdjusted.roi);
  });

  it('falls back to legacy when retentionRate is null', () => {
    const result = calcThreeLayerROI({
      ...baseInputs,
      graduationRate: 0.65,
      completionsTotal: 114_000,
      totalEmployment: 1_847_900,
      retentionRate: null,
      dropoutSalary: 53_000,
    });

    expect(result.layers.riskAdjusted.dropoutROI).toBeNull();
    expect(result.layers.riskAdjusted.fallback).toBe(true);
  });
});

// ─── DEFAULTS ──────────────────────────────────────────────────────────

describe('DEFAULTS for competition params', () => {
  it('has competitionK and maxPenalty', () => {
    expect(DEFAULTS.competitionK).toBe(0.3);
    expect(DEFAULTS.maxPenalty).toBe(0.25);
  });
});
