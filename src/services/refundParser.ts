import * as XLSX from 'xlsx';
import type { RefundRow, RefundDataset } from '../types/refund';
import { parseNumberFromString, parseDateFromString } from '../utils/formatters';

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

export function parseRefundExcel(file: File): Promise<RefundDataset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: Record<string, string | number | null>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawRows.length === 0) throw new Error('Excel 文件为空');

        const rows: RefundRow[] = rawRows.map((raw) => {
          const row: Record<string, unknown> = {};
          for (const [header, value] of Object.entries(raw)) {
            const key = COL_MAP[header.trim()];
            if (!key) continue;
            if (key === 'orderAmount' || key === 'returnUnitPrice') {
              row[key] = parseNumberFromString(value as string);
            } else if (key === 'returnQuantity') {
              row[key] = parseInt(String(value), 10) || 0;
            } else {
              row[key] = String(value).trim();
            }
          }
          return row as unknown as RefundRow;
        });

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
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          dateRange,
          rows,
        };

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}
