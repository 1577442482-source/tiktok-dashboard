import type { RefundDataset } from '../types/refund';
import type { ParseProgress } from './excelParser';

/**
 * Parse TikTok refund Excel file in a Web Worker to avoid blocking the main thread.
 */
export function parseRefundExcel(
  file: File,
  onProgress?: (progress: ParseProgress) => void,
): Promise<RefundDataset> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./refundParser.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;

      if (msg.type === 'progress') {
        onProgress?.({ stage: msg.stage, percent: msg.percent });
      } else if (msg.type === 'result') {
        resolve(msg.dataset);
        worker.terminate();
      } else if (msg.type === 'error') {
        reject(new Error(msg.message));
        worker.terminate();
      }
    };

    worker.onerror = () => {
      reject(new Error('解析工作线程异常'));
      worker.terminate();
    };

    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target!.result as ArrayBuffer;
      worker.postMessage({ type: 'parse', buffer, fileName: file.name }, [buffer]);
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
      worker.terminate();
    };

    reader.readAsArrayBuffer(file);
  });
}
