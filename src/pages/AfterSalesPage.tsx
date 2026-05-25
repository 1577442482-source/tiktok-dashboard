import { useEffect, useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { getAllRefundDatasets } from '../services/refundStorage';
import { computeRefundStats } from '../services/refundStats';
import type { RefundDataset } from '../types/refund';
import { useDataStore } from '../store/dataStore';
import type { RefundStats } from '../types/refund';
import { formatCurrency, formatNumber } from '../utils/formatters';

const REASON_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#64748b'];
const STATUS_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#94a3b8'];

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

  if (loading) return <div className="text-slate-400 text-base py-20 text-center">加载中...</div>;

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">数据加载失败</h2>
        <p className="text-base text-slate-500 mb-4">{error}</p>
        <button
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-indigo-700"
          onClick={() => window.location.reload()}
        >
          刷新页面
        </button>
      </div>
    );
  }

  if (refundData.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔧</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">暂无售后数据</h2>
        <p className="text-base text-slate-500">请在「上传数据」页面导入售后/退货 Excel 文件</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">售后数据分析</h2>
          <p className="text-base text-slate-500 mt-1">
            {selected ? `${selected.fileName} (${selected.rows.length} 条记录)` : '选择数据集'}
          </p>
        </div>
        <select
          className="border border-slate-200 rounded-lg px-4 py-2.5 text-base bg-white"
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
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiBox label="退货申请数" value={formatNumber(stats.totalRefundRequests)} sub={`退款率 ${stats.refundRate.toFixed(1)}%`} />
            <KpiBox label="退货金额" value={formatCurrency(stats.totalRefundAmount)} sub={`均价 ${formatCurrency(stats.avgRefundAmount)}`} />
            <KpiBox label="已完成退货" value={formatNumber(stats.completedReturns)} sub={`拒绝 ${stats.rejectedReturns} 单`} color="emerald" />
            <KpiBox label="退货数量" value={formatNumber(stats.totalReturnQuantity)} sub={`涉及 ${stats.productRefunds.length} 款产品`} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Return reason pie chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-700 mb-4">退货原因分布</h3>
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
                      formatter={(value: string) =>
                        value.length > 18 ? value.substring(0, 18) + '...' : value
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-16">暂无数据</p>
              )}
            </div>

            {/* Return status pie chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-700 mb-4">退货状态分布</h3>
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
                      formatter={(value: unknown, name: unknown) => {
                        const total = stats.statusDistribution.reduce((s, r) => s + r.count, 0);
                        const pct = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
                        return [`${value} 单 (${pct}%)`, name as string];
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-16">暂无数据</p>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Daily refund trend */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-700 mb-4">日度退货趋势</h3>
              {stats.dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={stats.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8"
                      interval={Math.floor(stats.dailyTrend.length / 8)}
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" yAxisId="left" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value: unknown) => [formatNumber(Number(value)), '']}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} name="退货数" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} name="金额" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-16">暂无数据</p>
              )}
            </div>

            {/* Top 10 products with most refunds */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-700 mb-4">产品退货 TOP 10</h3>
              {stats.productRefunds.length > 0 ? (
                <ResponsiveContainer width="100%" height={290}>
                  <BarChart data={stats.productRefunds} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      type="category" dataKey="productName" tick={{ fontSize: 10 }} stroke="#94a3b8"
                      width={140}
                      tickFormatter={(v: string) => v.length > 20 ? v.substring(0, 20) + '...' : v}
                    />
                    <Tooltip
                      formatter={(value: unknown, _: unknown, entry: unknown) => {
                        const payload = (entry as { payload?: { productName?: string; amount?: number } })?.payload;
                        return [value + ' 单', payload ? formatCurrency(payload.amount || 0) : ''];
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-16">暂无数据</p>
              )}
            </div>
          </div>

          {/* Return type distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-700 mb-4">退货类型</h3>
            {stats.returnTypeDistribution.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {stats.returnTypeDistribution.map((t) => (
                  <div key={t.type} className="bg-slate-50 rounded-xl px-5 py-3 border border-slate-200">
                    <div className="text-sm text-slate-500">{t.type || '未标注'}</div>
                    <div className="text-2xl font-bold text-slate-800">{t.count}</div>
                    <div className="text-xs text-slate-400">
                      {((t.count / stats.totalRefundRequests) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-12">暂无数据</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiBox({ label, value, sub, color = 'default' }: { label: string; value: string; sub: string; color?: string }) {
  const accent = color === 'emerald' ? 'border-emerald-200 bg-emerald-50/50' : '';
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${accent}`}>
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="text-[28px] font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{sub}</div>
    </div>
  );
}
