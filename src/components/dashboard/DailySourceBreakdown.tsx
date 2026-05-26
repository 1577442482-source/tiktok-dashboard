import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { DailyRow } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DailySourceBreakdownProps {
  dailyData: DailyRow[];
}

export default function DailySourceBreakdown({ dailyData }: DailySourceBreakdownProps) {
  const chartData = dailyData.map((d) => ({
    date: d.date.substring(5),
    '商品卡': d.productCardGmv,
    '短视频': d.videoAttributedGmv,
    '直播': d.liveAttributedGmv,
  }));

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-base font-semibold text-slate-400 mb-4">GMV 日度来源拆解</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="#64748b"
            interval={Math.floor(chartData.length / 8)}
          />
          <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
          <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value)), '']} />
          <Legend />
          <Area
            type="monotone"
            dataKey="商品卡"
            stackId="1"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="短视频"
            stackId="1"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="直播"
            stackId="1"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
