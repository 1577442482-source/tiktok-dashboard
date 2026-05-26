import { parseExcelBuffer } from './excelParserCore';

interface WorkerMessage {
  type: 'parse';
  buffer: ArrayBuffer;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { buffer } = e.data;

  try {
    const period = parseExcelBuffer(buffer, {
      onProgress: (stage, percent) => {
        self.postMessage({ type: 'progress', stage, percent });
      },
    });

    self.postMessage({ type: 'result', period });
  } catch (err) {
    self.postMessage({ type: 'error', message: (err as Error).message });
  }
};
