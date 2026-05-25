import { create } from 'zustand';

interface UIStore {
  expandedCategories: Record<string, boolean>;
  anomalyThreshold: number;
  sidebarCollapsed: boolean;

  toggleCategory: (label: string) => void;
  setAnomalyThreshold: (t: number) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  expandedCategories: {
    '核心指标': true,
    '退货退款': false,
    'SKU': false,
    '直播': false,
    '商品卡': false,
    '短视频': false,
    '财务': false,
    '流量': false,
  },
  anomalyThreshold: 30,
  sidebarCollapsed: false,

  toggleCategory: (label) =>
    set((s) => ({
      expandedCategories: { ...s.expandedCategories, [label]: !s.expandedCategories[label] },
    })),

  setAnomalyThreshold: (t) => set({ anomalyThreshold: t }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
