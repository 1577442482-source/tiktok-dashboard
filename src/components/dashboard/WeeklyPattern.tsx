import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { DailyRow } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface WeeklyPatternProps {
  dailyData: DailyRow[];
}

export default function WeeklyPattern({ dailyData }: WeeklyPatternProps) {
  const { chartData, bestDay, totalGmv, avgGmv } = useMemo(() => {
    const sorted = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
    const chartData = sorted.map(d => ({
      date: d.date.substring(5), // "MM-DD"
      fullDate: d.date,
      gmv: d.gmv,
      orders: d.orders,
    }));

    let best = chartData[0];
    let total = 0;
    for (const d of chartData) {
      total += d.gmv;
      if (d.gmv > (best?.gmv || 0)) best = d;
    }

    return {
      chartData,
      bestDay: best,
      totalGmv: total,
      avgGmv: chartData.length > 0 ? total / chartData.length : 0,
    };
  }, [dailyData]);

  if (chartData.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5 flex items-center justify-center h-64 text-slate-400">
        暂无周期数据
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-base font-semibold text-slate-400 mb-1">周期内每日销售额</h3>
      <p className="text-xs text-slate-400 mb-4">
        {chartData[0]?.date} ~ {chartData[chartData.length - 1]?.date} · {chartData.length}天
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            stroke="#64748b"
            interval={Math.max(0, Math.floor(chartData.length / 10) - 1)}
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            labelFormatter={(label) => `日期: ${label}`}
            formatter={(value: unknown) => [formatCurrency(Number(value)), 'GMV']}
          />
          <Bar dataKey="gmv" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.gmv === (bestDay?.gmv || 0) ? '#10b981' : '#6ee7b7'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-xs text-slate-400">总 GMV</div>
          <div className="text-sm font-bold text-slate-200">{formatCurrency(totalGmv)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-xs text-slate-400">日均 GMV</div>
          <div className="text-sm font-bold text-slate-200">{formatCurrency(avgGmv)}</div>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-2">
          <div className="text-xs text-emerald-400">最高日</div>
          <div className="text-sm font-bold text-emerald-300">{bestDay?.date || '-'}</div>
          <div className="text-xs text-emerald-500">{bestDay ? formatCurrency(bestDay.gmv) : ''}</div>
        </div>
      </div>
    </div>
  );
}
