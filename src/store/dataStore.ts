import { create } from 'zustand';
import type { DataPeriod, AnalysisResult } from '../types';
import * as storage from '../services/storageService';
import { analyzeLatestPeriod } from '../services/analysisEngine';

/** Check if two date ranges overlap (inclusive) */
function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

/** Find all existing periods whose date range overlaps with the given period */
function findOverlappingPeriods(newPeriod: DataPeriod, existing: DataPeriod[]): DataPeriod[] {
  return existing.filter((p) => {
    // Skip exact same ID (handled by exact-dedup below)
    if (p.id === newPeriod.id) return false;
    return datesOverlap(
      newPeriod.analysisStart, newPeriod.analysisEnd,
      p.analysisStart, p.analysisEnd,
    );
  });
}

export interface AddPeriodResult {
  analysis: AnalysisResult;
  previousPeriod: DataPeriod | null;
  replacedPeriods: DataPeriod[];
}

interface DataStore {
  periods: DataPeriod[];
  currentPeriodId: string | null;
  analyses: Record<string, AnalysisResult>;
  loading: boolean;
  error: string | null;

  loadPeriods: () => Promise<void>;
  addPeriod: (period: DataPeriod) => Promise<AddPeriodResult>;
  removePeriod: (id: string) => Promise<void>;
  setCurrentPeriod: (id: string | null) => void;
  getCurrentPeriod: () => DataPeriod | undefined;
  getCurrentAnalysis: () => AnalysisResult | undefined;
}

export const useDataStore = create<DataStore>((set, get) => ({
  periods: [],
  currentPeriodId: null,
  analyses: {},
  loading: false,
  error: null,

  loadPeriods: async () => {
    set({ loading: true, error: null });
    try {
      const periods = await storage.getAllPeriods();
      const analyses: Record<string, AnalysisResult> = {};
      for (const p of periods) {
        const a = await storage.getAnalysisByPeriodId(p.id);
        if (a) analyses[p.id] = a;
      }
      set({ periods, analyses, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addPeriod: async (period: DataPeriod) => {
    set({ loading: true, error: null });
    try {
      // 1. Exact dedup: same ID = same period, just overwrite
      const existingSameId = await storage.getPeriodById(period.id);
      if (existingSameId) {
        await storage.deletePeriod(period.id);
      }

      // 2. Overlap dedup: find and remove periods whose date range overlaps
      const allPeriods = await storage.getAllPeriods();
      const overlapping = findOverlappingPeriods(period, allPeriods);

      for (const old of overlapping) {
        await storage.deletePeriod(old.id);
      }

      // 3. Save new period
      await storage.savePeriod(period);

      const remainingPeriods = await storage.getAllPeriods();
      const { analysis, previousPeriod } = analyzeLatestPeriod(period, remainingPeriods);

      await storage.saveAnalysis(analysis);

      const analyses: Record<string, AnalysisResult> = {};
      for (const p of remainingPeriods) {
        if (p.id === period.id) {
          analyses[p.id] = analysis;
        } else {
          const a = await storage.getAnalysisByPeriodId(p.id);
          if (a) analyses[p.id] = a;
        }
      }

      set({
        periods: remainingPeriods,
        currentPeriodId: period.id,
        analyses,
        loading: false,
      });

      return { analysis, previousPeriod, replacedPeriods: overlapping };
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  removePeriod: async (id: string) => {
    await storage.deletePeriod(id);
    const periods = await storage.getAllPeriods();
    const { currentPeriodId, analyses } = get();
    const newAnalyses = { ...analyses };
    delete newAnalyses[id];
    set({
      periods,
      analyses: newAnalyses,
      currentPeriodId: currentPeriodId === id ? null : currentPeriodId,
    });
  },

  setCurrentPeriod: (id) => set({ currentPeriodId: id }),

  getCurrentPeriod: () => {
    const { periods, currentPeriodId } = get();
    return periods.find(p => p.id === currentPeriodId);
  },

  getCurrentAnalysis: () => {
    const { analyses, currentPeriodId } = get();
    if (!currentPeriodId) return undefined;
    return analyses[currentPeriodId];
  },
}));
