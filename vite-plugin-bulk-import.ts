import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * Vite plugin that adds a POST /api/bulk-import endpoint to the dev server.
 * Accepts { directory: string }, reads all .xlsx files, parses them server-side
 * using the same logic as the browser, and returns DataPeriod[] as JSON.
 */
function bulkImportHandler(server: ViteDevServer) {
  server.middlewares.use('/api/bulk-import', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
      return;
    }

    // Read body
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const directory = body.directory as string;

    if (!directory) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing "directory" field in request body.' }));
      return;
    }

    try {
      const stat = statSync(directory);
      if (!stat.isDirectory()) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: `Not a directory: ${directory}` }));
        return;
      }
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: `Directory not found: ${directory}` }));
      return;
    }

    try {
      const files = readdirSync(directory)
        .filter((f) => extname(f).toLowerCase() === '.xlsx' && !f.startsWith('~$'))
        .sort();

      if (files.length === 0) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'No .xlsx files found in directory.' }));
        return;
      }

      // Dynamic import — the module uses ESM and xlsx
      const { parseExcelBuffer } = await import('./src/services/excelParserCore.ts');

      const periods: unknown[] = [];
      const errors: { file: string; error: string }[] = [];

      for (const file of files) {
        const filePath = join(directory, file);
        try {
          const buffer = readFileSync(filePath);
          // Convert Node Buffer to ArrayBuffer
          const arrayBuffer = buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
          );
          const period = parseExcelBuffer(arrayBuffer as ArrayBuffer);
          periods.push(period);
        } catch (e) {
          errors.push({ file, error: (e as Error).message });
        }
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, count: periods.length, periods, errors, total: files.length }));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: (e as Error).message }));
    }
  });
}

export default function bulkImportPlugin(): Plugin {
  return {
    name: 'vite-plugin-bulk-import',
    configureServer(server) {
      bulkImportHandler(server);
    },
  };
}
