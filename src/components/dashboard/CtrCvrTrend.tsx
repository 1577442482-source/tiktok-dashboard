import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface CtrCvrTrendProps {
  data: { label: string; CTR: number; CVR: number }[];
  title: string;
}

export default function CtrCvrTrend({ data, title }: CtrCvrTrendProps) {

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-base font-semibold text-slate-700 mb-4">{title}</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              stroke="#6366f1"
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#10b981"
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Tooltip
              formatter={(value: unknown) => [`${Number(value).toFixed(2)}%`, '']}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="CTR"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
              name="CTR"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="CVR"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ fill: '#10b981', r: 4 }}
              name="CVR"
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-slate-400 text-center py-16">暂无该类型周期数据</p>
      )}
    </div>
  );
}
