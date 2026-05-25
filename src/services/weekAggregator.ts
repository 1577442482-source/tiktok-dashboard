import type { DailyRow, MetricRow, DataPeriod } from '../types';
import { EMPTY_METRIC_ROW, METRIC_KEYS } from '../types';

export interface WeekBucket {
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  days: number;
  overview: MetricRow;
}

function sumMetricRows(rows: MetricRow[]): MetricRow {
  const result = { ...EMPTY_METRIC_ROW };
  for (const row of rows) {
    for (const key of METRIC_KEYS) {
      if (key === 'aov') continue;
      if (typeof row[key] === 'number') {
        (result[key] as number) += (row[key] as number);
      }
    }
  }
  // Recalculate AOV
  if (result.orders > 0) {
    result.aov = result.gmv / result.orders;
  }
  return result;
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function getWeekStartEnd(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (dt: Date) => dt.toISOString().substring(0, 10);
  return { start: fmt(monday), end: fmt(sunday) };
}

export function aggregateDailyToWeeks(dailyData: DailyRow[]): WeekBucket[] {
  if (!dailyData || dailyData.length === 0) return [];

  const weekMap = new Map<string, DailyRow[]>();

  for (const day of dailyData) {
    if (!day.date) continue;
    const date = new Date(day.date);
    const weekNum = getISOWeekNumber(date);
    const year = date.getFullYear();
    const key = `${year}-W${String(weekNum).padStart(2, '0')}`;

    if (!weekMap.has(key)) {
      weekMap.set(key, []);
    }
    weekMap.get(key)!.push(day);
  }

  const buckets: WeekBucket[] = [];

  for (const [weekKey, days] of weekMap) {
    const weekStr = weekKey.split('-W')[1];
    const firstDate = new Date(days[0].date);
    const we = getWeekStartEnd(firstDate);

    buckets.push({
      weekLabel: `第${parseInt(weekStr)}周`,
      weekStart: we.start,
      weekEnd: we.end,
      days: days.length,
      overview: sumMetricRows(days),
    });
  }

  buckets.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  return buckets;
}

export function aggregateDailyRange(dailyData: DailyRow[], start: string, end: string): MetricRow | null {
  const filtered = dailyData.filter((d) => d.date >= start && d.date <= end);
  if (filtered.length === 0) return null;
  return sumMetricRows(filtered);
}

export function getAllDailyData(periods: DataPeriod[]): DailyRow[] {
  return periods.flatMap((p) => p.dailyData).sort((a, b) => a.date.localeCompare(b.date));
}

export function computeChangeRow(current: MetricRow, previous: MetricRow): MetricRow {
  const result = { ...EMPTY_METRIC_ROW };
  for (const key of METRIC_KEYS) {
    const c = current[key] as number;
    const p = previous[key] as number;
    if (p !== 0) {
      (result[key] as number) = ((c - p) / p) * 100;
    } else {
      (result[key] as number) = c > 0 ? 100 : 0;
    }
  }
  return result;
}
