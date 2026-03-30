import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatNumber } from '../src/utils/format.js';

describe('formatCurrency', () => {
  it('formats positive dollar amounts', () => {
    expect(formatCurrency(50000)).toBe('$50,000');
  });

  it('formats negative dollar amounts', () => {
    expect(formatCurrency(-12345)).toBe('-$12,345');
  });

  it('rounds to whole dollars', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1_000_000)).toBe('$1,000,000');
  });
});

describe('formatPercent', () => {
  it('converts decimal to percentage', () => {
    expect(formatPercent(0.125)).toBe('12.5%');
  });

  it('returns N/A for null', () => {
    expect(formatPercent(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatPercent(undefined)).toBe('N/A');
  });

  it('respects custom decimal places', () => {
    expect(formatPercent(0.12345, 2)).toBe('12.35%');
  });

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('handles negative values', () => {
    expect(formatPercent(-0.05)).toBe('-5.0%');
  });
});

describe('formatNumber', () => {
  it('formats with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
