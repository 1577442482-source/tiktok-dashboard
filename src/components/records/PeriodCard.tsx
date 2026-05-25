import type { DataPeriod } from '../../types';
import { formatDateLabel, formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

interface PeriodCardProps {
  period: DataPeriod;
  summary?: string;
  onClick?: () => void;
}

export default function PeriodCard({ period, summary, onClick }: PeriodCardProps) {
  const coreMetrics = [
    { key: 'gmv', label: 'GMV', format: (v: number) => formatCurrency(v) },
    { key: 'orders', label: 'Orders', format: (v: number) => formatNumber(v) },
    { key: 'aov', label: 'AOV', format: (v: number) => formatCurrency(v) },
  ];

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {formatDateLabel(period.analysisStart, period.analysisEnd)}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {period.type === 'monthly' ? '月度' : '周度'} | 对比: {formatDateLabel(period.comparisonStart, period.comparisonEnd)}
          </p>
        </div>
        <span className="text-sm text-slate-400">{new Date(period.uploadedAt).toLocaleDateString('zh-CN')}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {coreMetrics.map((m) => {
          const val = period.overview[m.key as keyof typeof period.overview] as number;
          const change = period.overviewChange[m.key as keyof typeof period.overviewChange] as number;
          const isUp = change > 0;
          const isDown = change < 0;

          return (
            <div key={m.key}>
              <div className="text-sm text-slate-400">{m.label}</div>
              <div className="font-semibold text-slate-800 text-base mt-0.5">{m.format(val)}</div>
              <div className={`text-sm ${isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-slate-400'}`}>
                {isUp ? '↑' : isDown ? '↓' : ''}{formatPercent(change)}
              </div>
            </div>
          );
        })}
      </div>

      {summary && (
        <p className="mt-4 pt-4 border-t border-slate-100 text-base text-slate-500 line-clamp-2">
          {summary}
        </p>
      )}
    </div>
  );
}
