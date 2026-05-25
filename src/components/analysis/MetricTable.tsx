import { useMemo } from 'react';
import type { MetricRow } from '../../types';
import { METRIC_CATEGORIES, METRIC_LABELS } from '../../types';
import { METRIC_FORMAT_TYPE } from '../../utils/constants';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

interface MetricTableProps {
  overview: MetricRow;
  overviewChange: MetricRow;
  highlightThreshold?: number;
}

function formatMetricValue(key: string, value: number): string {
  const formatType = METRIC_FORMAT_TYPE[key as keyof typeof METRIC_FORMAT_TYPE];
  if (formatType === 'currency') return formatCurrency(value);
  return formatNumber(value);
}

export default function MetricTable({ overview, overviewChange, highlightThreshold = 20 }: MetricTableProps) {
  const categories = useMemo(() => {
    return METRIC_CATEGORIES.map((cat) => ({
      ...cat,
      metrics: cat.keys.map((key) => ({
        key,
        label: METRIC_LABELS[key],
        value: overview[key],
        change: overviewChange[key],
      })),
    }));
  }, [overview, overviewChange]);

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.label} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-700">{cat.label}</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {cat.metrics.map((m) => {
              const absChange = Math.abs(m.change);
              const isUp = m.change > 0;
              const isDown = m.change < 0;
              const isHighlight = absChange > highlightThreshold;

              return (
                <div
                  key={m.key}
                  className={`flex items-center justify-between px-5 py-3.5 text-[15px] ${
                    isHighlight ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <span className="text-slate-600">{m.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800">
                      {formatMetricValue(m.key, m.value)}
                    </span>
                    <span
                      className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                        isUp && isHighlight ? 'bg-emerald-100 text-emerald-700' :
                        isDown && isHighlight ? 'bg-red-100 text-red-700' :
                        isUp ? 'text-emerald-600' :
                        isDown ? 'text-red-500' :
                        'text-slate-400'
                      }`}
                    >
                      {isUp ? '↑' : isDown ? '↓' : ''}{formatPercent(m.change)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
