import { create } from 'zustand';
import type { Influencer, Shipment, CommLog, PipelineStage } from '../types/influencer';
import * as storage from '../services/influencerStorage';

export type InfluencerTab = 'influencers' | 'pipeline' | 'tracking' | 'commlog';

interface InfluencerStore {
  influencers: Influencer[];
  shipments: Shipment[];
  commLogs: CommLog[];
  activeTab: InfluencerTab;
  loading: boolean;
  error: string | null;
  selectedInfluencerId: string | null;

  loadAll: () => Promise<void>;
  setActiveTab: (tab: InfluencerTab) => void;
  setSelectedInfluencer: (id: string | null) => void;

  addInfluencer: (inf: Influencer) => Promise<void>;
  updateInfluencer: (inf: Influencer) => Promise<void>;
  removeInfluencer: (id: string) => Promise<void>;

  addShipment: (s: Shipment) => Promise<void>;
  updateShipment: (s: Shipment) => Promise<void>;
  removeShipment: (id: string) => Promise<void>;
  refreshShipmentStatus: (id: string, onStatusChange?: (s: Shipment) => void) => Promise<void>;
  refreshAllShipments: () => Promise<void>;

  addCommLog: (log: CommLog) => Promise<void>;
  removeCommLog: (id: string) => Promise<void>;

  getInfluencerById: (id: string) => Influencer | undefined;
  getPipelineCounts: () => Record<PipelineStage, number>;
  getDeliveryAlerts: () => Shipment[];
  getShipmentsByInfluencer: (id: string) => Shipment[];
  getCommLogsByInfluencer: (id: string) => CommLog[];
}

export const useInfluencerStore = create<InfluencerStore>((set, get) => ({
  influencers: [],
  shipments: [],
  commLogs: [],
  activeTab: 'influencers',
  loading: false,
  error: null,
  selectedInfluencerId: null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const [influencers, shipments, commLogs] = await Promise.all([
        storage.getAllInfluencers(),
        storage.getAllShipments(),
        storage.getAllCommLogs(),
      ]);
      set({ influencers, shipments, commLogs, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab, selectedInfluencerId: null }),
  setSelectedInfluencer: (id) => set({ selectedInfluencerId: id }),

  addInfluencer: async (inf) => {
    await storage.saveInfluencer(inf);
    const influencers = await storage.getAllInfluencers();
    set({ influencers });
  },

  updateInfluencer: async (inf) => {
    const updated = { ...inf, updatedAt: new Date().toISOString() };
    await storage.saveInfluencer(updated);
    const influencers = await storage.getAllInfluencers();
    set({ influencers });
  },

  removeInfluencer: async (id) => {
    await storage.removeInfluencer(id);
    const [allInfluencers, allShipments, allCommLogs] = await Promise.all([
      storage.getAllInfluencers(),
      storage.getAllShipments(),
      storage.getAllCommLogs(),
    ]);
    set({ influencers: allInfluencers, shipments: allShipments, commLogs: allCommLogs, selectedInfluencerId: get().selectedInfluencerId === id ? null : get().selectedInfluencerId });
  },

  addShipment: async (s) => {
    await storage.saveShipment(s);
    const allShipments = await storage.getAllShipments();
    set({ shipments: allShipments });
  },

  updateShipment: async (s) => {
    await storage.saveShipment(s);
    const allShipments = await storage.getAllShipments();
    set({ shipments: allShipments });
  },

  removeShipment: async (id) => {
    await storage.removeShipment(id);
    const allShipments = await storage.getAllShipments();
    set({ shipments: allShipments });
  },

  refreshShipmentStatus: async (id, onStatusChange) => {
    const shipment = get().shipments.find(s => s.id === id);
    if (!shipment) return;
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: shipment.trackingNumber, carrier: shipment.carrier }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const newStatus = data.status as Shipment['status'];
      const detail = data.detail || '';
      const now = new Date().toISOString();
      const updated: Shipment = {
        ...shipment,
        status: newStatus,
        statusDetail: detail || shipment.statusDetail,
        statusUpdatedAt: now,
        deliveredAt: newStatus === 'delivered' ? (shipment.deliveredAt || now) : shipment.deliveredAt,
      };
      await storage.saveShipment(updated);
      const allShipments = await storage.getAllShipments();
      set({ shipments: allShipments });
      if (newStatus === 'delivered' && !shipment.deliveredAt) {
        onStatusChange?.(updated);
      }
    } catch {
      // offline or API unreachable - silent fail
    }
  },

  refreshAllShipments: async () => {
    const { shipments: currentShipments } = get();
    const results = await Promise.allSettled(
      currentShipments.filter(s => s.status !== 'delivered' || !s.acknowledged).map(async (s) => {
        try {
          const res = await fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackingNumber: s.trackingNumber, carrier: s.carrier }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          const newStatus = data.status as Shipment['status'];
          const now = new Date().toISOString();
          return {
            ...s,
            status: newStatus,
            statusDetail: data.detail || s.statusDetail,
            statusUpdatedAt: now,
            deliveredAt: newStatus === 'delivered' ? (s.deliveredAt || now) : s.deliveredAt,
          } as Shipment;
        } catch {
          return null;
        }
      })
    );
    const updated: Shipment[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value !== null) {
        updated.push(r.value);
      }
    }
    for (const s of updated) {
      await storage.saveShipment(s);
    }
    const allShipments = await storage.getAllShipments();
    set({ shipments: allShipments });
  },

  addCommLog: async (log) => {
    await storage.saveCommLog(log);
    const commLogs = await storage.getAllCommLogs();
    set({ commLogs });
  },

  removeCommLog: async (id) => {
    await storage.removeCommLog(id);
    const commLogs = await storage.getAllCommLogs();
    set({ commLogs });
  },

  getInfluencerById: (id) => get().influencers.find(i => i.id === id),

  getPipelineCounts: () => {
    const counts: Record<string, number> = {};
    for (const inf of get().influencers) {
      counts[inf.status] = (counts[inf.status] || 0) + 1;
    }
    return counts as Record<PipelineStage, number>;
  },

  getDeliveryAlerts: () => {
    return get().shipments.filter(s => s.status === 'delivered' && !s.acknowledged);
  },

  getShipmentsByInfluencer: (id) => {
    return get().shipments.filter(s => s.influencerId === id);
  },

  getCommLogsByInfluencer: (id) => {
    return get().commLogs.filter(l => l.influencerId === id);
  },
}));
