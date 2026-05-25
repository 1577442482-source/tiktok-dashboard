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
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-base font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            formatter={(value: unknown) => {
              const v = Number(value);
              return [isCurrency ? formatCurrency(v) : formatNumber(v), title];
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
