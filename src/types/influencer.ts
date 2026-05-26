export const PIPELINE_STAGES = [
  'pending',
  'contacted',
  'negotiating',
  'confirmed',
  'sample_sent',
  'content_received',
  'published',
  'settled',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

export const PIPELINE_LABELS: Record<PipelineStage, string> = {
  pending: '待联系',
  contacted: '已联系',
  negotiating: '洽谈中',
  confirmed: '已确认',
  sample_sent: '样品已寄',
  content_received: '内容已收到',
  published: '已发布',
  settled: '已结算',
};

export const PIPELINE_COLORS: Record<PipelineStage, string> = {
  pending: 'bg-slate-500/15 text-slate-400',
  contacted: 'bg-blue-500/15 text-blue-300',
  negotiating: 'bg-amber-500/15 text-amber-300',
  confirmed: 'bg-emerald-500/15 text-emerald-300',
  sample_sent: 'bg-indigo-500/15 text-indigo-300',
  content_received: 'bg-violet-500/15 text-violet-300',
  published: 'bg-cyan-500/15 text-cyan-300',
  settled: 'bg-green-500/15 text-green-300',
};

export interface Influencer {
  id: string;
  name: string;
  platform: string;
  handle: string;
  followers: number;
  category: string[];
  contactInfo: string;
  status: PipelineStage;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type TrackingStatus = 'pending' | 'in_transit' | 'delivered' | 'exception';

export const TRACKING_LABELS: Record<TrackingStatus, string> = {
  pending: '待揽收',
  in_transit: '运输中',
  delivered: '已签收',
  exception: '异常',
};

export const TRACKING_COLORS: Record<TrackingStatus, string> = {
  pending: 'bg-slate-500/15 text-slate-400',
  in_transit: 'bg-blue-500/15 text-blue-300',
  delivered: 'bg-emerald-500/15 text-emerald-300',
  exception: 'bg-red-500/15 text-red-300',
};

export interface Shipment {
  id: string;
  influencerId: string;
  influencerName: string;
  productName: string;
  trackingNumber: string;
  carrier: string;
  carrierName: string;
  status: TrackingStatus;
  statusDetail: string;
  statusUpdatedAt: string;
  deliveredAt: string | null;
  acknowledged: boolean;
  createdAt: string;
}

export interface CommLog {
  id: string;
  influencerId: string;
  date: string;
  method: string;
  content: string;
}

export const CONTACT_METHODS = ['私信', '邮件', '微信', '电话', '见面', '其他'] as const;

export const CARRIERS: { code: string; name: string; url: string }[] = [
  { code: 'usps', name: 'USPS', url: 'https://www.usps.com' },
  { code: 'fedex', name: 'FedEx', url: 'https://www.fedex.com' },
  { code: 'ups', name: 'UPS', url: 'https://www.ups.com' },
  { code: 'ontrac', name: 'OnTrac', url: 'https://www.ontrac.com' },
  { code: 'dhl', name: 'DHL', url: 'https://www.dhl.com' },
  { code: 'amazon', name: 'Amazon Logistics', url: 'https://track.amazon.com' },
  { code: 'lasership', name: 'LaserShip', url: 'https://www.lasership.com' },
  { code: 'osm', name: 'OSM Worldwide', url: 'https://www.osmworldwide.com' },
  { code: 'gofly', name: 'GoFly', url: 'https://www.goflyus.com' },
  { code: 'pitney', name: 'Pitney Bowes', url: 'https://www.pitneybowes.com' },
  { code: 'canadapost', name: 'Canada Post', url: 'https://www.canadapost.ca' },
  { code: 'gls', name: 'GLS', url: 'https://www.gls-group.com' },
  { code: 'swift', name: 'Swift Express', url: 'https://www.swift-express.com' },
];
