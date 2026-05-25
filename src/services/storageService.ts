import { openDB, type IDBPDatabase } from 'idb';
import type { DataPeriod, AnalysisResult } from '../types';

const DB_NAME = 'tiktok-dashboard';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('periods')) {
            const periodsStore = db.createObjectStore('periods', { keyPath: 'id' });
            periodsStore.createIndex('analysisStart', 'analysisStart');
            periodsStore.createIndex('type', 'type');
          }
          if (!db.objectStoreNames.contains('analyses')) {
            const analysesStore = db.createObjectStore('analyses', { keyPath: 'periodId' });
            analysesStore.createIndex('periodId', 'periodId');
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('refunds')) {
            db.createObjectStore('refunds', { keyPath: 'id' });
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('influencers')) {
            const influencersStore = db.createObjectStore('influencers', { keyPath: 'id' });
            influencersStore.createIndex('status', 'status');
            influencersStore.createIndex('name', 'name');
          }
          if (!db.objectStoreNames.contains('shipments')) {
            const shipmentsStore = db.createObjectStore('shipments', { keyPath: 'id' });
            shipmentsStore.createIndex('influencerId', 'influencerId');
            shipmentsStore.createIndex('status', 'status');
            shipmentsStore.createIndex('trackingNumber', 'trackingNumber');
          }
          if (!db.objectStoreNames.contains('commLogs')) {
            const commLogsStore = db.createObjectStore('commLogs', { keyPath: 'id' });
            commLogsStore.createIndex('influencerId', 'influencerId');
            commLogsStore.createIndex('date', 'date');
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function savePeriod(period: DataPeriod): Promise<void> {
  const db = await getDb();
  await db.put('periods', period);
}

export async function getAllPeriods(): Promise<DataPeriod[]> {
  const db = await getDb();
  const periods = await db.getAll('periods');
  return periods.sort((a, b) => b.analysisStart.localeCompare(a.analysisStart));
}

export async function getPeriodById(id: string): Promise<DataPeriod | undefined> {
  const db = await getDb();
  return db.get('periods', id);
}

export async function getPeriodByDateRange(start: string, end: string): Promise<DataPeriod | undefined> {
  const db = await getDb();
  const all = await db.getAll('periods');
  return all.find(p => p.analysisStart === start && p.analysisEnd === end);
}

export async function deletePeriod(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('periods', id);
  await db.delete('analyses', id);
}

export async function saveAnalysis(analysis: AnalysisResult): Promise<void> {
  const db = await getDb();
  await db.put('analyses', analysis);
}

export async function getAnalysisByPeriodId(periodId: string): Promise<AnalysisResult | undefined> {
  const db = await getDb();
  return db.get('analyses', periodId);
}

export async function getAllPeriodCount(): Promise<number> {
  const db = await getDb();
  return db.count('periods');
}
