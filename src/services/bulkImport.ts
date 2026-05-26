import type { DataPeriod } from '../types';
import { useDataStore } from '../store/dataStore';

export interface BulkImportResult {
  success: boolean;
  count: number;
  periods: DataPeriod[];
  errors: { file: string; error: string }[];
  total: number;
}

/**
 * Call the Vite dev server's /api/bulk-import endpoint to parse all .xlsx files
 * in a directory server-side, then save them to the data store.
 */
export async function bulkImportFromDirectory(directory: string): Promise<BulkImportResult> {
  const res = await fetch('/api/bulk-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data: BulkImportResult = await res.json();

  if (data.count > 0) {
    const { addPeriod } = useDataStore.getState();
    for (const period of data.periods) {
      try {
        await addPeriod(period);
      } catch (e) {
        data.errors.push({ file: period.id, error: (e as Error).message });
      }
    }
  }

  return data;
}
