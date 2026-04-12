/**
 * SOC ↔ CIP code mappings and baseline salary constants.
 *
 * SOC = Standard Occupational Classification (BLS wages)
 * CIP = Classification of Instructional Programs (Scorecard education)
 *
 * This is a curated subset of popular career paths relevant to teens
 * exploring education ROI. Full crosswalk: https://nces.ed.gov/ipeds/cipcode/
 */

import cpsData from '../data/cps_earnings.json';

// CPS dynamic values (primary source for HS and some-college baselines)
const _cpsHighSchool = cpsData?.hsGraduatesNoCollege?.annualEstimate;
const _cpsSomeCollege = cpsData?.someCollegeNoDegree?.annualEstimate;

/**
 * Baseline salaries by education level.
 * Primary: BLS CPS (Current Population Survey) for HS and some-college.
 * Fallback: BLS 2024 "Education Pays" (25+ full-time, median weekly × 52).
 * Used as the "what if I don't get this degree" counterfactual.
 */
export const BASELINE_SALARIES = Object.freeze({
  noHighSchool:    38_376,                    // $738/wk × 52
  highSchool:      _cpsHighSchool || 48_360,  // CPS primary, $930/wk fallback
  someCollege:     _cpsSomeCollege || 53_040, // CPS primary, $1,020/wk fallback
  associates:      55_640,                    // $1,070/wk × 52
  bachelors:       80_236,                    // $1,543/wk × 52
  masters:         95_680,                    // $1,840/wk × 52
  doctoral:        118_456,                   // $2,278/wk × 52
  professional:    122_876,                   // $2,363/wk × 52
});

/**
 * Federal Direct Unsubsidized loan rates (2024-25 academic year).
 */
export const LOAN_RATES = Object.freeze({
  undergraduate: 0.065,   // 6.50% Direct Unsubsidized (undergrad)
  graduate:      0.0808,  // 8.08% Direct Unsubsidized (grad/professional)
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
  { soc: '27-1014', cip: '5010', career: 'Multimedia Artist / Animator', careerZh: '多媒體動畫師', typicalDegree: 'bachelors', category: 'creative', interests: ['create'], icon: '\u{1F3AC}' },
  { soc: '27-3031', cip: '0902', career: 'Public Relations Specialist', careerZh: '公關專員', typicalDegree: 'bachelors', category: 'creative', interests: ['create'], icon: '\u{1F4E2}' },

  // Architecture & Biomedical Engineering
  { soc: '17-1011', cip: '0402', career: 'Architect', careerZh: '建築師', typicalDegree: 'bachelors', category: 'engineering', interests: ['build', 'create'], icon: '\u{1F3DB}\uFE0F' },
  { soc: '17-2031', cip: '1405', career: 'Biomedical Engineer', careerZh: '生醫工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ['build', 'analyze'], icon: '\u{1F9EC}' },

  // Community & Social Service
  { soc: '21-1021', cip: '4407', career: 'Social Worker', careerZh: '社工師', typicalDegree: 'bachelors', category: 'community', interests: ['help'], icon: '\u{1F91D}' },
  { soc: '21-1018', cip: '5115', career: 'Mental Health Counselor', careerZh: '心理諮商師', typicalDegree: 'masters', category: 'community', interests: ['help'], icon: '\u{1F9E0}', defaultUndergradCip: '4201' },

  // Healthcare (expanded)
  { soc: '29-1123', cip: '5123', career: 'Physical Therapist', careerZh: '物理治療師', typicalDegree: 'doctoral', category: 'healthcare', interests: ['help'], icon: '\u{1F3C3}', defaultUndergradCip: '2601' },
  { soc: '29-1131', cip: '5118', career: 'Veterinarian', careerZh: '獸醫', typicalDegree: 'firstProfessional', category: 'healthcare', interests: ['help'], icon: '\u{1F43E}', defaultUndergradCip: '2601' },
  { soc: '29-1292', cip: '5106', career: 'Dental Hygienist', careerZh: '牙科衛生師', typicalDegree: 'associates', category: 'healthcare', interests: ['help'], icon: '\u2728' },
  { soc: '29-1228', cip: '5117', career: 'Physician / Surgeon', careerZh: '醫師', typicalDegree: 'firstProfessional', category: 'healthcare', interests: ['help', 'analyze'], icon: '\u2695\uFE0F', defaultUndergradCip: '2601' },
  { soc: '29-1122', cip: '5123', career: 'Occupational Therapist', careerZh: '職能治療師', typicalDegree: 'masters', category: 'healthcare', interests: ['help'], icon: '\u{1F9E9}', defaultUndergradCip: '2601' },
  { soc: '29-2052', cip: '5120', career: 'Pharmacy Technician', careerZh: '藥劑技術員', typicalDegree: 'certificate', category: 'healthcare', interests: ['help'], icon: '\u{1F9EA}' },
  { soc: '11-9111', cip: '5107', career: 'Medical / Health Services Manager', careerZh: '醫療管理師', typicalDegree: 'bachelors', category: 'healthcare', interests: ['help', 'analyze'], icon: '\u{1F3E5}' },
  { soc: '39-9031', cip: '3105', career: 'Fitness Trainer', careerZh: '健身教練', typicalDegree: 'certificate', category: 'healthcare', interests: ['help'], icon: '\u{1F4AA}' },

  // Science
  { soc: '19-3031', cip: '4201', career: 'Psychologist', careerZh: '心理學家', typicalDegree: 'doctoral', category: 'science', interests: ['help', 'analyze'], icon: '\u{1F52C}', defaultUndergradCip: '4201' },
  { soc: '19-2041', cip: '0301', career: 'Environmental Scientist', careerZh: '環境科學家', typicalDegree: 'bachelors', category: 'science', interests: ['analyze'], icon: '\u{1F33F}' },
  { soc: '19-4092', cip: '4301', career: 'Forensic Science Technician', careerZh: '鑑識科學技術員', typicalDegree: 'bachelors', category: 'science', interests: ['analyze'], icon: '\u{1F50D}' },

  // Business (expanded)
  { soc: '11-3121', cip: '5202', career: 'Human Resources Manager', careerZh: '人力資源經理', typicalDegree: 'bachelors', category: 'business', interests: ['help'], icon: '\u{1F465}' },

  // Trades (expanded)
  { soc: '47-2152', cip: '4605', career: 'Plumber', careerZh: '水電工', typicalDegree: 'certificate', category: 'trades', interests: ['build'], icon: '\u{1F527}' },
  { soc: '47-2031', cip: '4602', career: 'Carpenter', careerZh: '木工', typicalDegree: 'certificate', category: 'trades', interests: ['build', 'create'], icon: '\u{1F528}' },
  { soc: '35-1011', cip: '1205', career: 'Chef / Head Cook', careerZh: '主廚', typicalDegree: 'certificate', category: 'trades', interests: ['create'], icon: '\u{1F373}' },

  // Protective Service
  { soc: '33-3051', cip: '4301', career: 'Police Officer', careerZh: '警察', typicalDegree: 'certificate', category: 'protective', interests: ['help', 'analyze'], icon: '\u{1F6A8}' },
  { soc: '33-2011', cip: '4302', career: 'Firefighter', careerZh: '消防員', typicalDegree: 'certificate', category: 'protective', interests: ['help', 'build'], icon: '\u{1F692}' },

  // Transportation
  { soc: '53-2011', cip: '4902', career: 'Airline Pilot', careerZh: '民航機師', typicalDegree: 'bachelors', category: 'transportation', interests: ['build'], icon: '\u2708\uFE0F' },

  // Computer & IT (expanded)
  { soc: '15-1242', cip: '1103', career: 'Database Administrator', careerZh: '資料庫管理師', typicalDegree: 'bachelors', category: 'tech', interests: ['build', 'analyze'], icon: '\u{1F5C4}\uFE0F' },
  // === BLS OOH Expansion (280 occupations) ===
  { soc: '11-3012', cip: '5202', career: 'Administrative services managers', careerZh: '行政服務經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-9041', cip: '1401', career: 'Architectural and engineering managers', careerZh: '建築與工程經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '🏛️' },
  { soc: '11-3111', cip: '5202', career: 'Compensation and benefits managers', careerZh: '薪酬福利經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-3021', cip: '1101', career: 'Computer and information systems managers', careerZh: '資訊系統經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-9021', cip: '5220', career: 'Construction managers', careerZh: '營建經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-9032', cip: '1305', career: 'Education administrators, kindergarten through secondary', careerZh: '中小學校長', typicalDegree: 'masters', category: 'management', interests: ["analyze"], icon: '💼', defaultUndergradCip: '2601' },
  { soc: '11-9161', cip: '1103', career: 'Emergency management directors', careerZh: '自然科學經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-9072', cip: '5202', career: 'Entertainment and recreation managers, except gambling', careerZh: '娛樂與休閒事業經理（不含博弈業）', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '🎾' },
  { soc: '11-9013', cip: '0104', career: 'Farmers, ranchers, and other agricultural managers', careerZh: '農場主與牧場主', typicalDegree: 'certificate', category: 'management', interests: ["analyze"], icon: '🌾' },
  { soc: '11-9051', cip: '3105', career: 'Food service managers', careerZh: '餐飲服務經理', typicalDegree: 'certificate', category: 'management', interests: ["analyze"], icon: '🍽️' },
  { soc: '11-3051', cip: '1519', career: 'Industrial production managers', careerZh: '工業生產經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-9081', cip: '5202', career: 'Lodging managers', careerZh: '旅館經理', typicalDegree: 'certificate', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-9121', cip: '5202', career: 'Natural sciences managers', careerZh: '自然科學部門經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-9033', cip: '1304', career: 'Education administrators, postsecondary', careerZh: '高等教育行政人員', typicalDegree: 'masters', category: 'management', interests: ["analyze"], icon: '💼', defaultUndergradCip: '2601' },
  { soc: '11-9031', cip: '1901', career: 'Education and childcare administrators, preschool and daycare', careerZh: '幼教中心主管', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '👶' },
  { soc: '11-9141', cip: '5210', career: 'Property, real estate, and community association managers', careerZh: '物業管理經理', typicalDegree: 'certificate', category: 'management', interests: ["analyze"], icon: '🏠' },
  { soc: '11-2032', cip: '5214', career: 'Public relations managers', careerZh: '公關經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-2022', cip: '5218', career: 'Sales managers', careerZh: '銷售經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💵' },
  { soc: '11-9151', cip: '2109', career: 'Social and community service managers', careerZh: '社會與社區服務經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-1011', cip: '5202', career: 'Chief executives', careerZh: '最高主管', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-3131', cip: '5216', career: 'Training and development managers', careerZh: '培訓發展經理', typicalDegree: 'bachelors', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '11-3071', cip: '5209', career: 'Transportation, storage, and distribution managers', careerZh: '運輸倉儲經理', typicalDegree: 'certificate', category: 'management', interests: ["analyze"], icon: '💼' },
  { soc: '13-2020', cip: '5210', career: 'Property appraisers and assessors', careerZh: '不動產估價師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-2031', cip: '5202', career: 'Budget analysts', careerZh: '預算分析師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1031', cip: '5202', career: 'Claims adjusters, examiners, and investigators', careerZh: '理賠分析師', typicalDegree: 'certificate', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1141', cip: '5202', career: 'Compensation, benefits, and job analysis specialists', careerZh: '薪酬福利分析師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1041', cip: '5208', career: 'Compliance officers', careerZh: '法遵人員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1051', cip: '5202', career: 'Cost estimators', careerZh: '成本估算師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-2071', cip: '5202', career: 'Credit counselors', careerZh: '信用諮詢師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '🤝' },
  { soc: '13-2061', cip: '5202', career: 'Financial examiners', careerZh: '金融檢查員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1131', cip: '5209', career: 'Fundraisers', careerZh: '募款專員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1071', cip: '5202', career: 'Human resources specialists', careerZh: '人力資源專員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-2053', cip: '5202', career: 'Insurance underwriters', careerZh: '保險核保員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '✍️' },
  { soc: '13-1075', cip: '5202', career: 'Labor relations specialists', careerZh: '勞資關係專員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-2072', cip: '5202', career: 'Loan officers', careerZh: '貸款專員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1081', cip: '5201', career: 'Logisticians', careerZh: '物流師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1111', cip: '5210', career: 'Management analysts', careerZh: '管理分析師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1161', cip: '5208', career: 'Market research analysts and marketing specialists', careerZh: '市場研究分析師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1121', cip: '5210', career: 'Meeting, convention, and event planners', careerZh: '會議活動策劃師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-2052', cip: '5202', career: 'Personal financial advisors', careerZh: '個人理財顧問', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1082', cip: '5210', career: 'Project management specialists', careerZh: '專案管理師', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-1020', cip: '5202', career: 'Buyers and purchasing agents', careerZh: '採購專員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '13-2081', cip: '5203', career: 'Tax examiners and collectors, and revenue agents', careerZh: '稅務審查員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💳' },
  { soc: '13-1151', cip: '5216', career: 'Training and development specialists', careerZh: '培訓發展專員', typicalDegree: 'bachelors', category: 'business', interests: ["analyze"], icon: '💼' },
  { soc: '15-1221', cip: '1101', career: 'Computer and information research scientists', careerZh: '電腦科學研究員', typicalDegree: 'masters', category: 'tech', interests: ["build", "analyze"], icon: '💻', defaultUndergradCip: '2601' },
  { soc: '15-1241', cip: '1103', career: 'Computer network architects', careerZh: '電腦網路架構師', typicalDegree: 'bachelors', category: 'tech', interests: ["build", "analyze"], icon: '🏛️' },
  { soc: '15-1251', cip: '5202', career: 'Computer programmers', careerZh: '電腦程式設計師', typicalDegree: 'bachelors', category: 'tech', interests: ["build", "analyze"], icon: '💻' },
  { soc: '15-1232', cip: '1101', career: 'Computer user support specialists', careerZh: '電腦支援專員', typicalDegree: 'certificate', category: 'tech', interests: ["build", "analyze"], icon: '💻' },
  { soc: '15-1244', cip: '1103', career: 'Network and computer systems administrators', careerZh: '網路系統管理員', typicalDegree: 'bachelors', category: 'tech', interests: ["build", "analyze"], icon: '💻' },
  { soc: '15-1254', cip: '1103', career: 'Web developers', careerZh: '網頁開發人員', typicalDegree: 'bachelors', category: 'tech', interests: ["build", "analyze"], icon: '💻' },
  { soc: '17-3021', cip: '1402', career: 'Aerospace engineering and operations technologists and technicians', careerZh: '航太工程技術員', typicalDegree: 'associates', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-2011', cip: '1402', career: 'Aerospace engineers', careerZh: '航太工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-2021', cip: '1407', career: 'Agricultural engineers', careerZh: '農業工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-1021', cip: '5202', career: 'Cartographers and photogrammetrists', careerZh: '製圖與測繪工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '🗺️' },
  { soc: '17-2041', cip: '1411', career: 'Chemical engineers', careerZh: '化學工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-3022', cip: '1409', career: 'Civil engineering technologists and technicians', careerZh: '土木工程技術員', typicalDegree: 'associates', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-2061', cip: '1403', career: 'Computer hardware engineers', careerZh: '電腦硬體工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-3011', cip: '1519', career: 'Architectural and civil drafters', careerZh: '製圖員', typicalDegree: 'associates', category: 'engineering', interests: ["build"], icon: '🏛️' },
  { soc: '17-3023', cip: '1410', career: 'Electrical and electronic engineering technologists and technicians', careerZh: '電子工程技術員', typicalDegree: 'associates', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-3024', cip: '1410', career: 'Electro-mechanical and mechatronics technologists and technicians', careerZh: '機電技術員', typicalDegree: 'associates', category: 'engineering', interests: ["build"], icon: '🔧' },
  { soc: '17-3025', cip: '1403', career: 'Environmental engineering technologists and technicians', careerZh: '環境工程技術員', typicalDegree: 'associates', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-2081', cip: '1418', career: 'Environmental engineers', careerZh: '環境工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-2111', cip: '1435', career: 'Health and safety engineers, except mining safety engineers and inspectors', careerZh: '工業安全工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-3026', cip: '1435', career: 'Industrial engineering technologists and technicians', careerZh: '工業工程技術員', typicalDegree: 'associates', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-2112', cip: '1419', career: 'Industrial engineers', careerZh: '工業工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-1012', cip: '0401', career: 'Landscape architects', careerZh: '景觀建築師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '🏛️' },
  { soc: '17-2121', cip: '1420', career: 'Marine engineers and naval architects', careerZh: '船舶工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '🏛️' },
  { soc: '17-2131', cip: '1421', career: 'Materials engineers', careerZh: '材料工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-3027', cip: '1419', career: 'Mechanical engineering technologists and technicians', careerZh: '機械工程技術員', typicalDegree: 'associates', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-2151', cip: '1422', career: 'Mining and geological engineers, including mining safety engineers', careerZh: '採礦工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '🌋' },
  { soc: '17-2161', cip: '1423', career: 'Nuclear engineers', careerZh: '核能工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '☢️' },
  { soc: '17-2171', cip: '1424', career: 'Petroleum engineers', careerZh: '石油工程師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '⚙️' },
  { soc: '17-3031', cip: '1502', career: 'Surveying and mapping technicians', careerZh: '測量測繪技術員', typicalDegree: 'certificate', category: 'engineering', interests: ["build"], icon: '📏' },
  { soc: '17-1022', cip: '5202', career: 'Surveyors', careerZh: '測量師', typicalDegree: 'bachelors', category: 'engineering', interests: ["build"], icon: '📏' },
  { soc: '19-4013', cip: '4301', career: 'Food science technicians', careerZh: '食品科學技術員', typicalDegree: 'associates', category: 'science', interests: ["analyze"], icon: '🍽️' },
  { soc: '19-1011', cip: '0106', career: 'Animal scientists', careerZh: '農業與食品科學家', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '🐶' },
  { soc: '19-3091', cip: '4201', career: 'Anthropologists and archeologists', careerZh: '人類學家與考古學家', typicalDegree: 'masters', category: 'science', interests: ["analyze"], icon: '🔬', defaultUndergradCip: '2601' },
  { soc: '19-2021', cip: '4004', career: 'Atmospheric and space scientists', careerZh: '氣象學家', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '🌦' },
  { soc: '19-1021', cip: '2607', career: 'Biochemists and biophysicists', careerZh: '生物化學家', typicalDegree: 'firstProfessional', category: 'science', interests: ["analyze"], icon: '🧪', defaultUndergradCip: '2601' },
  { soc: '19-4021', cip: '2601', career: 'Biological technicians', careerZh: '生物技術員', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '🧬' },
  { soc: '19-4031', cip: '4002', career: 'Chemical technicians', careerZh: '化學技術員', typicalDegree: 'associates', category: 'science', interests: ["analyze"], icon: '🔬' },
  { soc: '19-2031', cip: '4003', career: 'Chemists', careerZh: '化學家與材料科學家', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '⚗️' },
  { soc: '19-1031', cip: '0301', career: 'Conservation scientists', careerZh: '保育科學家', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '🔬' },
  { soc: '19-3011', cip: '4202', career: 'Economists', careerZh: '經濟學家', typicalDegree: 'masters', category: 'science', interests: ["analyze"], icon: '📈', defaultUndergradCip: '2601' },
  { soc: '19-4042', cip: '5202', career: 'Environmental science and protection technicians, including health', careerZh: '環保技術員', typicalDegree: 'associates', category: 'science', interests: ["analyze"], icon: '🔬' },
  { soc: '19-1041', cip: '2605', career: 'Epidemiologists', careerZh: '流行病學家', typicalDegree: 'masters', category: 'science', interests: ["analyze"], icon: '🔬', defaultUndergradCip: '2601' },
  { soc: '19-3092', cip: '5202', career: 'Geographers', careerZh: '地理學家', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '🔬' },
  { soc: '19-4043', cip: '4006', career: 'Geological technicians, except hydrologic technicians', careerZh: '地質與石油技術員', typicalDegree: 'associates', category: 'science', interests: ["analyze"], icon: '🌋' },
  { soc: '19-2042', cip: '4006', career: 'Geoscientists, except hydrologists and geographers', careerZh: '地球科學家', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '🌍' },
  { soc: '19-3093', cip: '5202', career: 'Historians', careerZh: '歷史學家', typicalDegree: 'masters', category: 'science', interests: ["analyze"], icon: '🔬', defaultUndergradCip: '2601' },
  { soc: '19-1042', cip: '1903', career: 'Medical scientists, except epidemiologists', careerZh: '醫學科學家', typicalDegree: 'firstProfessional', category: 'science', interests: ["analyze"], icon: '🔬', defaultUndergradCip: '2601' },
  { soc: '19-1022', cip: '2606', career: 'Microbiologists', careerZh: '微生物學家', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '🧬' },
  { soc: '19-4051', cip: '5202', career: 'Nuclear technicians', careerZh: '核能技術員', typicalDegree: 'associates', category: 'science', interests: ["analyze"], icon: '☢️' },
  { soc: '19-2011', cip: '2701', career: 'Astronomers', careerZh: '天文學家', typicalDegree: 'firstProfessional', category: 'science', interests: ["analyze"], icon: '🔭', defaultUndergradCip: '2601' },
  { soc: '19-3094', cip: '4501', career: 'Political scientists', careerZh: '政治學家', typicalDegree: 'masters', category: 'science', interests: ["analyze"], icon: '🔬', defaultUndergradCip: '2601' },
  { soc: '19-3041', cip: '4504', career: 'Sociologists', careerZh: '社會學家', typicalDegree: 'masters', category: 'science', interests: ["analyze"], icon: '🔬', defaultUndergradCip: '2601' },
  { soc: '19-3022', cip: '4501', career: 'Survey researchers', careerZh: '調查研究員', typicalDegree: 'masters', category: 'science', interests: ["analyze"], icon: '📏', defaultUndergradCip: '2601' },
  { soc: '19-3051', cip: '1903', career: 'Urban and regional planners', careerZh: '都市規劃師', typicalDegree: 'masters', category: 'science', interests: ["analyze"], icon: '🔬', defaultUndergradCip: '2601' },
  { soc: '19-1023', cip: '5202', career: 'Zoologists and wildlife biologists', careerZh: '動物學家與野生生物學家', typicalDegree: 'bachelors', category: 'science', interests: ["analyze"], icon: '🧬' },
  { soc: '21-1094', cip: '5107', career: 'Community health workers', careerZh: '社區衛生工作者', typicalDegree: 'certificate', category: 'community', interests: ["help"], icon: '🤝' },
  { soc: '21-1091', cip: '5107', career: 'Health education specialists', careerZh: '衛生教育師', typicalDegree: 'bachelors', category: 'community', interests: ["help"], icon: '🤝' },
  { soc: '21-1013', cip: '5115', career: 'Marriage and family therapists', careerZh: '婚姻家庭治療師', typicalDegree: 'masters', category: 'community', interests: ["help"], icon: '🧠', defaultUndergradCip: '2601' },
  { soc: '21-1092', cip: '5115', career: 'Probation officers and correctional treatment specialists', careerZh: '觀護人與矯正治療師', typicalDegree: 'bachelors', category: 'community', interests: ["help"], icon: '🔐' },
  { soc: '21-1015', cip: '5115', career: 'Rehabilitation counselors', careerZh: '復健諮商師', typicalDegree: 'masters', category: 'community', interests: ["help"], icon: '🤝', defaultUndergradCip: '2601' },
  { soc: '21-1012', cip: '1310', career: 'Educational, guidance, and career counselors and advisors', careerZh: '學校與職涯諮商師', typicalDegree: 'masters', category: 'community', interests: ["help"], icon: '🤝', defaultUndergradCip: '2601' },
  { soc: '21-1093', cip: '5107', career: 'Social and human service assistants', careerZh: '社會服務助理', typicalDegree: 'certificate', category: 'community', interests: ["help"], icon: '🤝' },
  { soc: '23-1022', cip: '2201', career: 'Arbitrators, mediators, and conciliators', careerZh: '仲裁調解員', typicalDegree: 'bachelors', category: 'legal', interests: ["analyze"], icon: '⚖️' },
  { soc: '27-3092', cip: '5202', career: 'Court reporters and simultaneous captioners', careerZh: '法庭速記員與即時字幕員', typicalDegree: 'certificate', category: 'legal', interests: ["analyze"], icon: '⚖️' },
  { soc: '23-1021', cip: '2201', career: 'Administrative law judges, adjudicators, and hearing officers', careerZh: '法官', typicalDegree: 'firstProfessional', category: 'legal', interests: ["analyze"], icon: '⚖️', defaultUndergradCip: '2601' },
  { soc: '25-3011', cip: '1310', career: 'Adult basic education, adult secondary education, and english as a second language instructors', careerZh: '成人教育教師', typicalDegree: 'bachelors', category: 'education', interests: ["help"], icon: '📚' },
  { soc: '25-1194', cip: '1315', career: 'Career/technical education teachers, postsecondary', careerZh: '職業技術教師', typicalDegree: 'bachelors', category: 'education', interests: ["help"], icon: '📚' },
  { soc: '25-4012', cip: '5202', career: 'Curators', careerZh: '博物館策展人', typicalDegree: 'masters', category: 'education', interests: ["help"], icon: '📚', defaultUndergradCip: '2601' },
  { soc: '25-9031', cip: '5202', career: 'Instructional coordinators', careerZh: '教學課程協調員', typicalDegree: 'masters', category: 'education', interests: ["help"], icon: '📚', defaultUndergradCip: '2601' },
  { soc: '25-4022', cip: '2501', career: 'Librarians and media collections specialists', careerZh: '博物館策展人', typicalDegree: 'masters', category: 'education', interests: ["help"], icon: '📚', defaultUndergradCip: '2601' },
  { soc: '25-4031', cip: '2501', career: 'Library technicians', careerZh: '圖書館員', typicalDegree: 'certificate', category: 'education', interests: ["help"], icon: '📚' },
  { soc: '25-2022', cip: '1313', career: 'Middle school teachers, except special and career/technical education', careerZh: '國中教師', typicalDegree: 'bachelors', category: 'education', interests: ["help"], icon: '📚' },
  { soc: '25-1199', cip: '5202', career: 'Postsecondary teachers, all other', careerZh: '大專院校教師（其他類）', typicalDegree: 'firstProfessional', category: 'education', interests: ["help"], icon: '📚', defaultUndergradCip: '2601' },
  { soc: '25-2011', cip: '1312', career: 'Preschool teachers, except special education', careerZh: '幼教教師', typicalDegree: 'associates', category: 'education', interests: ["help"], icon: '📚' },
  { soc: '25-2059', cip: '1310', career: 'Special education teachers, all other', careerZh: '教學協調員', typicalDegree: 'bachelors', category: 'education', interests: ["help"], icon: '📚' },
  { soc: '25-9045', cip: '1310', career: 'Teaching assistants, except postsecondary', careerZh: '教師助理', typicalDegree: 'certificate', category: 'education', interests: ["help"], icon: '📚' },
  { soc: '25-3041', cip: '5202', career: 'Tutors', careerZh: '家教', typicalDegree: 'certificate', category: 'education', interests: ["help"], icon: '📝' },
  { soc: '27-1011', cip: '5010', career: 'Art directors', careerZh: '藝術總監', typicalDegree: 'bachelors', category: 'creative', interests: ["create"], icon: '🎨' },
  { soc: '27-1012', cip: '5003', career: 'Craft artists', careerZh: '工藝與美術家', typicalDegree: 'certificate', category: 'creative', interests: ["create"], icon: '🎨' },
  { soc: '27-1022', cip: '5010', career: 'Fashion designers', careerZh: '時裝設計師', typicalDegree: 'bachelors', category: 'creative', interests: ["create"], icon: '👗' },
  { soc: '27-1023', cip: '5202', career: 'Floral designers', careerZh: '花藝設計師', typicalDegree: 'certificate', category: 'creative', interests: ["create"], icon: '🎨' },
  { soc: '27-1021', cip: '1930', career: 'Commercial and industrial designers', careerZh: '工業設計師', typicalDegree: 'bachelors', category: 'creative', interests: ["create"], icon: '📐' },
  { soc: '27-1025', cip: '5010', career: 'Interior designers', careerZh: '室內設計師', typicalDegree: 'bachelors', category: 'creative', interests: ["create"], icon: '🛋️' },
  { soc: '27-1027', cip: '5010', career: 'Set and exhibit designers', careerZh: '佈景與展覽設計師', typicalDegree: 'bachelors', category: 'creative', interests: ["create"], icon: '🎨' },
  { soc: '27-3011', cip: '0907', career: 'Broadcast announcers and radio disc jockeys', careerZh: '播報員', typicalDegree: 'bachelors', category: 'media', interests: ["create"], icon: '🎙️' },
  { soc: '27-4014', cip: '5010', career: 'Sound engineering technicians', careerZh: '音響工程技術員', typicalDegree: 'certificate', category: 'media', interests: ["create"], icon: '⚙️' },
  { soc: '27-3041', cip: '2301', career: 'Editors', careerZh: '編輯', typicalDegree: 'bachelors', category: 'media', interests: ["create"], icon: '✍️' },
  { soc: '27-3091', cip: '1613', career: 'Interpreters and translators', careerZh: '口譯與筆譯人員', typicalDegree: 'bachelors', category: 'media', interests: ["create"], icon: '🌐' },
  { soc: '27-4021', cip: '5010', career: 'Photographers', careerZh: '攝影師', typicalDegree: 'certificate', category: 'media', interests: ["create"], icon: '📷' },
  { soc: '27-3042', cip: '0910', career: 'Technical writers', careerZh: '技術文件撰寫師', typicalDegree: 'bachelors', category: 'media', interests: ["create"], icon: '✍️' },
  { soc: '27-3043', cip: '0910', career: 'Writers and authors', careerZh: '作家', typicalDegree: 'bachelors', category: 'media', interests: ["create"], icon: '✍️' },
  { soc: '29-9091', cip: '5107', career: 'Athletic trainers', careerZh: '運動防護員', typicalDegree: 'masters', category: 'healthcare', interests: ["help"], icon: '🩺', defaultUndergradCip: '2601' },
  { soc: '29-1181', cip: '5106', career: 'Audiologists', careerZh: '聽力師', typicalDegree: 'firstProfessional', category: 'healthcare', interests: ["help"], icon: '👂', defaultUndergradCip: '2601' },
  { soc: '29-2031', cip: '5120', career: 'Cardiovascular technologists and technicians', careerZh: '心血管技術員', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '27-2011', cip: '5005', career: 'Actors', careerZh: '演員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '29-2010', cip: '5202', career: 'Clinical laboratory technologists and technicians', careerZh: '臨床檢驗醫事人員', typicalDegree: 'bachelors', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '31-9091', cip: '5106', career: 'Dental assistants', careerZh: '牙科助理', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🦷' },
  { soc: '29-2032', cip: '5120', career: 'Diagnostic medical sonographers', careerZh: '超音波技術員', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '29-1031', cip: '5106', career: 'Dietitians and nutritionists', careerZh: '營養師', typicalDegree: 'bachelors', category: 'healthcare', interests: ["help"], icon: '🥗' },
  { soc: '29-2043', cip: '5117', career: 'Paramedics', careerZh: '緊急救護技術員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🚑' },
  { soc: '29-1128', cip: '5117', career: 'Exercise physiologists', careerZh: '運動生理學家', typicalDegree: 'bachelors', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '29-9092', cip: '5107', career: 'Genetic counselors', careerZh: '遺傳諮詢師', typicalDegree: 'masters', category: 'healthcare', interests: ["help"], icon: '🧬', defaultUndergradCip: '2601' },
  { soc: '29-9021', cip: '5202', career: 'Health information technologists and medical registrars', careerZh: '健康資訊技術員與病歷登錄員', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '31-1120', cip: '5113', career: 'Home health and personal care aides', careerZh: '居家照護員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '31-9011', cip: '5202', career: 'Massage therapists', careerZh: '按摩治療師', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🧠' },
  { soc: '31-9092', cip: '5106', career: 'Medical assistants', careerZh: '醫務助理', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '29-2036', cip: '5120', career: 'Medical dosimetrists', careerZh: '醫學劑量師', typicalDegree: 'bachelors', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '29-2072', cip: '5108', career: 'Medical records specialists', careerZh: '病歷技術員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '31-9094', cip: '5106', career: 'Medical transcriptionists', careerZh: '醫療文書謄寫員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '29-2033', cip: '5120', career: 'Nuclear medicine technologists', careerZh: '核子醫學技術師', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '☢️' },
  { soc: '29-1151', cip: '5106', career: 'Nurse anesthetists', careerZh: '麻醉護理師', typicalDegree: 'masters', category: 'healthcare', interests: ["help"], icon: '🩺', defaultUndergradCip: '2601' },
  { soc: '31-1131', cip: '5131', career: 'Nursing assistants', careerZh: '按摩治療師', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '19-5011', cip: '5202', career: 'Occupational health and safety specialists', careerZh: '職業安全衛生專員', typicalDegree: 'bachelors', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '31-2011', cip: '5126', career: 'Occupational therapy assistants', careerZh: '職能治療助理', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '🧠' },
  { soc: '29-2081', cip: '5109', career: 'Opticians, dispensing', careerZh: '配鏡師', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '29-1041', cip: '5111', career: 'Optometrists', careerZh: '驗光師', typicalDegree: 'firstProfessional', category: 'healthcare', interests: ["help"], icon: '👁️', defaultUndergradCip: '2601' },
  { soc: '29-2091', cip: '5120', career: 'Orthotists and prosthetists', careerZh: '義肢矯具師', typicalDegree: 'masters', category: 'healthcare', interests: ["help"], icon: '🩺', defaultUndergradCip: '2601' },
  { soc: '31-9097', cip: '5106', career: 'Phlebotomists', careerZh: '抽血技術員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '31-2021', cip: '5123', career: 'Physical therapist assistants', careerZh: '物理治療助理', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '🧠' },
  { soc: '29-1081', cip: '5111', career: 'Podiatrists', careerZh: '足科醫師', typicalDegree: 'firstProfessional', category: 'healthcare', interests: ["help"], icon: '🩺', defaultUndergradCip: '2601' },
  { soc: '29-2053', cip: '5106', career: 'Psychiatric technicians', careerZh: '精神科技術員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '29-1124', cip: '5106', career: 'Radiation therapists', careerZh: '放射治療師', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '🧠' },
  { soc: '29-2034', cip: '5120', career: 'Radiologic technologists and technicians', careerZh: '放射技術師', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '☢️' },
  { soc: '29-1125', cip: '5104', career: 'Recreational therapists', careerZh: '休閒治療師', typicalDegree: 'bachelors', category: 'healthcare', interests: ["help"], icon: '🧠' },
  { soc: '29-1126', cip: '5117', career: 'Respiratory therapists', careerZh: '呼吸治療師', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '🧠' },
  { soc: '29-1127', cip: '5120', career: 'Speech-language pathologists', careerZh: '語言病理學家', typicalDegree: 'masters', category: 'healthcare', interests: ["help"], icon: '🩺', defaultUndergradCip: '2601' },
  { soc: '29-2055', cip: '5120', career: 'Surgical technologists', careerZh: '手術技術員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🩺' },
  { soc: '39-2021', cip: '0107', career: 'Animal caretakers', careerZh: '動物照護員', typicalDegree: 'certificate', category: 'healthcare', interests: ["help"], icon: '🐶' },
  { soc: '29-2056', cip: '5120', career: 'Veterinary technologists and technicians', careerZh: '獸醫技術員', typicalDegree: 'associates', category: 'healthcare', interests: ["help"], icon: '🐾' },
  { soc: '33-3012', cip: '4301', career: 'Correctional officers and jailers', careerZh: '矯正官', typicalDegree: 'certificate', category: 'protective', interests: ["help"], icon: '🔐' },
  { soc: '33-2021', cip: '4302', career: 'Fire inspectors and investigators', careerZh: '消防調查員', typicalDegree: 'certificate', category: 'protective', interests: ["help"], icon: '🔍' },
  { soc: '33-9021', cip: '4301', career: 'Private detectives and investigators', careerZh: '私家偵探', typicalDegree: 'certificate', category: 'protective', interests: ["help"], icon: '🕵️' },
  { soc: '33-9032', cip: '4301', career: 'Security guards', careerZh: '保全人員', typicalDegree: 'certificate', category: 'protective', interests: ["help"], icon: '🛡️' },
  { soc: '35-3011', cip: '1205', career: 'Bartenders', careerZh: '調酒師', typicalDegree: 'certificate', category: 'food_service', interests: ["create"], icon: '🍸' },
  { soc: '35-3023', cip: '1205', career: 'Fast food and counter workers', careerZh: '餐飲服務人員', typicalDegree: 'certificate', category: 'food_service', interests: ["create"], icon: '🍽️' },
  { soc: '35-2021', cip: '1203', career: 'Food preparation workers', careerZh: '食品加工人員', typicalDegree: 'certificate', category: 'food_service', interests: ["create"], icon: '🍽️' },
  { soc: '35-3031', cip: '5202', career: 'Waiters and waitresses', careerZh: '餐廳服務生', typicalDegree: 'certificate', category: 'food_service', interests: ["create"], icon: '🍽️' },
  { soc: '37-3019', cip: '5202', career: 'Grounds maintenance workers, all other', careerZh: '園藝維護工（其他類）', typicalDegree: 'certificate', category: 'maintenance', interests: ["build"], icon: '🌿' },
  { soc: '37-2011', cip: '4606', career: 'Janitors and cleaners, except maids and housekeeping cleaners', careerZh: '清潔工', typicalDegree: 'certificate', category: 'maintenance', interests: ["build"], icon: '🧹' },
  { soc: '37-2021', cip: '0106', career: 'Pest control workers', careerZh: '除蟲人員', typicalDegree: 'certificate', category: 'maintenance', interests: ["build"], icon: '🐜' },
  { soc: '39-2011', cip: '0107', career: 'Animal trainers', careerZh: '動物照護員', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '🐶' },
  { soc: '39-5011', cip: '1204', career: 'Barbers', careerZh: '理髮師', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '✂️' },
  { soc: '39-9011', cip: '3905', career: 'Childcare workers', careerZh: '托育人員', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '👶' },
  { soc: '39-6012', cip: '5210', career: 'Concierges', careerZh: '禮賓員', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '🏨' },
  { soc: '11-9171', cip: '1203', career: 'Funeral home managers', careerZh: '殯葬業經理', typicalDegree: 'associates', category: 'personal_service', interests: ["help"], icon: '⚔️' },
  { soc: '11-9071', cip: '5210', career: 'Gambling managers', careerZh: '博弈業經理', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '💅' },
  { soc: '39-5092', cip: '5108', career: 'Manicurists and pedicurists', careerZh: '美甲師', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '💅' },
  { soc: '39-1014', cip: '5202', career: 'First-line supervisors of entertainment and recreation workers, except gambling services', careerZh: '娛樂休閒業基層主管（不含博弈業）', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '🎾' },
  { soc: '39-5094', cip: '5108', career: 'Skincare specialists', careerZh: '美容師', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '🧴' },
  { soc: '39-7010', cip: '5202', career: 'Tour and travel guides', careerZh: '導遊與領隊', typicalDegree: 'certificate', category: 'personal_service', interests: ["help"], icon: '🌍' },
  { soc: '41-3011', cip: '5210', career: 'Advertising sales agents', careerZh: '廣告業務員', typicalDegree: 'certificate', category: 'sales', interests: ["create"], icon: '💵' },
  { soc: '41-2011', cip: '5218', career: 'Cashiers', careerZh: '收銀員', typicalDegree: 'certificate', category: 'sales', interests: ["create"], icon: '💵' },
  { soc: '41-3021', cip: '5210', career: 'Insurance sales agents', careerZh: '保險業務員', typicalDegree: 'certificate', category: 'sales', interests: ["create"], icon: '📃' },
  { soc: '41-9012', cip: '5210', career: 'Models', careerZh: '模特兒', typicalDegree: 'certificate', category: 'sales', interests: ["create"], icon: '📸' },
  { soc: '41-9021', cip: '5218', career: 'Real estate brokers', careerZh: '不動產經紀人', typicalDegree: 'certificate', category: 'sales', interests: ["create"], icon: '🏠' },
  { soc: '41-1012', cip: '5218', career: 'First-line supervisors of non-retail sales workers', careerZh: '非零售業銷售人員基層主管', typicalDegree: 'certificate', category: 'sales', interests: ["create"], icon: '🛒' },
  { soc: '41-9031', cip: '1401', career: 'Sales engineers', careerZh: '銷售工程師', typicalDegree: 'bachelors', category: 'sales', interests: ["create"], icon: '⚙️' },
  { soc: '41-3031', cip: '5208', career: 'Securities, commodities, and financial services sales agents', careerZh: '旅行社業務員', typicalDegree: 'bachelors', category: 'sales', interests: ["create"], icon: '💵' },
  { soc: '41-3041', cip: '5202', career: 'Travel agents', careerZh: '旅行社業務員', typicalDegree: 'certificate', category: 'sales', interests: ["create"], icon: '🌍' },
  { soc: '41-4011', cip: '5218', career: 'Sales representatives, wholesale and manufacturing, technical and scientific products', careerZh: '不動產經紀人', typicalDegree: 'bachelors', category: 'sales', interests: ["create"], icon: '💵' },
  { soc: '43-3011', cip: '5203', career: 'Bill and account collectors', careerZh: '帳務催收員', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '💳' },
  { soc: '43-3031', cip: '5203', career: 'Bookkeeping, accounting, and auditing clerks', careerZh: '簿記人員', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📖' },
  { soc: '43-4051', cip: '5218', career: 'Customer service representatives', careerZh: '客服代表', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📞' },
  { soc: '43-9031', cip: '5202', career: 'Desktop publishers', careerZh: '桌面排版員', typicalDegree: 'associates', category: 'office', interests: ["analyze"], icon: '📝' },
  { soc: '43-3099', cip: '5202', career: 'Financial clerks, all other', careerZh: '金融文書人員（其他類）', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📝' },
  { soc: '43-9061', cip: '5202', career: 'Office clerks, general', careerZh: '辦公室事務員', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📝' },
  { soc: '43-4171', cip: '5218', career: 'Receptionists and information clerks', careerZh: '接待員', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📞' },
  { soc: '43-5061', cip: '5202', career: 'Production, planning, and expediting clerks', careerZh: '生產排程與物料控管員', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📝' },
  { soc: '43-5031', cip: '4301', career: 'Public safety telecommunicators', careerZh: '勤務中心調度員', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📝' },
  { soc: '43-5051', cip: '5202', career: 'Postal service clerks', careerZh: '郵務人員', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📮' },
  { soc: '43-6012', cip: '5204', career: 'Legal secretaries and administrative assistants', careerZh: '法律秘書與行政助理', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '📝' },
  { soc: '43-3071', cip: '5202', career: 'Tellers', careerZh: '銀行櫃員', typicalDegree: 'certificate', category: 'office', interests: ["analyze"], icon: '🏦' },
  { soc: '45-2099', cip: '5202', career: 'Agricultural workers, all other', careerZh: '農業工人（其他類）', typicalDegree: 'certificate', category: 'agriculture', interests: ["build"], icon: '🌾' },
  { soc: '45-3031', cip: '0309', career: 'Fishing and hunting workers', careerZh: '漁民', typicalDegree: 'certificate', category: 'agriculture', interests: ["build"], icon: '🌾' },
  { soc: '45-4011', cip: '0305', career: 'Forest and conservation workers', careerZh: '林業工人', typicalDegree: 'certificate', category: 'agriculture', interests: ["build"], icon: '🌲' },
  { soc: '45-4029', cip: '5202', career: 'Logging workers, all other', careerZh: '伐木工人（其他類）', typicalDegree: 'certificate', category: 'agriculture', interests: ["build"], icon: '🪵' },
  { soc: '47-2011', cip: '4601', career: 'Boilermakers', careerZh: '鍋爐工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔥' },
  { soc: '47-2022', cip: '5202', career: 'Stonemasons', careerZh: '石匠', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🧱' },
  { soc: '47-4011', cip: '1502', career: 'Construction and building inspectors', careerZh: '建築檢查員', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔍' },
  { soc: '47-2073', cip: '4602', career: 'Operating engineers and other construction equipment operators', careerZh: '工程機械操作員', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '⚙️' },
  { soc: '47-2061', cip: '4602', career: 'Construction laborers', careerZh: '建築工人', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '47-2081', cip: '4602', career: 'Drywall and ceiling tile installers', careerZh: '乾牆安裝工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '47-4021', cip: '4602', career: 'Elevator and escalator installers and repairers', careerZh: '電梯安裝修理工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🏢' },
  { soc: '47-2121', cip: '4602', career: 'Glaziers', careerZh: '玻璃工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '47-4041', cip: '4301', career: 'Hazardous materials removal workers', careerZh: '危險物質清除工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '47-2131', cip: '4602', career: 'Insulation workers, floor, ceiling, and wall', careerZh: '隔熱工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '47-5011', cip: '1505', career: 'Derrick operators, oil and gas', careerZh: '油氣井架操作員', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '47-2141', cip: '4602', career: 'Painters, construction and maintenance', careerZh: '油漆工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🎨' },
  { soc: '47-3016', cip: '4601', career: 'Helpers--roofers', careerZh: '屋頂修建助手', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🏠' },
  { soc: '47-2211', cip: '4602', career: 'Sheet metal workers', careerZh: '鈑金工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '47-2231', cip: '4602', career: 'Solar photovoltaic installers', careerZh: '太陽能安裝工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '☀️' },
  { soc: '47-2221', cip: '4602', career: 'Structural iron and steel workers', careerZh: '結構鐵工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '47-3011', cip: '4601', career: 'Helpers--brickmasons, blockmasons, stonemasons, and tile and marble setters', careerZh: '建築工人', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🧱' },
  { soc: '49-2091', cip: '4706', career: 'Avionics technicians', careerZh: '航空電子技術員', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '49-3021', cip: '4706', career: 'Automotive body and related repairers', careerZh: '汽車鈑金修理工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🚗' },
  { soc: '49-3023', cip: '4706', career: 'Automotive service technicians and mechanics', careerZh: '汽車維修技師', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '17-3028', cip: '5202', career: 'Calibration technologists and technicians', careerZh: '校正技術員', typicalDegree: 'associates', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '49-3031', cip: '4706', career: 'Bus and truck mechanics and diesel engine specialists', careerZh: '柴油機械師', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🚚' },
  { soc: '49-2093', cip: '4701', career: 'Electrical and electronics installers and repairers, transportation equipment', careerZh: '運輸設備電氣與電子安裝維修員', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '⚡' },
  { soc: '49-9071', cip: '4601', career: 'Maintenance and repair workers, general', careerZh: '一般維修工', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '49-3041', cip: '4706', career: 'Farm equipment mechanics and service technicians', careerZh: '農機具維修技師', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '49-9041', cip: '4701', career: 'Industrial machinery mechanics', careerZh: '工業機械師', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '49-9051', cip: '4701', career: 'Electrical power-line installers and repairers', careerZh: '電力線路安裝維修員', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '⚡' },
  { soc: '49-9062', cip: '4701', career: 'Medical equipment repairers', careerZh: '醫療設備維修師', typicalDegree: 'associates', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '49-3053', cip: '4706', career: 'Outdoor power equipment and other small engine mechanics', careerZh: '小型引擎技師', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '49-2021', cip: '4701', career: 'Radio, cellular, and tower equipment installers and repairers', careerZh: '電信設備安裝修理工', typicalDegree: 'associates', category: 'trades', interests: ["build"], icon: '🔧' },
  { soc: '49-9081', cip: '4606', career: 'Wind turbine service technicians', careerZh: '風力發電技師', typicalDegree: 'certificate', category: 'trades', interests: ["build"], icon: '🌬️' },
  { soc: '51-2090', cip: '5202', career: 'Miscellaneous assemblers and fabricators', careerZh: '其他組裝與製造工', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🏭' },
  { soc: '51-3011', cip: '1205', career: 'Bakers', careerZh: '烘焙師', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🍞' },
  { soc: '51-3021', cip: '1205', career: 'Butchers and meat cutters', careerZh: '肉品切割工', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🍖' },
  { soc: '51-9082', cip: '5106', career: 'Medical appliance technicians', careerZh: '醫療器材技術員', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🏭' },
  { soc: '51-3091', cip: '1205', career: 'Food and tobacco roasting, baking, and drying machine operators and tenders', careerZh: '食品與菸草烘焙乾燥機操作員', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🍽️' },
  { soc: '51-9071', cip: '5010', career: 'Jewelers and precious stone and metal workers', careerZh: '珠寶工匠', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '💎' },
  { soc: '51-4041', cip: '4805', career: 'Machinists', careerZh: '機械師', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '⚙️' },
  { soc: '51-4021', cip: '4805', career: 'Extruding and drawing machine setters, operators, and tenders, metal and plastic', careerZh: '金屬與塑膠擠出抽拉機操作員', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🏭' },
  { soc: '51-9123', cip: '4805', career: 'Painting, coating, and decorating workers', careerZh: '油漆塗裝與裝飾工', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🏭' },
  { soc: '51-8013', cip: '4702', career: 'Power plant operators', careerZh: '發電廠操作員', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '⚡' },
  { soc: '51-9061', cip: '4805', career: 'Inspectors, testers, sorters, samplers, and weighers', careerZh: '品管檢驗員', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🔍' },
  { soc: '51-9141', cip: '1509', career: 'Semiconductor processing technicians', careerZh: '半導體製程技術員', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '💻' },
  { soc: '51-8021', cip: '4702', career: 'Stationary engineers and boiler operators', careerZh: '鍋爐操作員', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '⚙️' },
  { soc: '51-8031', cip: '4702', career: 'Water and wastewater treatment plant and system operators', careerZh: '水處理廠操作員', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '💧' },
  { soc: '51-4121', cip: '4805', career: 'Welders, cutters, solderers, and brazers', careerZh: '焊接工', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🔥' },
  { soc: '51-7099', cip: '5202', career: 'Woodworkers, all other', careerZh: '木工（其他類）', typicalDegree: 'certificate', category: 'production', interests: ["build"], icon: '🪵' },
  { soc: '53-2021', cip: '4902', career: 'Air traffic controllers', careerZh: '航空管制員', typicalDegree: 'associates', category: 'transportation', interests: ["build"], icon: '📡' },
  { soc: '53-3051', cip: '4901', career: 'Bus drivers, school', careerZh: '校車司機', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '🚘' },
  { soc: '53-3031', cip: '4901', career: 'Driver/sales workers', careerZh: '司機兼業務員', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '🚘' },
  { soc: '53-2031', cip: '4902', career: 'Flight attendants', careerZh: '空服員', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '✈️' },
  { soc: '53-7061', cip: '4901', career: 'Cleaners of vehicles and equipment', careerZh: '車輛與設備清潔工', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '🧹' },
  { soc: '53-3032', cip: '4901', career: 'Heavy and tractor-trailer truck drivers', careerZh: '大型貨車司機', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '🚚' },
  { soc: '53-7011', cip: '4901', career: 'Conveyor operators and tenders', careerZh: '輸送機操作員', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '🚚' },
  { soc: '53-4011', cip: '4901', career: 'Locomotive engineers', careerZh: '鐵路工人', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '⚙️' },
  { soc: '53-3054', cip: '4901', career: 'Taxi drivers', careerZh: '計程車司機', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '🚘' },
  { soc: '53-5011', cip: '4901', career: 'Sailors and marine oilers', careerZh: '水手與輪機加油員', typicalDegree: 'certificate', category: 'transportation', interests: ["build"], icon: '🚚' },

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
