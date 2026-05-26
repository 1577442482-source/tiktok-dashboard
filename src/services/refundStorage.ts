import { getDb } from './storageService';
import type { RefundDataset } from '../types/refund';

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export async function saveRefundDataset(dataset: RefundDataset): Promise<string[]> {
  const db = await getDb();
  const all = await db.getAll('refunds');

  // Find and remove overlapping datasets
  const removed: string[] = [];
  for (const existing of all) {
    if (existing.id === dataset.id) {
      await db.delete('refunds', existing.id);
      removed.push(existing.id);
    } else if (
      existing.dateRange?.start && existing.dateRange?.end &&
      dataset.dateRange.start && dataset.dateRange.end &&
      datesOverlap(
        dataset.dateRange.start, dataset.dateRange.end,
        existing.dateRange.start, existing.dateRange.end,
      )
    ) {
      await db.delete('refunds', existing.id);
      removed.push(existing.id);
    }
  }

  await db.put('refunds', dataset);
  return removed;
}

export async function getAllRefundDatasets(): Promise<RefundDataset[]> {
  const db = await getDb();
  const datasets = await db.getAll('refunds');
  return datasets.sort((a, b) => (b.dateRange?.start || '').localeCompare(a.dateRange?.start || ''));
}

export async function getRefundDatasetById(id: string): Promise<RefundDataset | undefined> {
  const db = await getDb();
  return db.get('refunds', id);
}

export async function getAllRefundRows(): Promise<RefundDataset['rows']> {
  const datasets = await getAllRefundDatasets();
  return datasets.flatMap((d) => d.rows);
}

export async function deleteRefundDataset(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('refunds', id);
}
