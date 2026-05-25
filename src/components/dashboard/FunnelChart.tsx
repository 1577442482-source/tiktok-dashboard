import { formatCurrency } from '../../utils/formatters';

interface FunnelChartProps {
  impressions: number;
  clicks: number;
  orders: number;
  gmv: number;
}

export default function FunnelChart({ impressions, clicks, orders, gmv }: FunnelChartProps) {
  const clickRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks > 0 ? (orders / clicks) * 100 : 0;
  const maxWidth = 100;

  const steps = [
    { label: '产品曝光', value: impressions, width: maxWidth, color: 'bg-indigo-100 text-indigo-700', format: (v: number) => v.toLocaleString() },
    { label: '产品点击', value: clicks, width: Math.max((clicks / impressions) * maxWidth || 0, 5), color: 'bg-emerald-100 text-emerald-700', format: (v: number) => `${v.toLocaleString()} (${clickRate.toFixed(1)}%)` },
    { label: '下单', value: orders, width: Math.max((orders / impressions) * maxWidth || 0, 3), color: 'bg-amber-100 text-amber-700', format: (v: number) => `${v.toLocaleString()} (CVR ${conversionRate.toFixed(1)}%)` },
    { label: 'GMV', value: gmv, width: Math.max(Math.min(((gmv / (impressions || 1)) * 5) || 0, 80), 5), color: 'bg-indigo-500 text-white', format: (v: number) => formatCurrency(v) },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-base font-semibold text-slate-700 mb-4">流量转化漏斗</h3>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.label}>
            <div className="flex justify-between text-[15px] mb-1">
              <span className="text-slate-600">{step.label}</span>
              <span className="font-medium text-slate-800">{step.format(step.value)}</span>
            </div>
            <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full flex items-center pl-3 text-xs font-medium ${step.color}`}
                style={{ width: `${step.width}%` }}
              >
                {step.width > 20 ? step.label : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
