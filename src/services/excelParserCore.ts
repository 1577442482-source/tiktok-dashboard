import * as XLSX from 'xlsx';
import {
  type DataPeriod, type MetricRow, type DailyRow, type PeriodType,
  EMPTY_METRIC_ROW, METRIC_KEYS,
} from '../types';
import { parseNumberFromString, parsePercentString, parseDateFromString } from '../utils/formatters';

const READ_OPTS: XLSX.ParsingOptions = {
  type: 'array',
  cellFormula: false,
  cellStyles: false,
  cellDates: false,
  sheetStubs: false,
  bookVBA: false,
  bookSheets: false,
};

const COL_KEYS = METRIC_KEYS.length;

function parseMetricRow(row: unknown[], startCol: number): MetricRow {
  const result: MetricRow = { ...EMPTY_METRIC_ROW };
  for (let i = 0; i < COL_KEYS; i++) {
    result[METRIC_KEYS[i]] = parseNumberFromString(row[startCol + i] as string | number | null);
  }
  return result;
}

function parseMetricRowPercent(row: unknown[], startCol: number): MetricRow {
  const result: MetricRow = { ...EMPTY_METRIC_ROW };
  for (let i = 0; i < COL_KEYS; i++) {
    const raw = row[startCol + i];
    result[METRIC_KEYS[i]] = typeof raw === 'string' ? parsePercentString(raw) : 0;
  }
  return result;
}

function detectPeriodType(start: string, end: string): PeriodType {
  const s = new Date(start);
  const e = new Date(end);
  const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 10 ? 'weekly' : 'monthly';
}

export interface ParseCallbacks {
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Parse a TikTok Excel file from an ArrayBuffer.
 * Works in both browser (Web Worker) and Node.js environments.
 */
export function parseExcelBuffer(buffer: ArrayBuffer, callbacks?: ParseCallbacks): DataPeriod {
  const t0 = performance.now();

  callbacks?.onProgress?.('读取文件结构...', 5);

  const workbook = XLSX.read(buffer, READ_OPTS);

  callbacks?.onProgress?.('解析工作表...', 20);

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

  if (rows.length < 4) {
    throw new Error('文件行数不足，请确认是 TikTok 后台导出的数据文件');
  }

  callbacks?.onProgress?.('提取日期范围...', 30);

  let currentRow = 0;

  const row0 = rows[currentRow] as (string | null)[];
  const analysisDateRaw = (row0[0] || '').toString();
  const comparisonDateRaw = (row0[1] || '').toString();

  const analysisMatch = analysisDateRaw.match(/(\d{2}\/\d{2}\/\d{4})\s*[-~]\s*(\d{2}\/\d{2}\/\d{4})/);
  const comparisonMatch = comparisonDateRaw.match(/(\d{2}\/\d{2}\/\d{4})\s*[-~]\s*(\d{2}\/\d{2}\/\d{4})/);

  if (!analysisMatch) {
    throw new Error('无法解析分析周期日期');
  }

  const analysisStart = parseDateFromString(analysisMatch[1]);
  const analysisEnd = parseDateFromString(analysisMatch[2]);
  const comparisonStart = comparisonMatch ? parseDateFromString(comparisonMatch[1]) : '';
  const comparisonEnd = comparisonMatch ? parseDateFromString(comparisonMatch[2]) : '';
  const periodType = detectPeriodType(analysisStart, analysisEnd);

  currentRow = 3;

  // Row 3: Total value (overview)
  const row3 = rows[currentRow] as (string | number | null)[];
  if (!row3?.[0]?.toString().toLowerCase().includes('total')) {
    throw new Error('数据格式不符合预期：缺少 Total value 行');
  }

  callbacks?.onProgress?.('解析核心指标...', 40);

  const overview = parseMetricRow(rows[currentRow] as unknown[], 1);
  currentRow++;

  let overviewChange: MetricRow = { ...EMPTY_METRIC_ROW };
  if (currentRow < rows.length) {
    const row4 = rows[currentRow] as (string | number | null)[];
    if (row4?.[0]?.toString().toLowerCase().includes('percentage')) {
      overviewChange = parseMetricRowPercent(rows[currentRow] as unknown[], 1);
      currentRow++;
    }
  }

  // Skip empty rows until "Daily data"
  while (currentRow < rows.length) {
    const firstCell = (rows[currentRow] as (string | null)[])[0]?.toString().toLowerCase() || '';
    if (firstCell.includes('daily')) {
      currentRow += 2;
      break;
    }
    currentRow++;
  }

  callbacks?.onProgress?.('解析每日数据...', 50);

  const totalRows = rows.length;
  const dailyData: DailyRow[] = [];
  let dataIdx = 0;

  while (currentRow < totalRows) {
    const row = rows[currentRow] as (string | null)[];
    const firstCell = (row?.[0] || '').toString();

    if (!firstCell || firstCell.trim() === '') break;

    const dateParts = firstCell.split('/');
    if (dateParts.length !== 3) break;

    const date = parseDateFromString(firstCell);
    const metrics = parseMetricRow(rows[currentRow] as unknown[], 1);

    dailyData[dataIdx++] = { date, ...metrics } as DailyRow;
    currentRow++;
  }

  const elapsed = Math.round(performance.now() - t0);
  callbacks?.onProgress?.(`解析完成 (${elapsed}ms)`, 100);

  return {
    id: `${periodType}_${analysisStart}_${analysisEnd}`,
    type: periodType,
    analysisStart,
    analysisEnd,
    comparisonStart,
    comparisonEnd,
    uploadedAt: new Date().toISOString(),
    overview,
    overviewChange,
    dailyData,
  };
}
