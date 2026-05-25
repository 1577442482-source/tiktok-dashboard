import { getDb } from './storageService';
import type { RefundDataset } from '../types/refund';

export async function saveRefundDataset(dataset: RefundDataset): Promise<void> {
  const db = await getDb();
  await db.put('refunds', dataset);
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
