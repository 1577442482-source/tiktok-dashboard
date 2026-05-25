import * as XLSX from 'xlsx';
import {
  type DataPeriod, type MetricRow, type DailyRow, type PeriodType,
  EMPTY_METRIC_ROW, METRIC_KEYS,
} from '../types';
import { parseNumberFromString, parsePercentString, parseDateFromString } from '../utils/formatters';

interface SheetRow {
  [key: string]: string | number | null | undefined;
}

function parseMetricRow(row: SheetRow, startCol: number): MetricRow {
  const result: MetricRow = { ...EMPTY_METRIC_ROW };
  const cols = Object.keys(row);

  METRIC_KEYS.forEach((key, index) => {
    const colIdx = startCol + index;
    if (colIdx < cols.length) {
      const raw = row[cols[colIdx]];
      result[key] = parseNumberFromString(raw as string | number | null);
    }
  });

  return result;
}

function parseMetricRowPercent(row: SheetRow, startCol: number): MetricRow {
  const result: MetricRow = { ...EMPTY_METRIC_ROW };
  const cols = Object.keys(row);

  METRIC_KEYS.forEach((key, index) => {
    const colIdx = startCol + index;
    if (colIdx < cols.length) {
      const raw = row[cols[colIdx]];
      const val = typeof raw === 'string' ? parsePercentString(raw) : 0;
      result[key] = val;
    }
  });

  return result;
}

function detectPeriodType(start: string, end: string): PeriodType {
  const s = new Date(start);
  const e = new Date(end);
  const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 10 ? 'weekly' : 'monthly';
}

export function parseExcelFile(file: File): Promise<DataPeriod> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: SheetRow[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let currentRow = 0;

        // Row 0: Analysis date and comparison date
        const row0 = rows[currentRow] as unknown as (string | null)[];
        const analysisDateRaw = (row0?.[0] || '').toString();
        const comparisonDateRaw = (row0?.[1] || '').toString();

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

        currentRow = 2;

        // Row 2: column headers (skip — we know the order)
        currentRow = 3;

        // Row 3: Total value (overview)
        const row3 = rows[currentRow] as unknown as (string | number | null)[];
        if (row3?.[0]?.toString().toLowerCase().includes('total')) {
          const overview = parseMetricRow(rows[currentRow] as SheetRow, 1);
          currentRow++;

          // Row 4: Percentage change
          let overviewChange: MetricRow = { ...EMPTY_METRIC_ROW };
          if (currentRow < rows.length) {
            const row4 = rows[currentRow] as unknown as (string | number | null)[];
            if (row4?.[0]?.toString().toLowerCase().includes('percentage')) {
              overviewChange = parseMetricRowPercent(rows[currentRow] as SheetRow, 1);
              currentRow++;
            }
          }

          // Skip empty rows until "Daily data"
          while (currentRow < rows.length) {
            const row = rows[currentRow] as unknown as (string | null)[];
            const firstCell = row?.[0]?.toString().toLowerCase() || '';
            if (firstCell.includes('daily')) {
              currentRow++; // Skip the "Daily data" header
              currentRow++; // Skip the column headers row
              break;
            }
            currentRow++;
          }

          // Parse daily data rows
          const dailyData: DailyRow[] = [];
          while (currentRow < rows.length) {
            const row = rows[currentRow] as unknown as (string | null)[];
            const firstCell = row?.[0]?.toString() || '';

            if (!firstCell || firstCell.trim() === '') break;

            const dateParts = firstCell.split('/');
            if (dateParts.length !== 3) break;

            const date = parseDateFromString(firstCell);
            const metrics = parseMetricRow(rows[currentRow] as SheetRow, 1);

            dailyData.push({
              date,
              ...metrics,
            } as DailyRow);

            currentRow++;
          }

          const period: DataPeriod = {
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

          resolve(period);
        } else {
          throw new Error('数据格式不符合预期：缺少 Total value 行');
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}
