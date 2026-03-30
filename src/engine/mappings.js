/**
 * SOC ↔ CIP code mappings and baseline salary constants.
 *
 * SOC = Standard Occupational Classification (BLS wages)
 * CIP = Classification of Instructional Programs (Scorecard education)
 *
 * This is a curated subset of popular career paths relevant to teens
 * exploring education ROI. Full crosswalk: https://nces.ed.gov/ipeds/cipcode/
 */

/**
 * Baseline salaries by education level (BLS 2024 median annual).
 * Used as the "what if I don't get this degree" counterfactual.
 */
export const BASELINE_SALARIES = Object.freeze({
  noHighSchool:    31_590,
  highSchool:      35_000,
  someCollege:     38_640,
  associates:      41_870,
  bachelors:       59_600,
  masters:         69_700,
  doctoral:        82_000,
  professional:    89_960,
});

/**
 * Degree level codes used in Scorecard API.
 */
export const DEGREE_LEVELS = Object.freeze({
  certificate:  1,
  associates:   2,
  bachelors:    3,
  masters:      5,
  doctoral:     6,
  firstProfessional: 7,
});

/**
 * Typical duration (years) by degree level.
 */
export const DEGREE_DURATION = Object.freeze({
  certificate:  1,
  associates:   2,
  bachelors:    4,
  masters:      2,  // assumes post-bachelor's
  doctoral:     5,  // assumes post-bachelor's
  firstProfessional: 3,
});

/**
 * Curated SOC → CIP mappings for common career paths.
 *
 * Each entry:
 *   soc: SOC-6 code
 *   cip: CIP-4 code (for Scorecard API)
 *   career: English name
 *   careerZh: Traditional Chinese name
 *   typicalDegree: most common entry-level degree
 */
export const CAREER_MAPPINGS = Object.freeze([
  // Computer & IT
  { soc: '15-1252', cip: '1107', career: 'Software Developer', careerZh: '軟體工程師', typicalDegree: 'bachelors' },
  { soc: '15-1211', cip: '1101', career: 'Computer Systems Analyst', careerZh: '電腦系統分析師', typicalDegree: 'bachelors' },
  { soc: '15-1212', cip: '1104', career: 'Information Security Analyst', careerZh: '資安分析師', typicalDegree: 'bachelors' },
  { soc: '15-2051', cip: '2701', career: 'Data Scientist', careerZh: '資料科學家', typicalDegree: 'masters' },

  // Healthcare
  { soc: '29-1141', cip: '5138', career: 'Registered Nurse', careerZh: '註冊護理師', typicalDegree: 'bachelors' },
  { soc: '29-1071', cip: '5117', career: 'Physician Assistant', careerZh: '醫師助理', typicalDegree: 'masters' },
  { soc: '29-1021', cip: '5112', career: 'Dentist', careerZh: '牙醫', typicalDegree: 'firstProfessional' },
  { soc: '29-1051', cip: '5102', career: 'Pharmacist', careerZh: '藥劑師', typicalDegree: 'firstProfessional' },

  // Business & Finance
  { soc: '13-2011', cip: '5203', career: 'Accountant', careerZh: '會計師', typicalDegree: 'bachelors' },
  { soc: '13-2051', cip: '5208', career: 'Financial Analyst', careerZh: '金融分析師', typicalDegree: 'bachelors' },
  { soc: '11-2021', cip: '5214', career: 'Marketing Manager', careerZh: '行銷經理', typicalDegree: 'bachelors' },
  { soc: '11-3031', cip: '5210', career: 'Financial Manager', careerZh: '財務經理', typicalDegree: 'bachelors' },

  // Engineering
  { soc: '17-2051', cip: '1409', career: 'Civil Engineer', careerZh: '土木工程師', typicalDegree: 'bachelors' },
  { soc: '17-2071', cip: '1410', career: 'Electrical Engineer', careerZh: '電機工程師', typicalDegree: 'bachelors' },
  { soc: '17-2141', cip: '1419', career: 'Mechanical Engineer', careerZh: '機械工程師', typicalDegree: 'bachelors' },

  // Education
  { soc: '25-2021', cip: '1312', career: 'Elementary School Teacher', careerZh: '小學教師', typicalDegree: 'bachelors' },
  { soc: '25-2031', cip: '1313', career: 'High School Teacher', careerZh: '高中教師', typicalDegree: 'bachelors' },

  // Trades & Technical (associates / certificate)
  { soc: '49-9021', cip: '4702', career: 'HVAC Technician', careerZh: '暖通技師', typicalDegree: 'certificate' },
  { soc: '47-2111', cip: '4601', career: 'Electrician', careerZh: '電工', typicalDegree: 'certificate' },
  { soc: '29-2061', cip: '5109', career: 'Licensed Practical Nurse', careerZh: '執業護士', typicalDegree: 'certificate' },
  { soc: '15-1231', cip: '1106', career: 'Web Developer', careerZh: '網頁開發師', typicalDegree: 'associates' },

  // Legal
  { soc: '23-1011', cip: '2201', career: 'Lawyer', careerZh: '律師', typicalDegree: 'firstProfessional' },
  { soc: '23-2011', cip: '2203', career: 'Paralegal', careerZh: '法律助理', typicalDegree: 'associates' },

  // Creative & Media
  { soc: '27-1024', cip: '5010', career: 'Graphic Designer', careerZh: '平面設計師', typicalDegree: 'bachelors' },
  { soc: '27-3023', cip: '0904', career: 'News Analyst / Reporter', careerZh: '新聞記者', typicalDegree: 'bachelors' },
]);

/**
 * Look up a career mapping by SOC code.
 * @param {string} socCode
 * @returns {object|undefined}
 */
export function findBySoc(socCode) {
  return CAREER_MAPPINGS.find((m) => m.soc === socCode);
}

/**
 * Look up career mappings by CIP code (may return multiple).
 * @param {string} cipCode
 * @returns {object[]}
 */
export function findByCip(cipCode) {
  return CAREER_MAPPINGS.filter((m) => m.cip === cipCode);
}

/**
 * Search careers by keyword (English or Chinese).
 * @param {string} query
 * @returns {object[]}
 */
export function searchCareers(query) {
  const q = query.toLowerCase();
  return CAREER_MAPPINGS.filter(
    (m) => m.career.toLowerCase().includes(q) || m.careerZh.includes(query),
  );
}

/**
 * Get the appropriate baseline salary for a degree level.
 * The baseline represents what someone would earn WITHOUT this degree.
 *
 * @param {string} degreeLevel — key from DEGREE_LEVELS
 * @returns {number} baseline annual salary
 */
export function getBaselineSalary(degreeLevel) {
  switch (degreeLevel) {
    case 'certificate':
    case 'associates':
      return BASELINE_SALARIES.highSchool;
    case 'bachelors':
      return BASELINE_SALARIES.someCollege;
    case 'masters':
      return BASELINE_SALARIES.bachelors;
    case 'doctoral':
    case 'firstProfessional':
      return BASELINE_SALARIES.bachelors;
    default:
      return BASELINE_SALARIES.highSchool;
  }
}

/**
 * Get typical education duration for a degree level.
 * @param {string} degreeLevel
 * @returns {number} years
 */
export function getEducationDuration(degreeLevel) {
  return DEGREE_DURATION[degreeLevel] || 4;
}
