import * as XLSX from 'xlsx';
import type { RefundRow, RefundDataset } from '../types/refund';
import { parseNumberFromString, parseDateFromString } from '../utils/formatters';

const READ_OPTS: XLSX.ParsingOptions = {
  type: 'array',
  cellFormula: false,
  cellStyles: false,
  cellDates: false,
  sheetStubs: false,
  bookVBA: false,
  bookSheets: false,
};

const COL_MAP: Record<string, keyof RefundRow> = {
  'Return Order ID': 'returnOrderId',
  'Order ID': 'orderId',
  'Order Amount': 'orderAmount',
  'Order Status': 'orderStatus',
  'Order Substatus': 'orderSubstatus',
  'Payment Method': 'paymentMethod',
  'SKU ID': 'skuId',
  'Seller SKU': 'sellerSku',
  'Product Name': 'productName',
  'SKU Name': 'skuName',
  'Buyer Username': 'buyerUsername',
  'Return Type': 'returnType',
  'Time Requested': 'timeRequested',
  'Return Reason': 'returnReason',
  'Return unit price': 'returnUnitPrice',
  'Return Quantity': 'returnQuantity',
  'Return Logistics Tracking ID': 'returnLogisticsTrackingId',
  'Return Status': 'returnStatus',
  'Return Sub Status': 'returnSubStatus',
  'Refund Time': 'refundTime',
  'Dispute Status': 'disputeStatus',
  'Appeal Status': 'appealStatus',
  'Compensation Status': 'compensationStatus',
  'Compensation Amount': 'compensationAmount',
  'Buyer Note': 'buyerNote',
};

interface WorkerMessage {
  type: 'parse';
  buffer: ArrayBuffer;
  fileName: string;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { buffer, fileName } = e.data;

  try {
    self.postMessage({ type: 'progress', stage: '读取表格结构...', percent: 10 });

    const workbook = XLSX.read(buffer, READ_OPTS);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows: Record<string, string | number | null>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });

    if (rawRows.length === 0) throw new Error('Excel 文件为空');

    self.postMessage({ type: 'progress', stage: `解析 ${rawRows.length} 行数据...`, percent: 35 });

    // Pre-resolve the column mapping for speed
    const firstRow = rawRows[0];
    const headerKeys = Object.keys(firstRow);
    const columnIndex: { idx: number; key: keyof RefundRow; type: 'amount' | 'quantity' | 'text' }[] = [];

    for (let i = 0; i < headerKeys.length; i++) {
      const header = headerKeys[i].trim();
      const key = COL_MAP[header];
      if (!key) continue;
      let type: 'amount' | 'quantity' | 'text' = 'text';
      if (key === 'orderAmount' || key === 'returnUnitPrice') type = 'amount';
      else if (key === 'returnQuantity') type = 'quantity';
      columnIndex.push({ idx: i, key, type });
    }

    const rows: RefundRow[] = new Array(rawRows.length);

    for (let r = 0; r < rawRows.length; r++) {
      const raw = rawRows[r];
      const row: Record<string, unknown> = {};
      for (let c = 0; c < columnIndex.length; c++) {
        const { idx, key, type } = columnIndex[c];
        const value = raw[headerKeys[idx]];
        if (type === 'amount') row[key] = parseNumberFromString(value as string);
        else if (type === 'quantity') row[key] = parseInt(String(value), 10) || 0;
        else row[key] = String(value).trim();
      }
      rows[r] = row as unknown as RefundRow;
    }

    self.postMessage({ type: 'progress', stage: '提取日期范围...', percent: 80 });

    const dates = rows
      .map((r) => r.timeRequested.split(' ')[0])
      .filter(Boolean)
      .sort();

    const dateRange = {
      start: dates[0] ? parseDateFromString(dates[0]) : '',
      end: dates[dates.length - 1] ? parseDateFromString(dates[dates.length - 1]) : '',
    };

    const parsed: RefundDataset = {
      id: `refund_${dateRange.start?.substring(0, 7) || 'unknown'}`,
      fileName,
      uploadedAt: new Date().toISOString(),
      dateRange,
      rows,
    };

    self.postMessage({ type: 'result', dataset: parsed });
  } catch (err) {
    self.postMessage({ type: 'error', message: (err as Error).message });
  }
};
