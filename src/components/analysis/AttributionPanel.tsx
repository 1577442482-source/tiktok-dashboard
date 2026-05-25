import type { Attribution, AnomalyLevel, Probability } from '../../types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { METRIC_FORMAT_TYPE } from '../../utils/constants';

interface AttributionPanelProps {
  attributions: Attribution[];
}

const anomalyColors: Record<AnomalyLevel, string> = {
  normal: 'bg-slate-100 text-slate-600',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

const anomalyLabels: Record<AnomalyLevel, string> = {
  normal: '正常',
  warning: '关注',
  critical: '显著',
};

const probColors: Record<Probability, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-50 text-slate-500 border-slate-200',
};

const probLabels: Record<Probability, string> = {
  high: '高概率',
  medium: '中概率',
  low: '低概率',
};

function formatMetricValue(key: string, value: number): string {
  const formatType = METRIC_FORMAT_TYPE[key as keyof typeof METRIC_FORMAT_TYPE];
  if (formatType === 'currency') return formatCurrency(value);
  return formatNumber(value);
}

export default function AttributionPanel({ attributions }: AttributionPanelProps) {
  const anomalies = attributions.filter((a) => a.anomalyLevel !== 'normal');

  if (anomalies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-base text-slate-600">本周期各项指标表现稳定，未发现显著异动。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {anomalies.map((attr) => (
        <div
          key={attr.metricKey}
          className={`bg-white rounded-xl border-l-4 p-5 ${
            attr.anomalyLevel === 'critical' ? 'border-red-400' : 'border-amber-400'
          } border border-slate-200 border-l-4`}
          style={{ borderLeftWidth: '4px' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold text-slate-900">{attr.metricLabel}</h4>
              <span className={`text-sm px-2 py-0.5 rounded-full ${anomalyColors[attr.anomalyLevel]}`}>
                {anomalyLabels[attr.anomalyLevel]}
              </span>
            </div>
            <div className="text-right">
              <div className="text-base text-slate-500">
                {formatMetricValue(attr.metricKey, attr.currentValue)}
              </div>
              <div className={`text-base font-medium ${attr.changeRate > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatPercent(attr.changeRate)}
              </div>
            </div>
          </div>

          {attr.causes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400 font-medium">可能原因：</p>
              {attr.causes.map((cause, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-3 rounded-lg border text-base ${probColors[cause.probability]}`}
                >
                  <span className="text-sm font-medium px-1.5 py-0.5 rounded bg-white/50 shrink-0 mt-0.5">
                    {probLabels[cause.probability]}
                  </span>
                  <span>{cause.description}</span>
                  <span className="text-sm opacity-60 ml-auto shrink-0">
                    {cause.confidence}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
