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
  pending: 'bg-slate-100 text-slate-600',
  contacted: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  sample_sent: 'bg-indigo-100 text-indigo-700',
  content_received: 'bg-violet-100 text-violet-700',
  published: 'bg-cyan-100 text-cyan-700',
  settled: 'bg-green-100 text-green-700',
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
  pending: 'bg-slate-100 text-slate-600',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  exception: 'bg-red-100 text-red-700',
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
