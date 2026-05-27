import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { DataPeriod } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface TrendChartProps {
  periods: DataPeriod[];
  metricKey: 'gmv' | 'orders' | 'customers' | 'itemsSold';
  title: string;
}

export default function TrendChart({ periods, metricKey, title }: TrendChartProps) {
  const data = [...periods]
    .reverse()
    .map((p) => ({
      label: `${p.analysisStart.substring(5)}`,
      value: p.overview[metricKey],
    }));

  const isCurrency = metricKey === 'gmv';

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-base font-semibold text-slate-400 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#64748b" />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
            formatter={(value: unknown) => {
              const v = Number(value);
              return [isCurrency ? formatCurrency(v) : formatNumber(v), title];
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
