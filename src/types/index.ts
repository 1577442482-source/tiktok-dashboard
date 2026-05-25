export interface MetricRow {
  gmv: number;
  orders: number;
  customers: number;
  itemsSold: number;
  itemsCanceledReturned: number;
  itemsRefunded: number;
  aov: number;
  skuOrders: number;
  gmvWithCoFunding: number;
  liveAttributedGmv: number;
  creatorLiveAttributedGmv: number;
  creatorLiveGmv: number;
  creatorLiveIndirectGmv: number;
  linkedAccountLiveAttributedGmv: number;
  sellerLiveGmv: number;
  sellerLiveIndirectGmv: number;
  productCardGmv: number;
  videoAttributedGmv: number;
  creatorVideoAttributedGmv: number;
  creatorVideoGmv: number;
  creatorVideoIndirectGmv: number;
  linkedAccountVideoAttributedGmv: number;
  sellerVideoGmv: number;
  sellerVideoIndirectGmv: number;
  gmvWithTax: number;
  tax: number;
  shippingFees: number;
  productImpressions: number;
  uniqueProductImpressions: number;
  productClicks: number;
  uniqueClicks: number;
}

export interface DailyRow extends MetricRow {
  date: string;
}

export type PeriodType = 'monthly' | 'weekly';

export interface DataPeriod {
  id: string;
  type: PeriodType;
  analysisStart: string;
  analysisEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
  uploadedAt: string;
  overview: MetricRow;
  overviewChange: MetricRow;
  dailyData: DailyRow[];
}

export type AnomalyLevel = 'normal' | 'warning' | 'critical';
export type Probability = 'high' | 'medium' | 'low';

export interface AttributionCause {
  description: string;
  probability: Probability;
  confidence: number;
}

export interface Attribution {
  metricKey: string;
  metricLabel: string;
  currentValue: number;
  previousValue: number;
  changeRate: number;
  anomalyLevel: AnomalyLevel;
  causes: AttributionCause[];
}

export interface AnalysisResult {
  periodId: string;
  attributions: Attribution[];
  summary: string;
  generatedAt: string;
}

export const METRIC_KEYS = [
  'gmv', 'orders', 'customers', 'itemsSold', 'itemsCanceledReturned',
  'itemsRefunded', 'aov', 'skuOrders', 'gmvWithCoFunding',
  'liveAttributedGmv', 'creatorLiveAttributedGmv', 'creatorLiveGmv',
  'creatorLiveIndirectGmv', 'linkedAccountLiveAttributedGmv',
  'sellerLiveGmv', 'sellerLiveIndirectGmv', 'productCardGmv',
  'videoAttributedGmv', 'creatorVideoAttributedGmv', 'creatorVideoGmv',
  'creatorVideoIndirectGmv', 'linkedAccountVideoAttributedGmv',
  'sellerVideoGmv', 'sellerVideoIndirectGmv', 'gmvWithTax', 'tax',
  'shippingFees', 'productImpressions', 'uniqueProductImpressions',
  'productClicks', 'uniqueClicks',
] as const;

export type MetricKey = typeof METRIC_KEYS[number];

export const METRIC_LABELS: Record<MetricKey, string> = {
  gmv: 'GMV',
  orders: 'Orders',
  customers: 'Customers',
  itemsSold: 'Items sold',
  itemsCanceledReturned: 'Items canceled and returned',
  itemsRefunded: 'Items refunded',
  aov: 'AOV',
  skuOrders: 'SKU orders',
  gmvWithCoFunding: 'Gross merchandise value (with TikTok co-funding)',
  liveAttributedGmv: 'LIVE-attributed GMV',
  creatorLiveAttributedGmv: 'Creator LIVE-attributed GMV',
  creatorLiveGmv: 'Creator LIVE GMV',
  creatorLiveIndirectGmv: 'Creator LIVE indirect GMV',
  linkedAccountLiveAttributedGmv: 'Linked account LIVE-attributed GMV',
  sellerLiveGmv: 'Seller LIVE GMV',
  sellerLiveIndirectGmv: 'Seller LIVE indirect GMV',
  productCardGmv: 'Product card GMV',
  videoAttributedGmv: 'Video-attributed GMV',
  creatorVideoAttributedGmv: 'Creator video-attributed GMV',
  creatorVideoGmv: 'Creator video GMV',
  creatorVideoIndirectGmv: 'Creator video indirect GMV',
  linkedAccountVideoAttributedGmv: 'Linked account video-attributed GMV',
  sellerVideoGmv: 'Seller video GMV',
  sellerVideoIndirectGmv: 'Seller video indirect GMV',
  gmvWithTax: 'GMV (with tax)',
  tax: 'Tax',
  shippingFees: 'Shipping fees',
  productImpressions: 'Product impressions',
  uniqueProductImpressions: 'Unique product impressions',
  productClicks: 'Product clicks',
  uniqueClicks: 'Unique clicks',
};

export const METRIC_CATEGORIES: { label: string; keys: MetricKey[] }[] = [
  { label: '核心指标', keys: ['gmv', 'orders', 'customers', 'itemsSold', 'aov'] },
  { label: '退货退款', keys: ['itemsCanceledReturned', 'itemsRefunded'] },
  { label: 'SKU', keys: ['skuOrders', 'gmvWithCoFunding'] },
  { label: '直播', keys: ['liveAttributedGmv', 'creatorLiveAttributedGmv', 'creatorLiveGmv', 'creatorLiveIndirectGmv', 'linkedAccountLiveAttributedGmv', 'sellerLiveGmv', 'sellerLiveIndirectGmv'] },
  { label: '商品卡', keys: ['productCardGmv'] },
  { label: '短视频', keys: ['videoAttributedGmv', 'creatorVideoAttributedGmv', 'creatorVideoGmv', 'creatorVideoIndirectGmv', 'linkedAccountVideoAttributedGmv', 'sellerVideoGmv', 'sellerVideoIndirectGmv'] },
  { label: '财务', keys: ['gmvWithTax', 'tax', 'shippingFees'] },
  { label: '流量', keys: ['productImpressions', 'uniqueProductImpressions', 'productClicks', 'uniqueClicks'] },
];

export const EMPTY_METRIC_ROW: MetricRow = {
  gmv: 0, orders: 0, customers: 0, itemsSold: 0,
  itemsCanceledReturned: 0, itemsRefunded: 0, aov: 0, skuOrders: 0,
  gmvWithCoFunding: 0, liveAttributedGmv: 0, creatorLiveAttributedGmv: 0,
  creatorLiveGmv: 0, creatorLiveIndirectGmv: 0, linkedAccountLiveAttributedGmv: 0,
  sellerLiveGmv: 0, sellerLiveIndirectGmv: 0, productCardGmv: 0,
  videoAttributedGmv: 0, creatorVideoAttributedGmv: 0, creatorVideoGmv: 0,
  creatorVideoIndirectGmv: 0, linkedAccountVideoAttributedGmv: 0,
  sellerVideoGmv: 0, sellerVideoIndirectGmv: 0, gmvWithTax: 0, tax: 0,
  shippingFees: 0, productImpressions: 0, uniqueProductImpressions: 0,
  productClicks: 0, uniqueClicks: 0,
};
