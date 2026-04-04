/**
 * Shared career economics fetcher — DRY extraction from detail.js + compare.js.
 *
 * Fetches wages, tuition, and IPEDS data in parallel for a SOC code,
 * then computes three-layer ROI. Used by profile (Level 3), detail, and compare views.
 */

import { getBaselineSalary, getEducationDuration } from '../engine/mappings.js';
import { calcThreeLayerROI } from '../engine/roi.js';
import * as bls from './bls.js';
import * as scorecard from './scorecard.js';
import * as ipeds from './ipeds.js';

/**
 * Fetch all economic data for a career and compute ROI.
 * @param {{ soc: string, cip: string, typicalDegree: string }} career — from CAREER_MAPPINGS
 * @returns {Promise<{
 *   wageData: object|null,
 *   tuitionData: object|null,
 *   ipedsData: object|null,
 *   medianSalary: number,
 *   avgTuition: number,
 *   totalEmployment: number|null,
 *   graduationRate: number|null,
 *   completionsTotal: number|null,
 *   duration: number,
 *   baseline: number,
 *   salaryFallback: boolean,
 *   roi: object,
 * }>}
 */
export async function fetchCareerEconomics(career) {
  const duration = getEducationDuration(career.typicalDegree);
  const baseline = getBaselineSalary(career.typicalDegree);

  const [wageResult, tuitionResult, ipedsResult] = await Promise.allSettled([
    bls.getWageData(career.soc),
    scorecard.getAverageTuition(career.cip),
    ipeds.getIpedsData(career.cip),
  ]);

  const wageData = wageResult.status === 'fulfilled' ? wageResult.value : null;
  const tuitionData = tuitionResult.status === 'fulfilled' ? tuitionResult.value : null;
  const ipedsData = ipedsResult.status === 'fulfilled' ? ipedsResult.value : null;

  const medianSalary = wageData?.annualMedian || baseline * 1.5;
  const avgTuition = tuitionData?.netPrice || tuitionData?.inState || 20_000;
  const salaryFallback = !wageData?.annualMedian;
  const totalEmployment = wageData?.employment ?? wageData?.tot_emp ?? null;
  const graduationRate = ipedsData?.graduationRate ?? null;
  const completionsTotal = ipedsData?.completionsTotal ?? null;

  const roi = calcThreeLayerROI({
    annualTuition: avgTuition,
    educationYears: duration,
    postDegreeSalary: medianSalary,
    baselineSalary: baseline,
    graduationRate,
    completionsTotal,
    totalEmployment,
  });

  return {
    wageData,
    tuitionData,
    ipedsData,
    medianSalary,
    avgTuition,
    totalEmployment,
    graduationRate,
    completionsTotal,
    duration,
    baseline,
    salaryFallback,
    roi,
  };
}
