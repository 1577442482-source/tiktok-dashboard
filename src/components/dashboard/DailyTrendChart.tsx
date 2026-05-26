import {
  Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart,
} from 'recharts';
import type { DailyRow } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useState } from 'react';

interface DailyTrendChartProps {
  dailyData: DailyRow[];
  title: string;
}

const METRICS = [
  { key: 'gmv', label: 'GMV', color: '#10b981', isCurrency: true },
  { key: 'orders', label: 'Orders', color: '#10b981', isCurrency: false },
  { key: 'aov', label: 'AOV', color: '#f59e0b', isCurrency: true },
  { key: 'itemsSold', label: '售出件数', color: '#ec4899', isCurrency: false },
];

export default function DailyTrendChart({ dailyData, title }: DailyTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState('gmv');

  const chartData = dailyData.map((d) => ({
    date: d.date.substring(5),
    gmv: d.gmv,
    orders: d.orders,
    aov: d.aov,
    itemsSold: d.itemsSold,
  }));

  const active = METRICS.find((m) => m.key === activeMetric)!;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-400">{title}</h3>
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all btn-press ${
                activeMetric === m.key
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-400'
              }`}
              onClick={() => setActiveMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" interval={Math.floor(chartData.length / 10)} />
          <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
          <Tooltip
            formatter={(value: unknown) => {
              const v = Number(value);
              return [active.isCurrency ? formatCurrency(v) : formatNumber(v), active.label];
            }}
          />
          <Bar dataKey={active.key} fill={active.color} radius={[4, 4, 0, 0]} opacity={0.85} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
