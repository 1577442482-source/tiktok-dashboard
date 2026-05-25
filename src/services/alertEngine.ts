import type { DailyRow } from '../types';
import { findActiveCampaigns } from './campaignCalendar';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertMetric = 'gmv' | 'orders' | 'cvr' | 'ctr' | 'refund' | 'aov';

export interface SmartAlert {
  id: string;
  severity: AlertSeverity;
  metric: AlertMetric;
  date: string;
  title: string;
  message: string;
  currentValue: number;
  baselineValue: number;
  deviationPercent: number;
}

interface DailyMetrics {
  date: string;
  gmv: number;
  orders: number;
  impressions: number;
  clicks: number;
  uniqueClicks: number;
  itemsSold: number;
  itemsRefunded: number;
  aov: number;
  ctr: number;
  uniqueCtr: number;
  cvr: number;
  grossCvr: number;
  refundRate: number;
}

function toDailyMetrics(d: DailyRow): DailyMetrics {
  const impressions = d.productImpressions || 0;
  const clicks = d.productClicks || 0;
  const uniqueClicks = d.uniqueClicks || 0;
  const itemsSold = d.itemsSold || d.orders || 0;
  const itemsRefunded = d.itemsRefunded || 0;

  return {
    date: d.date,
    gmv: d.gmv || 0,
    orders: d.orders || 0,
    impressions,
    clicks,
    uniqueClicks,
    itemsSold,
    itemsRefunded,
    aov: d.orders > 0 ? d.gmv / d.orders : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    uniqueCtr: d.uniqueProductImpressions > 0 ? (uniqueClicks / d.uniqueProductImpressions) * 100 : 0,
    cvr: clicks > 0 ? (d.orders / clicks) * 100 : 0,
    grossCvr: impressions > 0 ? (d.orders / impressions) * 100 : 0,
    refundRate: itemsSold > 0 ? (itemsRefunded / itemsSold) * 100 : 0,
  };
}

/** 7-day simple moving average */
function calcMA(data: number[], window = 7): number {
  if (data.length === 0) return 0;
  const slice = data.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function alertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatPct(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

export function detectAlerts(dailyData: DailyRow[]): SmartAlert[] {
  if (dailyData.length < 5) return [];

  const sorted = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
  const metrics = sorted.map(toDailyMetrics);
  const alerts: SmartAlert[] = [];

  // --- Moving averages (last 7 active days with >0 GMV) ---
  const activeMetrics = metrics.filter((m) => m.gmv > 0);
  const gmvs = activeMetrics.map((m) => m.gmv);
  const cvrs = activeMetrics.map((m) => m.cvr);
  const ctrs = activeMetrics.map((m) => m.ctr);
  const refundRates = activeMetrics.map((m) => m.refundRate);
  const aovs = activeMetrics.map((m) => m.aov);
  const orders = activeMetrics.map((m) => m.orders);

  const maGmv = calcMA(gmvs);
  const maCvr = calcMA(cvrs);
  const maCtr = calcMA(ctrs);
  const maRefund = calcMA(refundRates);
  const maAov = calcMA(aovs);
  const maOrders = calcMA(orders);

  // Only analyze the last 3 days (avoid stale alerts)
  const recentDays = metrics.slice(-3);

  for (const m of recentDays) {
    if (m.gmv === 0) {
      alerts.push({
        id: alertId(),
        severity: 'critical',
        metric: 'gmv',
        date: m.date,
        title: 'GMV归零',
        message: `${m.date} GMV为0，建议立即检查店铺状态、账号是否被限流或商品是否被下架`,
        currentValue: 0,
        baselineValue: maGmv,
        deviationPercent: -100,
      });
      continue;
    }

    const gmvDev = maGmv > 0 ? ((m.gmv - maGmv) / maGmv) * 100 : 0;
    const cvrDev = maCvr > 0 ? ((m.cvr - maCvr) / maCvr) * 100 : 0;
    const ctrDev = maCtr > 0 ? ((m.ctr - maCtr) / maCtr) * 100 : 0;
    const refundDev = maRefund > 0 ? ((m.refundRate - maRefund) / maRefund) * 100 : 0;
    const aovDev = maAov > 0 ? ((m.aov - maAov) / maAov) * 100 : 0;
    const ordersDev = maOrders > 0 ? ((m.orders - maOrders) / maOrders) * 100 : 0;

    const activeCampaigns = findActiveCampaigns(m.date);
    const inCampaign = activeCampaigns.length > 0;
    const campaignNames = activeCampaigns.map((c) => c.name).join('、');

    // --- GMV alerts ---
    if (gmvDev < -35) {
      alerts.push({
        id: alertId(),
        severity: 'critical',
        metric: 'gmv',
        date: m.date,
        title: `GMV骤降 ${formatPct(gmvDev)}`,
        message: inCampaign
          ? `活动「${campaignNames}」期间GMV大幅低于近期均值，建议检查广告消耗、达人排期或竞品促销动作`
          : `GMV较7日均值下降${formatPct(Math.abs(gmvDev))}，可能受工作日或竞品影响，建议检查流量来源变化`,
        currentValue: m.gmv,
        baselineValue: maGmv,
        deviationPercent: gmvDev,
      });
    } else if (gmvDev < -15) {
      alerts.push({
        id: alertId(),
        severity: 'warning',
        metric: 'gmv',
        date: m.date,
        title: `GMV下降 ${formatPct(gmvDev)}`,
        message: inCampaign
          ? `活动期内GMV低于均值，关注转化漏斗是否正常`
          : `GMV有所下滑，建议关注后续走势`,
        currentValue: m.gmv,
        baselineValue: maGmv,
        deviationPercent: gmvDev,
      });
    } else if (gmvDev > 60) {
      alerts.push({
        id: alertId(),
        severity: 'info',
        metric: 'gmv',
        date: m.date,
        title: `GMV暴涨 ${formatPct(gmvDev)}`,
        message: `GMV显著高于近期均值${inCampaign ? `，活动「${campaignNames}」效果突出` : '，建议分析爆量原因并尝试复制'} `,
        currentValue: m.gmv,
        baselineValue: maGmv,
        deviationPercent: gmvDev,
      });
    }

    // --- CVR alerts ---
    if (m.cvr < 1.5 && m.clicks >= 10) {
      alerts.push({
        id: alertId(),
        severity: 'critical',
        metric: 'cvr',
        date: m.date,
        title: `CVR极低 (${m.cvr.toFixed(2)}%)`,
        message: m.ctr >= 1
          ? 'CTR正常但CVR极低，流量进来了但没转化，建议检查商品详情页、价格竞争力或评价区'
          : 'CTR和CVR双低，流量质量可能存在问题，建议检查投放人群定向',
        currentValue: m.cvr,
        baselineValue: maCvr,
        deviationPercent: cvrDev,
      });
    } else if (m.cvr < 2.5 && m.clicks >= 10) {
      alerts.push({
        id: alertId(),
        severity: 'warning',
        metric: 'cvr',
        date: m.date,
        title: `CVR偏低 (${m.cvr.toFixed(2)}%)`,
        message: `转化率低于健康水平，建议关注竞品价格调整或优化主图/视频素材`,
        currentValue: m.cvr,
        baselineValue: maCvr,
        deviationPercent: cvrDev,
      });
    } else if (cvrDev > 50 && m.cvr > 3) {
      alerts.push({
        id: alertId(),
        severity: 'info',
        metric: 'cvr',
        date: m.date,
        title: `CVR显著提升 (${m.cvr.toFixed(2)}%)`,
        message: `转化率较均值提升${formatPct(cvrDev)}${inCampaign ? `，活动「${campaignNames}」推动转化` : '，可分析当日流量来源和素材变化'}`,
        currentValue: m.cvr,
        baselineValue: maCvr,
        deviationPercent: cvrDev,
      });
    }

    // --- CTR alerts ---
    if (m.ctr < 0.8 && m.impressions >= 100) {
      alerts.push({
        id: alertId(),
        severity: 'critical',
        metric: 'ctr',
        date: m.date,
        title: `CTR极低 (${m.ctr.toFixed(2)}%)`,
        message: '点击率严重偏低，曝光人群可能不精准或素材疲劳，建议更换主图/视频封面、调整投放人群',
        currentValue: m.ctr,
        baselineValue: maCtr,
        deviationPercent: ctrDev,
      });
    } else if (m.ctr < 1.2 && m.impressions >= 100) {
      alerts.push({
        id: alertId(),
        severity: 'warning',
        metric: 'ctr',
        date: m.date,
        title: `CTR偏低 (${m.ctr.toFixed(2)}%)`,
        message: '点击率低于健康水平，建议测试新的商品卡主图或短视频封面',
        currentValue: m.ctr,
        baselineValue: maCtr,
        deviationPercent: ctrDev,
      });
    }

    // --- Refund alerts ---
    if (m.refundRate > 15 && m.itemsSold >= 5) {
      alerts.push({
        id: alertId(),
        severity: 'critical',
        metric: 'refund',
        date: m.date,
        title: `退款率飙升 (${m.refundRate.toFixed(1)}%)`,
        message: '退款率异常偏高，建议检查产品品质、物流时效或是否有虚假宣传导致的客诉',
        currentValue: m.refundRate,
        baselineValue: maRefund,
        deviationPercent: refundDev,
      });
    } else if (m.refundRate > 8 && m.itemsSold >= 5) {
      alerts.push({
        id: alertId(),
        severity: 'warning',
        metric: 'refund',
        date: m.date,
        title: `退款率偏高 (${m.refundRate.toFixed(1)}%)`,
        message: '退款率超过健康水平，建议抽查退货原因',
        currentValue: m.refundRate,
        baselineValue: maRefund,
        deviationPercent: refundDev,
      });
    }

    // --- AOV alerts ---
    if (m.aov > 0 && aovDev < -30 && m.orders >= 3) {
      alerts.push({
        id: alertId(),
        severity: 'warning',
        metric: 'aov',
        date: m.date,
        title: `客单价下滑 ${formatPct(aovDev)}`,
        message: '客单价明显下降，可能低价品占比提升或折扣力度过大，注意GMV和利润率的平衡',
        currentValue: m.aov,
        baselineValue: maAov,
        deviationPercent: aovDev,
      });
    }

    // --- Orders alerts ---
    if (ordersDev < -35 && m.orders >= 1) {
      alerts.push({
        id: alertId(),
        severity: 'warning',
        metric: 'orders',
        date: m.date,
        title: `订单量骤降 ${formatPct(ordersDev)}`,
        message: `订单量较均值大幅下降${gmvDev < -20 ? '，GMV同步下滑，整体流量或转化出现瓶颈' : '，但GMV相对稳定，可能客单价在提升'}`,
        currentValue: m.orders,
        baselineValue: maOrders,
        deviationPercent: ordersDev,
      });
    }

    // --- Cross-metric diagnosis ---
    if (m.ctr > 1.0 && m.cvr < 2.0 && m.clicks >= 10 && m.ctr >= maCtr * 0.9) {
      const existing = alerts.some((a) => a.date === m.date && a.metric === 'cvr');
      if (!existing && m.cvr < maCvr) {
        alerts.push({
          id: alertId(),
          severity: 'warning',
          metric: 'cvr',
          date: m.date,
          title: '流量-转化断层',
          message: `CTR正常(${m.ctr.toFixed(2)}%)但CVR偏低(${m.cvr.toFixed(2)}%)，流量吸引到了点击但转化困难，建议重点优化商品详情页和价格`,
          currentValue: m.cvr,
          baselineValue: maCvr,
          deviationPercent: cvrDev,
        });
      }
    }

    if (m.cvr > 3 && m.ctr < 0.6 && m.impressions >= 100) {
      alerts.push({
        id: alertId(),
        severity: 'info',
        metric: 'ctr',
        date: m.date,
        title: '高转化低曝光',
        message: `CVR表现好(${m.cvr.toFixed(2)}%)但CTR低(${m.ctr.toFixed(2)}%)，产品有竞争力但曝光点击率不足，建议加大素材测试力度`,
        currentValue: m.ctr,
        baselineValue: maCtr,
        deviationPercent: ctrDev,
      });
    }
  }

  // --- Consecutive decline detection ---
  const last7 = metrics.slice(-7);
  if (last7.length >= 5) {
    const gmvTrend = last7.map((m) => m.gmv);
    let consecDown = 0;
    for (let i = 1; i < gmvTrend.length; i++) {
      if (gmvTrend[i] < gmvTrend[i - 1] && gmvTrend[i] > 0) consecDown++;
      else consecDown = 0;
    }
    if (consecDown >= 3) {
      alerts.push({
        id: alertId(),
        severity: 'warning',
        metric: 'gmv',
        date: last7[last7.length - 1].date,
        title: `GMV连续${consecDown + 1}日下滑`,
        message: `从${last7[last7.length - consecDown - 2]?.date || '近期'}起GMV持续走低，建议排查广告计划是否衰退、竞品是否有促销动作`,
        currentValue: last7[last7.length - 1].gmv,
        baselineValue: last7[last7.length - consecDown - 2]?.gmv || 0,
        deviationPercent:
          last7[last7.length - consecDown - 2]?.gmv > 0
            ? ((last7[last7.length - 1].gmv - last7[last7.length - consecDown - 2].gmv) /
                last7[last7.length - consecDown - 2].gmv) *
              100
            : 0,
      });
    }
  }

  // Deduplicate: keep only the most severe alert per metric per day
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  const byKey = new Map<string, SmartAlert>();
  for (const a of alerts) {
    const key = `${a.date}_${a.metric}`;
    const existing = byKey.get(key);
    if (!existing || severityOrder[a.severity] < severityOrder[existing.severity]) {
      byKey.set(key, a);
    }
  }

  return [...byKey.values()].sort((a, b) => {
    if (a.severity !== b.severity) return severityOrder[a.severity] - severityOrder[b.severity];
    return a.date.localeCompare(b.date);
  });
}
