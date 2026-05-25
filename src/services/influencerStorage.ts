import { getDb } from './storageService';
import type { Influencer, Shipment, CommLog } from '../types/influencer';

// ── Influencers ──

export async function getAllInfluencers(): Promise<Influencer[]> {
  const db = await getDb();
  const list = await db.getAll('influencers');
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getInfluencerById(id: string): Promise<Influencer | undefined> {
  const db = await getDb();
  return db.get('influencers', id);
}

export async function saveInfluencer(inf: Influencer): Promise<void> {
  const db = await getDb();
  await db.put('influencers', inf);
}

export async function removeInfluencer(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('influencers', id);
  await db.delete('shipments', id);
  const allShipments = await db.getAll('shipments');
  for (const s of allShipments) {
    if (s.influencerId === id) await db.delete('shipments', s.id);
  }
  const allLogs = await db.getAll('commLogs');
  for (const l of allLogs) {
    if (l.influencerId === id) await db.delete('commLogs', l.id);
  }
}

// ── Shipments ──

export async function getAllShipments(): Promise<Shipment[]> {
  const db = await getDb();
  const list = await db.getAll('shipments');
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getShipmentsByInfluencer(influencerId: string): Promise<Shipment[]> {
  const db = await getDb();
  const all = await db.getAll('shipments');
  return all.filter(s => s.influencerId === influencerId);
}

export async function getShipmentByTracking(trackingNumber: string): Promise<Shipment | undefined> {
  const db = await getDb();
  return db.getFromIndex('shipments', 'trackingNumber', trackingNumber);
}

export async function saveShipment(s: Shipment): Promise<void> {
  const db = await getDb();
  await db.put('shipments', s);
}

export async function removeShipment(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('shipments', id);
}

export async function getUndeliveredShipments(): Promise<Shipment[]> {
  const db = await getDb();
  const all = await db.getAll('shipments');
  return all.filter(s => s.status === 'delivered' && !s.acknowledged);
}

export async function getPendingDeliveries(): Promise<Shipment[]> {
  const db = await getDb();
  const all = await db.getAll('shipments');
  return all.filter(s => s.status === 'delivered' && !s.acknowledged)
    .sort((a, b) => (b.deliveredAt || '').localeCompare(a.deliveredAt || ''));
}

// ── Comm Logs ──

export async function getCommLogsByInfluencer(influencerId: string): Promise<CommLog[]> {
  const db = await getDb();
  const all = await db.getAll('commLogs');
  return all.filter(l => l.influencerId === influencerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAllCommLogs(): Promise<CommLog[]> {
  const db = await getDb();
  const list = await db.getAll('commLogs');
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveCommLog(log: CommLog): Promise<void> {
  const db = await getDb();
  await db.put('commLogs', log);
}

export async function removeCommLog(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('commLogs', id);
}
