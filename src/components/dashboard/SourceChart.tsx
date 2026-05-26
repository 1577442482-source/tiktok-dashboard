import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { DataPeriod } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SourceChartProps {
  period: DataPeriod;
}

const COLORS = ['#10b981', '#10b981', '#f59e0b'];

export default function SourceChart({ period }: SourceChartProps) {
  const liveGmv = period.overview.liveAttributedGmv;
  const productCardGmv = period.overview.productCardGmv;
  const videoGmv = period.overview.videoAttributedGmv;
  const total = liveGmv + productCardGmv + videoGmv;

  if (total === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-400 mb-4">GMV 来源拆解</h3>
        <p className="text-base text-slate-400 text-center py-12">暂无来源数据</p>
      </div>
    );
  }

  const data = [
    { name: '直播', value: liveGmv },
    { name: '商品卡', value: productCardGmv },
    { name: '短视频', value: videoGmv },
  ];

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-400 mb-4">GMV 来源拆解</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value)), '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
