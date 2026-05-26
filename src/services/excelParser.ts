import type { DataPeriod } from '../types';

export interface ParseProgress {
  stage: string;
  percent: number;
}

/**
 * Parse TikTok Excel file in a Web Worker to avoid blocking the main thread.
 * Reports progress via the onProgress callback.
 */
export function parseExcelFile(
  file: File,
  onProgress?: (progress: ParseProgress) => void,
): Promise<DataPeriod> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./excelParser.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;

      if (msg.type === 'progress') {
        onProgress?.({ stage: msg.stage, percent: msg.percent });
      } else if (msg.type === 'result') {
        resolve(msg.period);
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

    // Read file as ArrayBuffer and pass to worker
    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target!.result as ArrayBuffer;
      worker.postMessage({ type: 'parse', buffer }, [buffer]);
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
      worker.terminate();
    };

    reader.readAsArrayBuffer(file);
  });
}
