/**
 * Reads all data files' timestamps and generates a shields.io endpoint badge JSON.
 * Output: public/data-freshness.json
 *
 * Badge color:
 *   - brightgreen: < 14 days old
 *   - yellow:      14-30 days old
 *   - red:         > 30 days old
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const DATA_FILES = [
  { path: 'src/data/wages.json', key: '_meta.fetchedAt' },
  { path: 'src/data/tuition.json', key: '_meta.fetchedAt' },
  { path: 'src/data/cps_earnings.json', key: '_meta.fetchedAt' },
  { path: 'src/data/ipeds.json', key: 'metadata.fetched_at' },
  { path: 'src/data/onet-data.json', key: '_meta.fetchedAt' },
];

function getTimestamp(filePath, dotKey) {
  const abs = resolve(root, filePath);
  if (!existsSync(abs)) return null;
  const json = JSON.parse(readFileSync(abs, 'utf-8'));
  const keys = dotKey.split('.');
  let val = json;
  for (const k of keys) {
    val = val?.[k];
  }
  return val ? new Date(val) : null;
}

const timestamps = DATA_FILES
  .map(f => getTimestamp(f.path, f.key))
  .filter(Boolean);

if (timestamps.length === 0) {
  console.error('No data timestamps found — skipping badge generation.');
  process.exit(0);
}

// Use the oldest timestamp (= the stalest source determines freshness)
const oldest = new Date(Math.min(...timestamps));
const now = new Date();
const ageDays = Math.floor((now - oldest) / (1000 * 60 * 60 * 24));

let color;
if (ageDays < 14) color = 'brightgreen';
else if (ageDays <= 30) color = 'yellow';
else color = 'red';

const message = oldest.toISOString().slice(0, 10);

const badge = {
  schemaVersion: 1,
  label: 'data updated',
  message,
  color,
};

const outPath = resolve(root, 'public', 'data-freshness.json');
writeFileSync(outPath, JSON.stringify(badge, null, 2) + '\n', 'utf-8');
console.log(`Badge generated: ${message} (${ageDays}d ago, ${color})`);
