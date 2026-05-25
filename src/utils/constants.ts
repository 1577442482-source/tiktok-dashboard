import { type MetricKey } from '../types';

export const DEFAULT_ANOMALY_THRESHOLD = 30;

export const CATEGORY_ICONS: Record<string, string> = {
  '核心指标': '📊',
  '退货退款': '↩️',
  'SKU': '📦',
  '直播': '📺',
  '商品卡': '🛒',
  '短视频': '🎬',
  '财务': '💰',
  '流量': '👁️',
};

export const METRIC_FORMAT_TYPE: Record<MetricKey, 'currency' | 'number' | 'percent'> = {
  gmv: 'currency', orders: 'number', customers: 'number', itemsSold: 'number',
  itemsCanceledReturned: 'number', itemsRefunded: 'currency', aov: 'currency',
  skuOrders: 'number', gmvWithCoFunding: 'currency',
  liveAttributedGmv: 'currency', creatorLiveAttributedGmv: 'currency',
  creatorLiveGmv: 'currency', creatorLiveIndirectGmv: 'currency',
  linkedAccountLiveAttributedGmv: 'currency', sellerLiveGmv: 'currency',
  sellerLiveIndirectGmv: 'currency', productCardGmv: 'currency',
  videoAttributedGmv: 'currency', creatorVideoAttributedGmv: 'currency',
  creatorVideoGmv: 'currency', creatorVideoIndirectGmv: 'currency',
  linkedAccountVideoAttributedGmv: 'currency', sellerVideoGmv: 'currency',
  sellerVideoIndirectGmv: 'currency', gmvWithTax: 'currency', tax: 'currency',
  shippingFees: 'currency', productImpressions: 'number',
  uniqueProductImpressions: 'number', productClicks: 'number', uniqueClicks: 'number',
};
