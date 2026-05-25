import { create } from 'zustand';
import type { DataPeriod, AnalysisResult } from '../types';
import * as storage from '../services/storageService';
import { analyzeLatestPeriod } from '../services/analysisEngine';

interface DataStore {
  periods: DataPeriod[];
  currentPeriodId: string | null;
  analyses: Record<string, AnalysisResult>;
  loading: boolean;
  error: string | null;

  loadPeriods: () => Promise<void>;
  addPeriod: (period: DataPeriod) => Promise<{ analysis: AnalysisResult; previousPeriod: DataPeriod | null }>;
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
      const existing = await storage.getPeriodById(period.id);
      if (existing) {
        await storage.deletePeriod(period.id);
      }

      await storage.savePeriod(period);

      const allPeriods = await storage.getAllPeriods();
      const { analysis, previousPeriod } = analyzeLatestPeriod(period, allPeriods);

      await storage.saveAnalysis(analysis);

      const analyses: Record<string, AnalysisResult> = {};
      for (const p of allPeriods) {
        if (p.id === period.id) {
          analyses[p.id] = analysis;
        } else {
          const a = await storage.getAnalysisByPeriodId(p.id);
          if (a) analyses[p.id] = a;
        }
      }

      set({
        periods: allPeriods,
        currentPeriodId: period.id,
        analyses,
        loading: false,
      });

      return { analysis, previousPeriod };
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
