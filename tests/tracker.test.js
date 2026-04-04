import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackEvent,
  getEvents,
  getExploredSocs,
  getEventCounts,
  clearTracker,
  exportJSON,
  importJSON,
} from '../src/tracker/tracker.js';

// Mock localStorage
const store = {};
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, val) => { store[key] = val; },
  removeItem: (key) => { delete store[key]; },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe('trackEvent', () => {
  it('records an event', () => {
    trackEvent('view_profile', { soc: '15-1252' });
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('view_profile');
    expect(events[0].data.soc).toBe('15-1252');
    expect(events[0].ts).toBeDefined();
  });

  it('appends multiple events', () => {
    trackEvent('view_profile', { soc: '15-1252' });
    trackEvent('view_detail', { soc: '15-1252' });
    trackEvent('compare', { socs: ['15-1252', '29-1141'] });
    expect(getEvents()).toHaveLength(3);
  });

  it('caps at MAX_EVENTS (500)', () => {
    for (let i = 0; i < 510; i++) {
      trackEvent('view_profile', { soc: `00-${i}` });
    }
    expect(getEvents()).toHaveLength(500);
  });
});

describe('getExploredSocs', () => {
  it('returns unique SOCs in first-seen order', () => {
    trackEvent('view_profile', { soc: '15-1252' });
    trackEvent('view_detail', { soc: '29-1141' });
    trackEvent('view_profile', { soc: '15-1252' }); // duplicate
    trackEvent('compare', { socs: ['29-1141', '13-2011'] });
    expect(getExploredSocs()).toEqual(['15-1252', '29-1141', '13-2011']);
  });

  it('returns empty array when no events', () => {
    expect(getExploredSocs()).toEqual([]);
  });
});

describe('getEventCounts', () => {
  it('groups counts by type', () => {
    trackEvent('view_profile', { soc: '15-1252' });
    trackEvent('view_profile', { soc: '29-1141' });
    trackEvent('compare', { socs: ['15-1252', '29-1141'] });
    const counts = getEventCounts();
    expect(counts.view_profile).toBe(2);
    expect(counts.compare).toBe(1);
  });
});

describe('clearTracker', () => {
  it('removes all data', () => {
    trackEvent('view_profile', { soc: '15-1252' });
    clearTracker();
    expect(getEvents()).toEqual([]);
  });
});

describe('exportJSON / importJSON', () => {
  it('round-trips data', () => {
    trackEvent('view_profile', { soc: '15-1252' });
    trackEvent('calculate_roi', { soc: '29-1141' });
    const json = exportJSON();
    clearTracker();
    expect(getEvents()).toEqual([]);
    importJSON(json);
    expect(getEvents()).toHaveLength(2);
    expect(getEvents()[0].data.soc).toBe('15-1252');
  });

  it('merges imported data with existing', () => {
    trackEvent('view_profile', { soc: '15-1252' });
    const json = exportJSON();
    trackEvent('compare', { socs: ['13-2011'] });
    importJSON(json);
    expect(getEvents()).toHaveLength(3);
  });

  it('rejects invalid JSON structure', () => {
    expect(() => importJSON('{"invalid": true}')).toThrow('Invalid tracker data');
  });

  it('rejects non-array events', () => {
    expect(() => importJSON('{"events": "not-array"}')).toThrow('Invalid tracker data');
  });
});
