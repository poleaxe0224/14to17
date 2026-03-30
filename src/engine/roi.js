/**
 * ROI Calculation Engine — pure math, no DOM, no side effects.
 *
 * All functions take plain objects and return new objects (immutable).
 * Monetary values are in nominal USD unless stated otherwise.
 */

/** Default assumptions */
export const DEFAULTS = Object.freeze({
  discountRate: 0.04,        // 4% real discount rate
  salaryGrowthRate: 0.02,    // 2% annual real wage growth
  careerYears: 40,           // working years after education
  educationYears: 4,         // years of education (Bachelor's)
  highSchoolBaseline: 35_000, // BLS median for HS diploma holders
  inflationRate: 0.025,      // 2.5% (used only if converting nominal)
});

/**
 * Build year-by-year cash flow array for an education investment.
 *
 * Convention:
 *   - Year 0 = first year of education
 *   - Negative cash flows = costs (tuition + opportunity cost)
 *   - Positive cash flows = earnings premium over baseline
 *
 * @param {object} inputs
 * @param {number} inputs.annualTuition     — per-year education cost
 * @param {number} inputs.educationYears    — years of schooling
 * @param {number} inputs.postDegreeSalary  — starting salary after degree
 * @param {number} inputs.baselineSalary    — no-degree alternative salary
 * @param {number} [inputs.salaryGrowthRate]
 * @param {number} [inputs.careerYears]
 * @returns {Array<{year: number, cost: number, earning: number, net: number}>}
 */
export function buildCashFlows(inputs) {
  const {
    annualTuition,
    educationYears = DEFAULTS.educationYears,
    postDegreeSalary,
    baselineSalary = DEFAULTS.highSchoolBaseline,
    salaryGrowthRate = DEFAULTS.salaryGrowthRate,
    careerYears = DEFAULTS.careerYears,
  } = inputs;

  const flows = [];
  const totalYears = educationYears + careerYears;

  for (let y = 0; y < totalYears; y++) {
    if (y < educationYears) {
      // During education: pay tuition + forgo baseline earnings
      const baselineAtYear = baselineSalary * Math.pow(1 + salaryGrowthRate, y);
      const cost = annualTuition + baselineAtYear;
      flows.push({ year: y, cost: -cost, earning: 0, net: -cost });
    } else {
      // After education: earn degree salary, compare to baseline
      const yearsWorking = y - educationYears;
      const degreeSalary = postDegreeSalary * Math.pow(1 + salaryGrowthRate, yearsWorking);
      const baselineAtYear = baselineSalary * Math.pow(1 + salaryGrowthRate, y);
      const premium = degreeSalary - baselineAtYear;
      flows.push({ year: y, cost: 0, earning: degreeSalary, net: premium });
    }
  }

  return flows;
}

/**
 * Net Present Value — sum of discounted cash flows.
 *
 * @param {Array<{net: number}>} cashFlows
 * @param {number} [rate] — discount rate (default 4%)
 * @returns {number} NPV in today's dollars
 */
export function calcNPV(cashFlows, rate = DEFAULTS.discountRate) {
  return cashFlows.reduce(
    (sum, cf, i) => sum + cf.net / Math.pow(1 + rate, i),
    0,
  );
}

/**
 * Internal Rate of Return — the discount rate that makes NPV = 0.
 * Uses Newton-Raphson iteration.
 *
 * @param {Array<{net: number}>} cashFlows
 * @param {number} [guess=0.1] — initial guess
 * @param {number} [maxIter=100]
 * @param {number} [tolerance=1e-7]
 * @returns {number|null} IRR as decimal (e.g. 0.12 = 12%), or null if no convergence
 */
export function calcIRR(cashFlows, guess = 0.1, maxIter = 100, tolerance = 1e-7) {
  let rate = guess;

  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t].net;
      const factor = Math.pow(1 + rate, t);
      npv += cf / factor;
      if (t > 0) {
        derivative -= (t * cf) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(derivative) < 1e-12) return null; // flat — can't converge
    const newRate = rate - npv / derivative;

    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }

  return null; // did not converge
}

/**
 * Breakeven year — first year where cumulative net cash flow turns positive.
 *
 * @param {Array<{net: number}>} cashFlows
 * @param {number} [discountRate] — if provided, uses discounted cash flows
 * @returns {number|null} year index, or null if never breaks even
 */
export function calcBreakeven(cashFlows, discountRate) {
  const useDiscount = discountRate != null;
  let cumulative = 0;

  for (let i = 0; i < cashFlows.length; i++) {
    const cf = useDiscount
      ? cashFlows[i].net / Math.pow(1 + discountRate, i)
      : cashFlows[i].net;
    cumulative += cf;
    if (cumulative > 0) return i;
  }

  return null;
}

/**
 * Lifetime ROI — total return as a percentage of total cost.
 *
 * ROI = (total earnings premium - total cost) / total cost × 100
 *
 * @param {Array<{net: number}>} cashFlows
 * @returns {{roi: number, totalCost: number, totalPremium: number, netGain: number}}
 */
export function calcLifetimeROI(cashFlows) {
  let totalCost = 0;
  let totalPremium = 0;

  for (const cf of cashFlows) {
    if (cf.net < 0) totalCost += Math.abs(cf.net);
    else totalPremium += cf.net;
  }

  const netGain = totalPremium - totalCost;
  const roi = totalCost > 0 ? (netGain / totalCost) * 100 : 0;

  return { roi, totalCost, totalPremium, netGain };
}

/**
 * Monthly loan payment (standard amortization).
 *
 * @param {number} principal — loan amount
 * @param {number} annualRate — annual interest rate (e.g. 0.065 for 6.5%)
 * @param {number} years — repayment period
 * @returns {number} monthly payment
 */
export function calcMonthlyPayment(principal, annualRate, years) {
  if (principal <= 0) return 0;
  if (annualRate <= 0) return principal / (years * 12);

  const r = annualRate / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Full ROI analysis — orchestrator that runs all calculations.
 *
 * @param {object} inputs
 * @param {number} inputs.annualTuition
 * @param {number} inputs.educationYears
 * @param {number} inputs.postDegreeSalary
 * @param {number} [inputs.baselineSalary]
 * @param {number} [inputs.salaryGrowthRate]
 * @param {number} [inputs.careerYears]
 * @param {number} [inputs.discountRate]
 * @param {number} [inputs.loanRate]       — student loan interest rate
 * @param {number} [inputs.loanTermYears]  — repayment period (default 10)
 * @returns {object} complete analysis result
 */
export function calcFullROI(inputs) {
  const {
    discountRate = DEFAULTS.discountRate,
    loanRate = 0.065,
    loanTermYears = 10,
    annualTuition,
    educationYears = DEFAULTS.educationYears,
  } = inputs;

  const cashFlows = buildCashFlows(inputs);
  const npv = calcNPV(cashFlows, discountRate);
  const irr = calcIRR(cashFlows);
  const breakevenNominal = calcBreakeven(cashFlows);
  const breakevenDiscounted = calcBreakeven(cashFlows, discountRate);
  const lifetime = calcLifetimeROI(cashFlows);

  const totalTuition = annualTuition * educationYears;
  const monthlyPayment = calcMonthlyPayment(totalTuition, loanRate, loanTermYears);

  return {
    inputs: { ...inputs, discountRate, loanRate, loanTermYears },
    cashFlows,
    npv: Math.round(npv),
    irr,
    breakevenYear: breakevenNominal,
    breakevenYearDiscounted: breakevenDiscounted,
    lifetime: {
      roi: Math.round(lifetime.roi * 10) / 10,
      totalCost: Math.round(lifetime.totalCost),
      totalPremium: Math.round(lifetime.totalPremium),
      netGain: Math.round(lifetime.netGain),
    },
    loan: {
      totalBorrowed: totalTuition,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalRepaid: Math.round(monthlyPayment * loanTermYears * 12 * 100) / 100,
    },
  };
}
