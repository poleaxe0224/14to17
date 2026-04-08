/**
 * Shared career economics fetcher — DRY extraction from detail.js + compare.js.
 *
 * Fetches wages, tuition, and IPEDS data in parallel for a SOC code,
 * then computes three-layer ROI. Used by profile (Level 3), detail, and compare views.
 */

import {
  getBaselineSalary,
  getEducationDuration,
  getGradPhaseDuration,
  isGraduateDegree,
} from '../engine/mappings.js';
import { calcThreeLayerROI } from '../engine/roi.js';
import * as bls from './bls.js';
import * as scorecard from './scorecard.js';
import * as ipeds from './ipeds.js';

/**
 * Fetch all economic data for a career and compute ROI.
 *
 * For graduate degrees (masters, doctoral, firstProfessional), the ROI
 * calculation includes 4 years of undergraduate study + N years of
 * graduate study, with split tuition rates. Baseline salary is always
 * high school level (teen perspective).
 *
 * @param {{ soc: string, cip: string, typicalDegree: string }} career — from CAREER_MAPPINGS
 * @param {object} [options]
 * @param {import('../engine/mappings.js').BaselineMode} [options.baselineMode='teen']
 * @param {string|null} [options.undergradCip=null] — CIP code for undergrad major (grad degrees only)
 * @returns {Promise<object>}
 */
export async function fetchCareerEconomics(career, options = {}) {
  const { baselineMode = 'teen', undergradCip = null } = typeof options === 'string'
    ? { baselineMode: options }  // backward compat: old callers pass baselineMode as string
    : options;

  const degree = career.typicalDegree;
  const duration = getEducationDuration(degree);
  const baseline = getBaselineSalary(degree, baselineMode);
  const isGrad = isGraduateDegree(degree);

  // Parallel fetches: wages + grad tuition + IPEDS + optional undergrad tuition
  const fetches = [
    bls.getWageData(career.soc),
    scorecard.getAverageTuition(career.cip),
    ipeds.getIpedsData(career.cip),
  ];
  if (isGrad && undergradCip) {
    fetches.push(scorecard.getAverageTuition(undergradCip));
  }

  const results = await Promise.allSettled(fetches);

  const wageData = results[0].status === 'fulfilled' ? results[0].value : null;
  const tuitionData = results[1].status === 'fulfilled' ? results[1].value : null;
  const ipedsData = results[2].status === 'fulfilled' ? results[2].value : null;
  const undergradTuitionData = results[3]?.status === 'fulfilled' ? results[3].value : null;

  const medianSalary = wageData?.annualMedian || baseline * 1.5;
  const salaryFallback = !wageData?.annualMedian;
  const totalEmployment = wageData?.employment ?? wageData?.tot_emp ?? null;
  const graduationRate = ipedsData?.graduationRate ?? null;
  const completionsTotal = ipedsData?.completionsTotal ?? null;

  // Tuition: graduate degrees use split undergrad + grad rates
  let gradTuition = tuitionData?.netPrice || tuitionData?.inState || 20_000;
  let roiInputs;

  if (isGrad) {
    const undergradYears = 4;
    const gradPhaseYears = getGradPhaseDuration(degree);
    // Undergrad tuition: CIP-specific if user selected a major, else national average fallback
    const undergradTuition = undergradTuitionData?.netPrice
      || scorecard.getTuitionFallback('bachelors').netPrice;

    // Sanity check: grad tuition should not be lower than undergrad (data quality issue
    // when a broad CIP mixes cheap certificate programs with expensive graduate programs)
    if (gradTuition < undergradTuition) {
      gradTuition = scorecard.getTuitionFallback(degree).netPrice;
    }

    roiInputs = {
      undergradTuition,
      gradTuition,
      undergradYears,
      educationYears: duration,
      postDegreeSalary: medianSalary,
      baselineSalary: baseline,
      graduationRate,
      completionsTotal,
      totalEmployment,
    };
  } else {
    roiInputs = {
      annualTuition: gradTuition,
      educationYears: duration,
      postDegreeSalary: medianSalary,
      baselineSalary: baseline,
      graduationRate,
      completionsTotal,
      totalEmployment,
    };
  }

  const roi = calcThreeLayerROI(roiInputs);

  return {
    wageData,
    tuitionData,
    ipedsData,
    medianSalary,
    avgTuition: gradTuition,
    undergradTuition: isGrad ? roiInputs.undergradTuition : null,
    gradTuition: isGrad ? gradTuition : null,
    totalEmployment,
    graduationRate,
    completionsTotal,
    duration,
    undergradYears: isGrad ? 4 : null,
    gradPhaseYears: isGrad ? getGradPhaseDuration(degree) : null,
    isGraduateDegree: isGrad,
    baseline,
    salaryFallback,
    roi,
  };
}
