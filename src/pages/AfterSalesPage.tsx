import { useEffect, useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { Wrench, AlertTriangle } from 'lucide-react';
import { getAllRefundDatasets } from '../services/refundStorage';
import { computeRefundStats } from '../services/refundStats';
import type { RefundDataset } from '../types/refund';
import { useDataStore } from '../store/dataStore';
import type { RefundStats } from '../types/refund';
import PageTransition from '../components/ui/PageTransition';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrency, formatNumber } from '../utils/formatters';

const REASON_COLORS = ['#34d399', '#14b8a6', '#fbbf24', '#f87171', '#2dd4bf', '#f472b6', '#22d3ee', '#a3e635', '#fb923c', '#64748b'];
const STATUS_COLORS = ['#34d399', '#f87171', '#fbbf24', '#14b8a6', '#94a3b8'];

export default function AfterSalesPage() {
  const { periods, loadPeriods } = useDataStore();
  const [refundData, setRefundData] = useState<RefundDataset[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPeriods();
    getAllRefundDatasets()
      .then((ds) => {
        setRefundData(ds);
        if (ds.length > 0) setSelectedId(ds[0].id);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load refund data:', e);
        setError((e as Error).message);
        setLoading(false);
      });
  }, []);

  const selected = useMemo(() => refundData.find((d) => d.id === selectedId), [refundData, selectedId]);

  const stats = useMemo<RefundStats | null>(() => {
    if (!selected) return null;
    return computeRefundStats(selected.rows, periods);
  }, [selected, periods]);

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="inline-flex p-5 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle size={40} strokeWidth={1.5} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">数据加载失败</h2>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all btn-press"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
        </div>
      </PageTransition>
    );
  }

  if (refundData.length === 0) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="inline-flex p-5 bg-white/5 rounded-full mb-5">
            <Wrench size={48} strokeWidth={1.5} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">暂无售后数据</h2>
          <p className="text-base text-slate-400">请在「上传数据」页面导入售后/退货 Excel 文件</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">售后数据分析</h2>
            <p className="text-sm text-slate-400 mt-1">
              {selected ? `${selected.fileName} (${selected.rows.length} 条记录)` : '选择数据集'}
            </p>
          </div>
          <select
            className="border border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {refundData.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fileName} ({d.dateRange.start} ~ {d.dateRange.end})
              </option>
            ))}
          </select>
        </div>

        {!stats ? (
          <div className="text-slate-400">无法计算统计数据</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
              <KpiBox label="退货申请数" value={formatNumber(stats.totalRefundRequests)} sub={`退款率 ${stats.refundRate.toFixed(1)}%`} />
              <KpiBox label="退货金额" value={formatCurrency(stats.totalRefundAmount)} sub={`均价 ${formatCurrency(stats.avgRefundAmount)}`} />
              <KpiBox label="已完成退货" value={formatNumber(stats.completedReturns)} sub={`拒绝 ${stats.rejectedReturns} 单`} color="emerald" />
              <KpiBox label="退货数量" value={formatNumber(stats.totalReturnQuantity)} sub={`涉及 ${stats.productRefunds.length} 款产品`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="glass-card rounded-xl p-5 card-hover">
                <h3 className="text-base font-semibold text-slate-200 mb-4">退货原因分布</h3>
                {stats.reasonDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 10, bottom: 10 }}>
                      <Pie
                        data={stats.reasonDistribution}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={95}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="reason"
                      >
                        {stats.reasonDistribution.map((_, i) => (
                          <Cell key={i} fill={REASON_COLORS[i % REASON_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                        formatter={(value: unknown, name: unknown) => {
                          const reasonEntry = stats.reasonDistribution.find((r) => r.reason === name);
                          const total = stats.reasonDistribution.reduce((s, r) => s + r.count, 0);
                          const pct = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
                          return [
                            `${value} 单 (${pct}%) / ${formatCurrency(reasonEntry?.amount || 0)}`,
                            name as string,
                          ];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ color: '#e8edf2' }}
                        formatter={(value: string) =>
                          value.length > 18 ? value.substring(0, 18) + '...' : value
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-center py-16 text-sm">暂无数据</p>
                )}
              </div>

              <div className="glass-card rounded-xl p-5 card-hover">
                <h3 className="text-base font-semibold text-slate-200 mb-4">退货状态分布</h3>
                {stats.statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 10, bottom: 10 }}>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={95}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="status"
                      >
                        {stats.statusDistribution.map((_, i) => (
                          <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                        formatter={(value: unknown, name: unknown) => {
                          const total = stats.statusDistribution.reduce((s, r) => s + r.count, 0);
                          const pct = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
                          return [`${value} 单 (${pct}%)`, name as string];
                        }}
                      />
                      <Legend wrapperStyle={{ color: '#e8edf2' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-center py-16 text-sm">暂无数据</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="glass-card rounded-xl p-5 card-hover">
                <h3 className="text-base font-semibold text-slate-200 mb-4">日度退货趋势</h3>
                {stats.dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={stats.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569"
                        interval={Math.floor(stats.dailyTrend.length / 8)}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" yAxisId="left" />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" yAxisId="right" orientation="right" />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                        formatter={(value: unknown) => [formatNumber(Number(value)), '']}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="count" stroke="#34d399" strokeWidth={2} name="退货数" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#f87171" strokeWidth={2} name="金额" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-center py-16 text-sm">暂无数据</p>
                )}
              </div>

              <div className="glass-card rounded-xl p-5 card-hover">
                <h3 className="text-base font-semibold text-slate-200 mb-4">产品退货 TOP 10</h3>
                {stats.productRefunds.length > 0 ? (
                  <ResponsiveContainer width="100%" height={290}>
                    <BarChart data={stats.productRefunds} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
                      <YAxis
                        type="category" dataKey="productName" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569"
                        width={140}
                        tickFormatter={(v: string) => v.length > 20 ? v.substring(0, 20) + '...' : v}
                      />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                        formatter={(value: unknown, _: unknown, entry: unknown) => {
                          const payload = (entry as { payload?: { productName?: string; amount?: number } })?.payload;
                          return [value + ' 单', payload ? formatCurrency(payload.amount || 0) : ''];
                        }}
                      />
                      <Bar dataKey="count" fill="#34d399" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-center py-16 text-sm">暂无数据</p>
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 card-hover">
              <h3 className="text-base font-semibold text-slate-200 mb-4">退货类型</h3>
              {stats.returnTypeDistribution.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {stats.returnTypeDistribution.map((t) => (
                    <div key={t.type} className="bg-white/5 rounded-xl px-5 py-3 border border-white/5 hover:border-slate-600 transition-colors">
                      <div className="text-sm text-slate-400">{t.type || '未标注'}</div>
                      <div className="text-2xl font-bold text-slate-200">{t.count}</div>
                      <div className="text-xs text-slate-400">
                        {((t.count / stats.totalRefundRequests) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-12 text-sm">暂无数据</p>
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}

function KpiBox({ label, value, sub, color = 'default' }: { label: string; value: string; sub: string; color?: string }) {
  const accent = color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/5' : '';
  return (
    <div className={`glass-card rounded-xl p-5 card-hover ${accent} animate-fade-in-up`}>
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-[28px] font-bold text-white tracking-tight">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{sub}</div>
    </div>
  );
}
