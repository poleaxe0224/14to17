/**
 * Exploration tracker — localStorage-backed module that records
 * which careers the user has viewed, compared, and calculated ROI for.
 *
 * Events:
 *   view_profile  — opened a career profile page
 *   view_detail   — opened ROI detail deep dive
 *   calculate_roi — ran the ROI calculator
 *   compare       — ran a career comparison
 */

const STORAGE_KEY = 'futurepath-tracker';
const MAX_EVENTS = 500;

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { events: [] };
  } catch {
    return { events: [] };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable — silently degrade
  }
}

/**
 * Record an exploration event.
 * @param {'view_profile'|'view_detail'|'calculate_roi'|'compare'} type
 * @param {object} data — at minimum { soc } or { socs } for compare
 */
export function trackEvent(type, data = {}) {
  const store = readStore();
  store.events.push({
    type,
    data,
    ts: new Date().toISOString(),
  });
  // Cap stored events
  if (store.events.length > MAX_EVENTS) {
    store.events = store.events.slice(-MAX_EVENTS);
  }
  writeStore(store);
}

/** Get all recorded events (oldest first). */
export function getEvents() {
  return readStore().events;
}

/** Get unique SOC codes the user has interacted with, in first-seen order. */
export function getExploredSocs() {
  const seen = new Set();
  const ordered = [];
  for (const ev of getEvents()) {
    const socs = ev.data?.socs ?? (ev.data?.soc ? [ev.data.soc] : []);
    for (const soc of socs) {
      if (!seen.has(soc)) {
        seen.add(soc);
        ordered.push(soc);
      }
    }
  }
  return ordered;
}

/** Get event counts grouped by type. */
export function getEventCounts() {
  const counts = {};
  for (const ev of getEvents()) {
    counts[ev.type] = (counts[ev.type] || 0) + 1;
  }
  return counts;
}

/** Delete all tracked data. */
export function clearTracker() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Export tracker data as a JSON string. */
export function exportJSON() {
  return JSON.stringify(readStore(), null, 2);
}

/** Import tracker data from a JSON string (merges with existing). */
export function importJSON(jsonStr) {
  const imported = JSON.parse(jsonStr);
  if (!imported?.events || !Array.isArray(imported.events)) {
    throw new Error('Invalid tracker data');
  }
  const store = readStore();
  store.events = [...store.events, ...imported.events].slice(-MAX_EVENTS);
  writeStore(store);
}
