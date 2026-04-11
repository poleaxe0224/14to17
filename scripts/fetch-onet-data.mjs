/**
 * Fetch O*NET skills, knowledge, and education data for all 50 mapped careers.
 * Run from project root: node scripts/fetch-onet-data.mjs
 *
 * Output: src/data/onet-data.json
 *
 * Data source: O*NET Database 30.2 — public tab-delimited text files.
 * No API key required.
 *
 * O*NET® is a trademark of the U.S. Department of Labor/Employment and
 * Training Administration (USDOL/ETA). This product uses O*NET® data
 * licensed under the CC BY 4.0 license:
 * https://creativecommons.org/licenses/by/4.0/
 * https://www.onetcenter.org/database.html#individual-files
 */

import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'onet-data.json');
const FALLBACK_FILE = join(__dirname, 'fallback', 'onet-data.json');

/** Bump this when a new O*NET Database release is available. */
const ONET_DB_VERSION = '30_2';

const BASE_URL = `https://www.onetcenter.org/dl_files/database/db_${ONET_DB_VERSION}_text`;

const FILES = {
  skills:    `${BASE_URL}/Skills.txt`,
  knowledge: `${BASE_URL}/Knowledge.txt`,
  education: `${BASE_URL}/Education%2C%20Training%2C%20and%20Experience.txt`,
};

const SOC_CODES = [
  '15-1252', '15-1211', '15-1212', '15-2051', '15-1242', // Computer & IT
  '29-1141', '29-1071', '29-1021', '29-1051',  // Healthcare (original)
  '29-1123', '29-1131', '29-1292', '29-1228',  // Healthcare (expanded)
  '29-1122', '29-2052', '11-9111', '39-9031',  // Healthcare (OT, PharmTech, MedMgr, Fitness)
  '13-2011', '13-2051', '11-2021', '11-3031', '11-3121', // Business & Finance
  '17-2051', '17-2071', '17-2141', '17-1011', '17-2031', // Engineering & Architecture
  '25-2021', '25-2031',                          // Education
  '49-9021', '47-2111', '29-2061', '15-1231',  // Trades (original)
  '47-2152', '47-2031', '35-1011',              // Trades (expanded)
  '23-1011', '23-2011',                          // Legal
  '27-1024', '27-3023', '27-1014', '27-3031',  // Creative & Media
  '21-1021', '21-1018',                          // Community & Social Service
  '19-3031', '19-2041', '19-4092',              // Science
  '33-3051', '33-2011',                          // Protective Service
  '53-2011',                                      // Transportation
];
const SOC_SET = new Set(SOC_CODES);

/** Category labels for Education, Training, and Experience file */
const EDUCATION_LABELS = {
  1: 'Less than a High School Diploma',
  2: 'High School Diploma (or GED)',
  3: 'Post-Secondary Certificate',
  4: 'Some College Courses',
  5: "Associate's Degree",
  6: "Bachelor's Degree",
  7: 'Post-Baccalaureate Certificate',
  8: "Master's Degree",
  9: "Post-Master's Certificate",
  10: 'First Professional Degree',
  11: 'Doctoral Degree',
  12: 'Post-Doctoral Training',
};

const EXPERIENCE_LABELS = {
  1: 'None',
  2: 'Up to and including 1 month',
  3: 'Over 1 month, up to 3 months',
  4: 'Over 3 months, up to 6 months',
  5: 'Over 6 months, up to 1 year',
  6: 'Over 1 year, up to 2 years',
  7: 'Over 2 years, up to 4 years',
  8: 'Over 4 years, up to 6 years',
  9: 'Over 6 years, up to 8 years',
  10: 'Over 8 years, up to 10 years',
  11: 'Over 10 years',
};

const TRAINING_LABELS = {
  1: 'None or short demonstration',
  2: 'Up to 1 month',
  3: 'Over 1 month, up to 3 months',
  4: 'Over 3 months, up to 6 months',
  5: 'Over 6 months, up to 1 year',
  6: 'Over 1 year, up to 2 years',
  7: 'Over 2 years, up to 4 years',
  8: 'Over 4 years, up to 10 years',
  9: 'Over 10 years',
};

/**
 * Fetch and parse a tab-delimited O*NET text file.
 * @returns {Array<object>} — array of row objects keyed by header names
 */
async function fetchTsv(url) {
  console.log(`  Fetching ${url.split('/').pop()}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  const lines = text.split('\n').filter((l) => l.trim());
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const cols = line.split('\t');
    const row = {};
    headers.forEach((h, i) => { row[h] = cols[i]; });
    return row;
  });
}

/**
 * Extract the 6-char SOC prefix from an O*NET-SOC code (e.g. "15-1252.00" → "15-1252").
 */
function socPrefix(onetSoc) {
  return onetSoc?.slice(0, 7) ?? '';
}

/**
 * Process Skills or Knowledge rows.
 * Filter: Scale ID = "LV" (Level, 0–7 scale), matching SOC prefix, not suppressed.
 * Group by SOC, pick the .00 (broad) occupation, sort by score descending.
 */
function processScored(rows) {
  const bySoc = {};

  for (const row of rows) {
    const prefix = socPrefix(row['O*NET-SOC Code']);
    if (!SOC_SET.has(prefix)) continue;
    if (row['Scale ID'] !== 'LV') continue;
    if (row['Recommend Suppress'] === 'Y') continue;

    // Prefer .00 (broad occupation); skip detailed sub-codes if .00 exists
    const isDetailed = !row['O*NET-SOC Code'].endsWith('.00');
    if (!bySoc[prefix]) bySoc[prefix] = { hasBroad: false, items: [] };
    if (!isDetailed) bySoc[prefix].hasBroad = true;

    bySoc[prefix].items.push({
      onetSoc: row['O*NET-SOC Code'],
      name: row['Element Name'],
      id: row['Element ID'],
      score: parseFloat(row['Data Value']),
      isDetailed,
    });
  }

  // For each SOC: use .00 rows if available, otherwise all rows
  const result = {};
  for (const [soc, { hasBroad, items }] of Object.entries(bySoc)) {
    const filtered = hasBroad ? items.filter((i) => !i.isDetailed) : items;

    // Deduplicate by Element ID (take highest score if multiple sub-codes)
    const byElement = new Map();
    for (const item of filtered) {
      const existing = byElement.get(item.id);
      if (!existing || item.score > existing.score) {
        byElement.set(item.id, item);
      }
    }

    result[soc] = [...byElement.values()]
      .map(({ name, id, score }) => ({ name, id, score }))
      .sort((a, b) => b.score - a.score);
  }

  return result;
}

/**
 * Process Education, Training, and Experience rows.
 * Element IDs: 2.D.1 = education, 2.D.2 = experience, 2.D.3 = on-site training, 2.D.4 = OJT
 * Data Value = percentage of workers at each category level.
 */
function processEducation(rows) {
  // Two-pass: collect .00 (broad) and detailed codes separately, prefer .00
  const broadBySoc = {};
  const detailedBySoc = {};

  for (const row of rows) {
    const prefix = socPrefix(row['O*NET-SOC Code']);
    if (!SOC_SET.has(prefix)) continue;
    if (row['Recommend Suppress'] === 'Y') continue;

    const isBroad = row['O*NET-SOC Code'].endsWith('.00');
    const target = isBroad ? broadBySoc : detailedBySoc;
    if (!target[prefix]) target[prefix] = { education: [], training: [], experience: [] };

    const cat = parseInt(row['Category'], 10);
    const pct = parseFloat(row['Data Value']);
    if (Number.isNaN(cat) || Number.isNaN(pct)) continue;

    const elementId = row['Element ID'];

    if (elementId === '2.D.1') {
      target[prefix].education.push({
        name: EDUCATION_LABELS[cat] || `Level ${cat}`,
        percentage: Math.round(pct * 100) / 100,
      });
    } else if (elementId === '2.D.2') {
      target[prefix].experience.push({
        name: EXPERIENCE_LABELS[cat] || `Level ${cat}`,
        percentage: Math.round(pct * 100) / 100,
      });
    } else if (elementId === '2.D.4') {
      target[prefix].training.push({
        name: TRAINING_LABELS[cat] || `Level ${cat}`,
        percentage: Math.round(pct * 100) / 100,
      });
    }
  }

  // Merge: prefer .00 broad, fall back to first detailed sub-code
  const result = {};
  for (const soc of SOC_CODES) {
    result[soc] = broadBySoc[soc] ?? detailedBySoc[soc] ?? { education: [], training: [], experience: [] };
  }
  return result;
}

async function main() {
  console.log(`Fetching O*NET Database ${ONET_DB_VERSION.replace('_', '.')} text files...\n`);

  // Fetch all three files in parallel
  const [skillsRows, knowledgeRows, educationRows] = await Promise.all([
    fetchTsv(FILES.skills),
    fetchTsv(FILES.knowledge),
    fetchTsv(FILES.education),
  ]);

  console.log(`\n  Skills rows: ${skillsRows.length}`);
  console.log(`  Knowledge rows: ${knowledgeRows.length}`);
  console.log(`  Education rows: ${educationRows.length}\n`);

  // Process
  const skillsBySoc = processScored(skillsRows);
  const knowledgeBySoc = processScored(knowledgeRows);
  const educationBySoc = processEducation(educationRows);

  // Assemble output
  const data = {};
  for (const soc of SOC_CODES) {
    data[soc] = {
      skills: skillsBySoc[soc] ?? [],
      knowledge: knowledgeBySoc[soc] ?? [],
      education: educationBySoc[soc] ?? { education: [], training: [], experience: [] },
    };
  }

  // Summary
  const count = Object.keys(data).length;
  const withSkills = Object.values(data).filter((d) => d.skills.length > 0).length;
  const withKnowledge = Object.values(data).filter((d) => d.knowledge.length > 0).length;
  const withEdu = Object.values(data).filter((d) => d.education.education.length > 0).length;
  console.log(`Result: ${count} careers, ${withSkills} with skills, ${withKnowledge} with knowledge, ${withEdu} with education`);

  // Write output
  mkdirSync(OUT_DIR, { recursive: true });
  const output = {
    _meta: {
      fetchedAt: new Date().toISOString(),
      source: `O*NET Database ${ONET_DB_VERSION.replace('_', '.')} (CC BY 4.0)`,
      attribution: 'O*NET® is a trademark of USDOL/ETA. https://www.onetcenter.org/database.html',
      sections: ['skills', 'knowledge', 'education'],
      scale: 'Skills and Knowledge use Level (LV) scale 0-7',
    },
    careers: data,
  };
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Written to: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(`O*NET fetch failed: ${err.message}`);
  if (existsSync(FALLBACK_FILE)) {
    console.warn('Using static fallback: scripts/fallback/onet-data.json');
    mkdirSync(OUT_DIR, { recursive: true });
    copyFileSync(FALLBACK_FILE, OUT_FILE);
    console.log(`Fallback copied to: ${OUT_FILE}`);
  } else {
    console.error('No fallback available. Aborting.');
    process.exit(1);
  }
});
