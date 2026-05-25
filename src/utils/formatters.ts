import { type MetricKey, METRIC_LABELS } from '../types';

export function formatNumber(value: number, decimals = 2): string {
  if (value === 0 || value === undefined || Number.isNaN(value)) return '0';
  if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(decimals) + 'M';
  if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(decimals) + 'K';
  return value.toFixed(decimals);
}

export function formatPercent(value: number): string {
  if (value === 0 || Number.isNaN(value)) return '0%';
  return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
}

export function formatCurrency(value: number, currency = '$'): string {
  return currency + formatNumber(value);
}

export function parsePercentString(str: string): number {
  const cleaned = str.replace('%', '').replace('+', '').trim();
  if (cleaned === '-') return 0;
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

export function parseNumberFromString(str: string | number | null | undefined): number {
  if (typeof str === 'number') return str;
  if (!str || str === '-') return 0;
  const cleaned = str.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

export function formatDateLabel(start: string, end: string): string {
  const s = start.replace(/\//g, '-');
  const e = end.replace(/\//g, '-');
  return `${s} ~ ${e}`;
}

export function getMetricLabel(key: string): string {
  return METRIC_LABELS[key as MetricKey] || key;
}

export function parseDateFromString(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}
