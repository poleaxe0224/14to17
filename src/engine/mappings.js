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
 * Degree levels that require a bachelor's degree as prerequisite.
 * Used to determine total education path from high school.
 */
export const GRADUATE_DEGREES = Object.freeze(
  new Set(['masters', 'doctoral', 'firstProfessional']),
);

/**
 * Duration of the graduate/professional phase only (post-bachelor's years).
 * For non-graduate degrees this is the same as total duration.
 */
export const GRAD_PHASE_DURATION = Object.freeze({
  certificate:  1,
  associates:   2,
  bachelors:    4,
  masters:      2,
  doctoral:     5,
  firstProfessional: 3,
});

/**
 * Total duration (years) from high school to degree completion.
 * Graduate degrees include 4 years of undergraduate study.
 */
export const DEGREE_DURATION = Object.freeze({
  certificate:  1,
  associates:   2,
  bachelors:    4,
  masters:      6,  // 4 undergrad + 2 grad
  doctoral:     9,  // 4 undergrad + 5 grad
  firstProfessional: 7, // 4 undergrad + 3 professional
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
  { soc: '15-1252', cip: '1107', career: 'Software Developer', careerZh: '軟體工程師', typicalDegree: 'bachelors', category: 'tech', interests: ['build', 'create'], icon: '\u{1F4BB}' },
  { soc: '15-1211', cip: '1101', career: 'Computer Systems Analyst', careerZh: '電腦系統分析師', typicalDegree: 'bachelors', category: 'tech', interests: ['analyze'], icon: '\u{1F5A5}' },
  { soc: '15-1212', cip: '1104', career: 'Information Security Analyst', careerZh: '資安分析師', typicalDegree: 'bachelors', category: 'tech', interests: ['analyze'], icon: '\u{1F512}' },
  { soc: '15-2051', cip: '3070', career: 'Data Scientist', careerZh: '資料科學家', typicalDegree: 'masters', category: 'tech', interests: ['analyze'], icon: '\u{1F4CA}', defaultUndergradCip: '2701' },

  // Healthcare
  { soc: '29-1141', cip: '5138', career: 'Registered Nurse', careerZh: '註冊護理師', typicalDegree: 'bachelors', category: 'healthcare', interests: ['help'], icon: '\u{1FA7A}' },
  { soc: '29-1071', cip: '5109', career: 'Physician Assistant', careerZh: '醫師助理', typicalDegree: 'masters', category: 'healthcare', interests: ['help'], icon: '\u{1F9D1}\u200D\u2695\uFE0F', defaultUndergradCip: '2601' },
  { soc: '29-1021', cip: '5104', career: 'Dentist', careerZh: '牙醫', typicalDegree: 'firstProfessional', category: 'healthcare', interests: ['help', 'build'], icon: '\u{1F9B7}', defaultUndergradCip: '2601' },
  { soc: '29-1051', cip: '5120', career: 'Pharmacist', careerZh: '藥劑師', typicalDegree: 'firstProfessional', category: 'healthcare', interests: ['help'], icon: '\u{1F48A}', defaultUndergradCip: '4002' },

  // Business & Finance
  { soc: '13-2011', cip: '5203', career: 'Accountant', careerZh: '會計師', typicalDegree: 'bachelors', category: 'business', interests: ['analyze'], icon: '\u{1F4C8}' },
  { soc: '13-2051', cip: '5208', career: 'Financial Analyst', careerZh: '金融分析師', typicalDegree: 'bachelors', category: 'business', interests: ['analyze'], icon: '\u{1F4B9}' },
  { soc: '11-2021', cip: '5214', career: 'Marketing Manager', careerZh: '行銷經理', typicalDegree: 'bachelors', category: 'business', interests: ['create'], icon: '\u{1F4E3}' },
  { soc: '11-3031', cip: '5210', career: 'Financial Manager', careerZh: '財務經理', typicalDegree: 'bachelors', category: 'business', interests: ['analyze'], icon: '\u{1F4B0}' },

  // Engineering
  { soc: '17-2051', cip: '1409', career: 'Civil Engineer', careerZh: '土木工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ['build'], icon: '\u{1F3D7}' },
  { soc: '17-2071', cip: '1410', career: 'Electrical Engineer', careerZh: '電機工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ['build'], icon: '\u26A1' },
  { soc: '17-2141', cip: '1419', career: 'Mechanical Engineer', careerZh: '機械工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ['build'], icon: '\u2699' },

  // Education
  { soc: '25-2021', cip: '1312', career: 'Elementary School Teacher', careerZh: '小學教師', typicalDegree: 'bachelors', category: 'education', interests: ['help'], icon: '\u{1F34E}' },
  { soc: '25-2031', cip: '1313', career: 'High School Teacher', careerZh: '高中教師', typicalDegree: 'bachelors', category: 'education', interests: ['help'], icon: '\u{1F4DA}' },

  // Trades & Technical (associates / certificate)
  { soc: '49-9021', cip: '4702', career: 'HVAC Technician', careerZh: '暖通技師', typicalDegree: 'certificate', category: 'trades', interests: ['build'], icon: '\u2744' },
  { soc: '47-2111', cip: '4601', career: 'Electrician', careerZh: '電工', typicalDegree: 'certificate', category: 'trades', interests: ['build'], icon: '\u{1F50C}' },
  { soc: '29-2061', cip: '5109', career: 'Licensed Practical Nurse', careerZh: '執業護士', typicalDegree: 'certificate', category: 'trades', interests: ['help'], icon: '\u{1F489}' },
  { soc: '15-1231', cip: '1106', career: 'Web Developer', careerZh: '網頁開發師', typicalDegree: 'associates', category: 'trades', interests: ['build', 'create'], icon: '\u{1F310}' },

  // Legal
  { soc: '23-1011', cip: '2201', career: 'Lawyer', careerZh: '律師', typicalDegree: 'firstProfessional', category: 'legal', interests: ['analyze'], icon: '\u2696', defaultUndergradCip: '4501' },
  { soc: '23-2011', cip: '2203', career: 'Paralegal', careerZh: '法律助理', typicalDegree: 'associates', category: 'legal', interests: ['help'], icon: '\u{1F4C4}' },

  // Creative & Media
  { soc: '27-1024', cip: '5010', career: 'Graphic Designer', careerZh: '平面設計師', typicalDegree: 'bachelors', category: 'creative', interests: ['create'], icon: '\u{1F3A8}' },
  { soc: '27-3023', cip: '0904', career: 'News Analyst / Reporter', careerZh: '新聞記者', typicalDegree: 'bachelors', category: 'creative', interests: ['create'], icon: '\u{1F4F0}' },
]);

/**
 * Common undergraduate majors for the "choose your undergrad" dropdown.
 * Shown on detail pages for graduate-degree careers so users can estimate
 * their 4-year undergrad tuition instead of using the national average.
 *
 * CIP codes match College Scorecard program-level data.
 */
export const UNDERGRAD_MAJORS = Object.freeze([
  { cip: '2601', en: 'Biology', zh: '生物學' },
  { cip: '4002', en: 'Chemistry', zh: '化學' },
  { cip: '2701', en: 'Mathematics / Statistics', zh: '數學/統計' },
  { cip: '1107', en: 'Computer Science', zh: '電腦科學' },
  { cip: '4201', en: 'Psychology', zh: '心理學' },
  { cip: '4501', en: 'Political Science', zh: '政治學' },
  { cip: '2301', en: 'English', zh: '英文' },
  { cip: '5203', en: 'Accounting', zh: '會計學' },
  { cip: '5208', en: 'Finance', zh: '金融學' },
  { cip: '5138', en: 'Nursing', zh: '護理學' },
  { cip: '5101', en: 'Health Sciences', zh: '健康科學' },
  { cip: '1409', en: 'Civil Engineering', zh: '土木工程' },
  { cip: '1410', en: 'Electrical Engineering', zh: '電機工程' },
  { cip: '1419', en: 'Mechanical Engineering', zh: '機械工程' },
  { cip: '0904', en: 'Journalism', zh: '新聞學' },
  { cip: '5010', en: 'Fine Arts / Design', zh: '美術/設計' },
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
 * Baseline mode — determines the counterfactual "what if I don't pursue this degree".
 *
 *   'teen'    — user is a high school student deciding their full path (default)
 *   'postBac' — user already has a bachelor's and is evaluating grad school only
 *
 * Currently only 'teen' is exposed in UI. 'postBac' is reserved for future toggle.
 * @typedef {'teen'|'postBac'} BaselineMode
 */

/**
 * Get the appropriate baseline salary for a degree level.
 *
 * In 'teen' mode (default): baseline is always high school salary because
 * the target user (14-17) is deciding their full education path from scratch.
 *
 * In 'postBac' mode: graduate degrees use bachelor's salary as baseline,
 * since the user already holds a bachelor's degree.
 *
 * @param {string} degreeLevel — key from DEGREE_LEVELS
 * @param {BaselineMode} [mode='teen'] — baseline perspective
 * @returns {number} baseline annual salary
 */
export function getBaselineSalary(degreeLevel, mode = 'teen') {
  if (mode === 'postBac' && GRADUATE_DEGREES.has(degreeLevel)) {
    return BASELINE_SALARIES.bachelors;
  }
  // Teen mode: all paths compared against high school baseline
  return BASELINE_SALARIES.highSchool;
}

/**
 * Get total education duration from high school to degree completion.
 * Graduate degrees include 4 years of undergraduate study.
 *
 * @param {string} degreeLevel
 * @returns {number} total years
 */
export function getEducationDuration(degreeLevel) {
  return DEGREE_DURATION[degreeLevel] || 4;
}

/**
 * Get graduate-phase-only duration (post-bachelor's years).
 * For non-graduate degrees, returns the same as getEducationDuration.
 *
 * @param {string} degreeLevel
 * @returns {number} years for grad phase only
 */
export function getGradPhaseDuration(degreeLevel) {
  return GRAD_PHASE_DURATION[degreeLevel] || 4;
}

/**
 * Check if a degree level requires undergraduate prerequisite.
 * @param {string} degreeLevel
 * @returns {boolean}
 */
export function isGraduateDegree(degreeLevel) {
  return GRADUATE_DEGREES.has(degreeLevel);
}

/**
 * Get careers in the same category, excluding the given SOC code.
 * @param {string} socCode
 * @returns {object[]}
 */
export function getRelatedCareers(socCode) {
  const career = findBySoc(socCode);
  if (!career) return [];
  return CAREER_MAPPINGS.filter(
    (m) => m.category === career.category && m.soc !== socCode,
  );
}

/**
 * Find all careers by category.
 * @param {string} category
 * @returns {object[]}
 */
export function findByCategory(category) {
  return CAREER_MAPPINGS.filter((m) => m.category === category);
}

/**
 * Find all careers by interest tag.
 * @param {string} interest — 'build' | 'help' | 'analyze' | 'create'
 * @returns {object[]}
 */
export function findByInterest(interest) {
  return CAREER_MAPPINGS.filter((m) => m.interests.includes(interest));
}
