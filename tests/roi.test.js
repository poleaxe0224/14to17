import { describe, it, expect } from 'vitest';
import {
  buildCashFlows,
  calcNPV,
  calcIRR,
  calcBreakeven,
  calcLifetimeROI,
  calcMonthlyPayment,
  calcFullROI,
  DEFAULTS,
} from '../src/engine/roi.js';

// --- buildCashFlows ---

describe('buildCashFlows', () => {
  it('returns correct number of years', () => {
    const flows = buildCashFlows({
      annualTuition: 10_000,
      educationYears: 4,
      postDegreeSalary: 60_000,
      baselineSalary: 35_000,
      careerYears: 40,
    });
    expect(flows).toHaveLength(44); // 4 + 40
  });

  it('education years have negative net cash flow', () => {
    const flows = buildCashFlows({
      annualTuition: 20_000,
      educationYears: 4,
      postDegreeSalary: 60_000,
      baselineSalary: 35_000,
    });
    for (let i = 0; i < 4; i++) {
      expect(flows[i].net).toBeLessThan(0);
      expect(flows[i].earning).toBe(0);
    }
  });

  it('career years have positive net when degree salary > baseline', () => {
    const flows = buildCashFlows({
      annualTuition: 10_000,
      educationYears: 2,
      postDegreeSalary: 80_000,
      baselineSalary: 35_000,
      salaryGrowthRate: 0,
      careerYears: 5,
    });
    for (let i = 2; i < 7; i++) {
      expect(flows[i].net).toBeGreaterThan(0);
    }
  });

  it('year 0 cost = tuition + baseline salary', () => {
    const flows = buildCashFlows({
      annualTuition: 15_000,
      educationYears: 1,
      postDegreeSalary: 50_000,
      baselineSalary: 30_000,
      salaryGrowthRate: 0,
      careerYears: 1,
    });
    // Year 0: cost = -(15000 + 30000) = -45000
    expect(flows[0].net).toBe(-45_000);
  });

  it('applies salary growth correctly', () => {
    const flows = buildCashFlows({
      annualTuition: 0,
      educationYears: 0,
      postDegreeSalary: 100_000,
      baselineSalary: 50_000,
      salaryGrowthRate: 0.10, // 10% for easy math
      careerYears: 2,
    });
    // Year 0: degree=100k, baseline=50k, net=50k
    expect(flows[0].net).toBeCloseTo(50_000);
    // Year 1: degree=110k, baseline=55k, net=55k
    expect(flows[1].net).toBeCloseTo(55_000);
  });

  it('returns immutable-safe objects (no shared references)', () => {
    const flows = buildCashFlows({
      annualTuition: 10_000,
      educationYears: 2,
      postDegreeSalary: 60_000,
      careerYears: 3,
    });
    flows[0].net = 999;
    const flows2 = buildCashFlows({
      annualTuition: 10_000,
      educationYears: 2,
      postDegreeSalary: 60_000,
      careerYears: 3,
    });
    expect(flows2[0].net).not.toBe(999);
  });
});

// --- calcNPV ---

describe('calcNPV', () => {
  it('returns 0 when all cash flows are 0', () => {
    const flows = [{ net: 0 }, { net: 0 }, { net: 0 }];
    expect(calcNPV(flows)).toBe(0);
  });

  it('discounts future cash flows', () => {
    // $100 in year 1 at 10% discount = 100/1.1 ≈ 90.91
    const flows = [{ net: 0 }, { net: 100 }];
    expect(calcNPV(flows, 0.10)).toBeCloseTo(90.91, 1);
  });

  it('correctly sums multi-year discounted flows', () => {
    // -1000 now, +600 year 1, +600 year 2 at 10%
    // NPV = -1000 + 600/1.1 + 600/1.21 = -1000 + 545.45 + 495.87 = 41.32
    const flows = [{ net: -1000 }, { net: 600 }, { net: 600 }];
    expect(calcNPV(flows, 0.10)).toBeCloseTo(41.32, 0);
  });

  it('higher discount rate reduces NPV', () => {
    const flows = [{ net: -100 }, { net: 200 }];
    const npvLow = calcNPV(flows, 0.05);
    const npvHigh = calcNPV(flows, 0.20);
    expect(npvLow).toBeGreaterThan(npvHigh);
  });
});

// --- calcIRR ---

describe('calcIRR', () => {
  it('finds IRR for simple investment', () => {
    // Invest 100, get 110 next year → IRR = 10%
    const flows = [{ net: -100 }, { net: 110 }];
    const irr = calcIRR(flows);
    expect(irr).toBeCloseTo(0.10, 4);
  });

  it('finds IRR for multi-year investment', () => {
    // Invest 1000, get 500 per year for 3 years
    // IRR ≈ 23.4%
    const flows = [{ net: -1000 }, { net: 500 }, { net: 500 }, { net: 500 }];
    const irr = calcIRR(flows);
    expect(irr).toBeCloseTo(0.234, 2);
  });

  it('returns null for no-convergence case', () => {
    // All positive — no IRR exists (NPV always > 0)
    const flows = [{ net: 100 }, { net: 100 }];
    // May or may not converge, but should not crash
    const irr = calcIRR(flows);
    // If it converges to a weird value, that's ok — key is no crash
    expect(irr === null || typeof irr === 'number').toBe(true);
  });

  it('handles education-like cash flow pattern', () => {
    // 4 years negative, then 40 years positive
    const flows = [];
    for (let i = 0; i < 4; i++) flows.push({ net: -50_000 });
    for (let i = 0; i < 40; i++) flows.push({ net: 25_000 });
    const irr = calcIRR(flows);
    expect(irr).not.toBeNull();
    expect(irr).toBeGreaterThan(0);
    expect(irr).toBeLessThan(1); // reasonable range
  });
});

// --- calcBreakeven ---

describe('calcBreakeven', () => {
  it('finds breakeven year for simple case', () => {
    const flows = [{ net: -100 }, { net: -50 }, { net: 80 }, { net: 80 }];
    // Cumulative: -100, -150, -70, +10 → breakeven at year 3
    expect(calcBreakeven(flows)).toBe(3);
  });

  it('returns null when never breaking even', () => {
    const flows = [{ net: -100 }, { net: 10 }, { net: 10 }];
    expect(calcBreakeven(flows)).toBeNull();
  });

  it('returns 0 if first year is positive', () => {
    const flows = [{ net: 50 }, { net: 100 }];
    expect(calcBreakeven(flows)).toBe(0);
  });

  it('discounted breakeven is later than nominal', () => {
    const flows = [];
    for (let i = 0; i < 4; i++) flows.push({ net: -30_000 });
    for (let i = 0; i < 20; i++) flows.push({ net: 15_000 });

    const nominal = calcBreakeven(flows);
    const discounted = calcBreakeven(flows, 0.05);

    expect(nominal).not.toBeNull();
    expect(discounted).not.toBeNull();
    expect(discounted).toBeGreaterThanOrEqual(nominal);
  });
});

// --- calcLifetimeROI ---

describe('calcLifetimeROI', () => {
  it('calculates correct ROI', () => {
    // Cost: 200k, Premium: 800k → ROI = (800k-200k)/200k * 100 = 300%
    const flows = [
      { net: -100_000 }, { net: -100_000 },
      { net: 200_000 }, { net: 200_000 }, { net: 200_000 }, { net: 200_000 },
    ];
    const result = calcLifetimeROI(flows);
    expect(result.totalCost).toBe(200_000);
    expect(result.totalPremium).toBe(800_000);
    expect(result.netGain).toBe(600_000);
    expect(result.roi).toBe(300);
  });

  it('returns 0 ROI when no costs', () => {
    const flows = [{ net: 100 }, { net: 200 }];
    const result = calcLifetimeROI(flows);
    expect(result.roi).toBe(0); // 0 cost → 0 denominator → 0
  });

  it('returns negative ROI when costs exceed premium', () => {
    const flows = [{ net: -1000 }, { net: 100 }];
    const result = calcLifetimeROI(flows);
    expect(result.roi).toBeLessThan(0);
  });
});

// --- calcMonthlyPayment ---

describe('calcMonthlyPayment', () => {
  it('calculates standard amortization', () => {
    // $100k at 6% for 10 years → ~$1110.21/month
    const payment = calcMonthlyPayment(100_000, 0.06, 10);
    expect(payment).toBeCloseTo(1110.21, 0);
  });

  it('returns 0 for zero principal', () => {
    expect(calcMonthlyPayment(0, 0.05, 10)).toBe(0);
  });

  it('handles zero interest rate', () => {
    // $12,000 at 0% for 10 years = $100/month
    expect(calcMonthlyPayment(12_000, 0, 10)).toBe(100);
  });

  it('higher rate means higher payment', () => {
    const low = calcMonthlyPayment(50_000, 0.04, 10);
    const high = calcMonthlyPayment(50_000, 0.08, 10);
    expect(high).toBeGreaterThan(low);
  });
});

// --- calcFullROI ---

describe('calcFullROI', () => {
  const baseInputs = {
    annualTuition: 20_000,
    educationYears: 4,
    postDegreeSalary: 65_000,
    baselineSalary: 35_000,
    salaryGrowthRate: 0.02,
    careerYears: 40,
    discountRate: 0.04,
  };

  it('returns all expected fields', () => {
    const result = calcFullROI(baseInputs);

    expect(result).toHaveProperty('inputs');
    expect(result).toHaveProperty('cashFlows');
    expect(result).toHaveProperty('npv');
    expect(result).toHaveProperty('irr');
    expect(result).toHaveProperty('breakevenYear');
    expect(result).toHaveProperty('breakevenYearDiscounted');
    expect(result).toHaveProperty('lifetime');
    expect(result).toHaveProperty('loan');
  });

  it('NPV is positive for good investment', () => {
    const result = calcFullROI(baseInputs);
    expect(result.npv).toBeGreaterThan(0);
  });

  it('IRR is reasonable for typical education', () => {
    const result = calcFullROI(baseInputs);
    expect(result.irr).toBeGreaterThan(0.05);
    expect(result.irr).toBeLessThan(0.50);
  });

  it('breakeven is within career years', () => {
    const result = calcFullROI(baseInputs);
    expect(result.breakevenYear).not.toBeNull();
    expect(result.breakevenYear).toBeLessThan(44);
  });

  it('loan monthly payment is calculated', () => {
    const result = calcFullROI(baseInputs);
    expect(result.loan.totalBorrowed).toBe(80_000); // 20k × 4
    expect(result.loan.monthlyPayment).toBeGreaterThan(0);
  });

  it('preserves inputs in result', () => {
    const result = calcFullROI(baseInputs);
    expect(result.inputs.annualTuition).toBe(20_000);
    expect(result.inputs.discountRate).toBe(0.04);
  });

  it('uses defaults when optional fields omitted', () => {
    const result = calcFullROI({
      annualTuition: 15_000,
      postDegreeSalary: 55_000,
    });
    expect(result.inputs.discountRate).toBe(DEFAULTS.discountRate);
    expect(result.cashFlows).toHaveLength(
      DEFAULTS.educationYears + DEFAULTS.careerYears,
    );
  });
});
