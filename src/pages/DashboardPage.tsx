import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, MousePointerClick, Target, Tag, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import KpiCard from '../components/dashboard/KpiCard';
import TrendChart from '../components/dashboard/TrendChart';
import FunnelChart from '../components/dashboard/FunnelChart';
import CtrCvrTrend from '../components/dashboard/CtrCvrTrend';
import SmartAlertPanel from '../components/dashboard/SmartAlertPanel';
import PageTransition from '../components/ui/PageTransition';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { EMPTY_METRIC_ROW, type MetricRow, METRIC_KEYS } from '../types';
import { getAllDailyData, aggregateDailyToWeeks } from '../services/weekAggregator';

function sumPeriods(periods: { overview: MetricRow }[]): MetricRow {
  const total = { ...EMPTY_METRIC_ROW };
  for (const p of periods) {
    for (const key of METRIC_KEYS) {
      if (key === 'aov') continue;
      (total[key] as number) += (p.overview[key] as number);
    }
  }
  if (total.orders > 0) {
    total.aov = total.gmv / total.orders;
  }
  return total;
}

export default function DashboardPage() {
  const { periods, loading, loadPeriods } = useDataStore();

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const allDaily = useMemo(() => getAllDailyData(periods), [periods]);

  const aggregate = useMemo(() => {
    if (periods.length === 0) return null;
    const total = sumPeriods(periods);
    const earliestStart = periods[periods.length - 1]?.analysisStart || '';
    const latestEnd = periods[0]?.analysisEnd || '';
    const byMonth = new Map<string, { gmv: number; orders: number; dates: Set<string> }>();
    for (const d of allDaily) {
      const mk = d.date.substring(0, 7);
      if (!byMonth.has(mk)) byMonth.set(mk, { gmv: 0, orders: 0, dates: new Set() });
      const m = byMonth.get(mk)!;
      m.gmv += d.gmv;
      m.orders += d.orders;
      m.dates.add(d.date.substring(8));
    }

    let completeGmv = 0;
    let completeOrders = 0;
    let completeCount = 0;
    const completeMonthKeys: string[] = [];

    for (const [mk, m] of byMonth) {
      const [y, mon] = mk.split('-').map(Number);
      const lastDay = new Date(y, mon, 0).getDate();
      let coveredDays = 0;
      for (let day = 1; day <= lastDay; day++) {
        if (m.dates.has(String(day).padStart(2, '0'))) coveredDays++;
      }
      if (coveredDays === lastDay) {
        completeGmv += m.gmv;
        completeOrders += m.orders;
        completeCount++;
        completeMonthKeys.push(mk);
      }
    }

    completeCount = Math.max(completeCount, 1);

    const end = new Date(latestEnd);
    const endLastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    const hasIncomplete = end.getDate() < endLastDay || (allDaily.length > 0 && completeCount < byMonth.size);
    const monthNote = hasIncomplete ? `含不完整月份，月均仅统计${completeCount}个完整月数据` : '';

    return {
      total,
      earliestStart,
      latestEnd,
      periodCount: periods.length,
      monthGmv: completeGmv / completeCount,
      monthOrders: completeOrders / completeCount,
      completeMonthKeys,
      monthNote,
    };
  }, [periods]);

  const monthlyCtrCvrData = useMemo(() => {
    const keys = aggregate?.completeMonthKeys ?? [];
    const byMonth = new Map<string, { impressions: number; clicks: number; orders: number }>();
    for (const d of allDaily) {
      const mk = d.date.substring(0, 7);
      if (!keys.includes(mk)) continue;
      if (!byMonth.has(mk)) byMonth.set(mk, { impressions: 0, clicks: 0, orders: 0 });
      const m = byMonth.get(mk)!;
      m.impressions += d.productImpressions;
      m.clicks += d.productClicks;
      m.orders += d.orders;
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mk, m]) => ({
        label: mk.substring(5),
        CTR: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
        CVR: m.clicks > 0 ? (m.orders / m.clicks) * 100 : 0,
      }));
  }, [periods, aggregate]);

  const weeklyCtrCvrData = useMemo(() => {
    const weeks = aggregateDailyToWeeks(allDaily);
    return weeks.map((w) => ({
      label: w.weekLabel.replace('第', '').replace('周', ''),
      CTR: w.overview.productImpressions > 0 ? (w.overview.productClicks / w.overview.productImpressions) * 100 : 0,
      CVR: w.overview.productClicks > 0 ? (w.overview.orders / w.overview.productClicks) * 100 : 0,
    }));
  }, [periods]);

  if (loading) {
    return (
      <PageTransition>
        <DashboardSkeleton />
      </PageTransition>
    );
  }

  if (periods.length === 0) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="inline-flex p-5 bg-white/5 rounded-full mb-5">
            <BarChart3 size={48} strokeWidth={1.5} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">暂无数据</h2>
          <p className="text-base text-slate-400 mb-6">上传 TikTok 后台导出的 Excel 数据，开始追踪运营表现</p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-emerald-700 transition-all btn-press shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            上传数据
          </Link>
        </div>
      </PageTransition>
    );
  }

  const { total, earliestStart, latestEnd, periodCount, monthGmv, monthOrders, monthNote } = aggregate!;

  const ctr = total.productImpressions > 0 ? (total.productClicks / total.productImpressions) * 100 : 0;
  const cvr = total.productClicks > 0 ? (total.orders / total.productClicks) * 100 : 0;

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold gradient-text">数据总览</h2>
            <p className="text-sm text-slate-400 mt-1">
              {earliestStart} ~ {latestEnd} · {periodCount} 个周期 · 累计数据
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          <KpiCard title="累计 GMV" value={formatCurrency(total.gmv)} numericValue={total.gmv} icon={DollarSign} accentColor="from-emerald-400 to-emerald-500" />
          <KpiCard title="累计 Orders" value={formatNumber(total.orders)} numericValue={total.orders} icon={ShoppingCart} accentColor="from-teal-400 to-teal-500" />
          <KpiCard title="整体 CTR" value={`${ctr.toFixed(2)}%`} numericValue={ctr} icon={MousePointerClick} accentColor="from-amber-400 to-amber-500" />
          <KpiCard title="整体 CVR" value={`${cvr.toFixed(2)}%`} numericValue={cvr} icon={Target} accentColor="from-cyan-400 to-cyan-500" />
          <KpiCard title="整体 AOV" value={formatCurrency(total.aov)} numericValue={total.aov} icon={Tag} accentColor="from-emerald-300 to-teal-400" />
          <KpiCard title="累计 Customers" value={formatNumber(total.customers)} numericValue={total.customers} icon={Users} accentColor="from-teal-300 to-cyan-400" />
        </div>

        {/* Per-period averages */}
        {monthNote && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-amber-300 animate-scale-in">
            {monthNote}
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <MiniStat label="月均 GMV" value={formatCurrency(monthGmv)} />
          <MiniStat label="月均 Orders" value={formatNumber(monthOrders)} />
          <MiniStat label="累计售出件数" value={formatNumber(total.itemsSold)} />
          <MiniStat label="累计退款金额" value={formatCurrency(total.itemsRefunded)} />
        </div>

        {/* Smart Alert Panel */}
        <SmartAlertPanel dailyData={allDaily} />

        {/* Trend charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TrendChart periods={periods} metricKey="gmv" title="GMV 趋势" />
          <TrendChart periods={periods} metricKey="orders" title="Orders 趋势" />
        </div>

        {/* CTR & CVR trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CtrCvrTrend data={monthlyCtrCvrData} title="月度 CTR & CVR 趋势" />
          <CtrCvrTrend data={weeklyCtrCvrData} title="周度 CTR & CVR 趋势（日数据按周聚合）" />
        </div>

        {/* Source & Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card rounded-xl p-5 card-hover">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} strokeWidth={1.75} className="text-slate-400" />
              <h3 className="text-base font-semibold text-slate-200">GMV 来源拆解（累计）</h3>
            </div>
            <AggregateSourceChart total={total} />
          </div>
          <FunnelChart
            impressions={total.productImpressions}
            clicks={total.productClicks}
            orders={total.orders}
            gmv={total.gmv}
          />
        </div>

        {/* Per-period summary table */}
        <div className="glass-card rounded-xl overflow-hidden card-hover">
          <div className="px-5 py-4 bg-white/5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} strokeWidth={1.75} className="text-slate-400" />
              <h3 className="text-base font-semibold text-slate-200">各周期概况</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 font-medium text-slate-400">周期</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-400">GMV</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-400">Orders</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-400">AOV</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-400">Customers</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-400">GMV环比</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {periods.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors duration-150">
                    <td className="px-5 py-3 font-medium text-slate-200">
                      {p.analysisStart} ~ {p.analysisEnd}
                      <span className="text-xs text-slate-400 ml-2">{p.type === 'monthly' ? '月' : '周'}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-200 tabular-nums">{formatCurrency(p.overview.gmv)}</td>
                    <td className="px-5 py-3 text-right text-slate-400 tabular-nums">{formatNumber(p.overview.orders)}</td>
                    <td className="px-5 py-3 text-right text-slate-400 tabular-nums">{formatCurrency(p.overview.aov)}</td>
                    <td className="px-5 py-3 text-right text-slate-400 tabular-nums">{formatNumber(p.overview.customers)}</td>
                    <td className={`px-5 py-3 text-right font-medium tabular-nums ${
                      p.overviewChange.gmv > 0 ? 'text-emerald-400' : p.overviewChange.gmv < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {p.overviewChange.gmv > 0 ? '↑' : p.overviewChange.gmv < 0 ? '↓' : ''}
                      {Math.abs(p.overviewChange.gmv).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-500/5 font-semibold">
                  <td className="px-5 py-3 text-emerald-300">累计</td>
                  <td className="px-5 py-3 text-right text-emerald-300 tabular-nums">{formatCurrency(total.gmv)}</td>
                  <td className="px-5 py-3 text-right text-emerald-300 tabular-nums">{formatNumber(total.orders)}</td>
                  <td className="px-5 py-3 text-right text-emerald-300 tabular-nums">{formatCurrency(total.aov)}</td>
                  <td className="px-5 py-3 text-right text-emerald-300 tabular-nums">{formatNumber(total.customers)}</td>
                  <td className="px-5 py-3 text-right text-emerald-300">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-5 card-hover">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-xl font-bold text-slate-200 mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function AggregateSourceChart({ total }: { total: MetricRow }) {
  const liveGmv = total.liveAttributedGmv;
  const productCardGmv = total.productCardGmv;
  const videoGmv = total.videoAttributedGmv;
  const sum = liveGmv + productCardGmv + videoGmv;

  if (sum === 0) {
    return <p className="text-sm text-slate-400 text-center py-12">暂无来源数据</p>;
  }

  const items = [
    { label: '直播', value: liveGmv, pct: (liveGmv / sum) * 100, color: 'bg-emerald-500' },
    { label: '商品卡', value: productCardGmv, pct: (productCardGmv / sum) * 100, color: 'bg-emerald-500' },
    { label: '短视频', value: videoGmv, pct: (videoGmv / sum) * 100, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">{item.label}</span>
            <span className="font-medium text-slate-200">
              {formatCurrency(item.value)} ({item.pct.toFixed(1)}%)
            </span>
          </div>
          <div className="h-6 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
              style={{ width: `${Math.max(item.pct, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
