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
        <div key={cat.label} className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-white/5 border-b border-white/5">
            <h3 className="text-base font-semibold text-slate-400">{cat.label}</h3>
          </div>
          <div className="divide-y divide-white/5">
            {cat.metrics.map((m) => {
              const absChange = Math.abs(m.change);
              const isUp = m.change > 0;
              const isDown = m.change < 0;
              const isHighlight = absChange > highlightThreshold;

              return (
                <div
                  key={m.key}
                  className={`flex items-center justify-between px-5 py-3.5 text-[15px] ${
                    isHighlight ? 'bg-amber-500/10' : ''
                  }`}
                >
                  <span className="text-slate-400">{m.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-200">
                      {formatMetricValue(m.key, m.value)}
                    </span>
                    <span
                      className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                        isUp && isHighlight ? 'bg-emerald-500/20 text-emerald-300' :
                        isDown && isHighlight ? 'bg-red-500/15 text-red-300' :
                        isUp ? 'text-emerald-400' :
                        isDown ? 'text-red-400' :
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
