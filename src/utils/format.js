/**
 * Formatting utilities for currency, percentages, and numbers.
 * Uses en-US locale since all data is USD / US federal.
 */

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat('en-US');

export function formatCurrency(n) {
  if (n == null || Number.isNaN(n)) return 'N/A';
  return currencyFmt.format(n);
}

export function formatPercent(n, decimals = 1) {
  if (n == null) return 'N/A';
  return `${(n * 100).toFixed(decimals)}%`;
}

export function formatNumber(n) {
  return numberFmt.format(n);
}
