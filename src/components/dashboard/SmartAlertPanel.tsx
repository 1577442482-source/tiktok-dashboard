import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Info } from 'lucide-react';
import type { DailyRow } from '../../types';
import { detectAlerts } from '../../services/alertEngine';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface SmartAlertPanelProps {
  dailyData: DailyRow[];
}

const SEVERITY_CONFIG = {
  critical: {
    label: '严重',
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    card: 'border-l-red-500 bg-red-500/10',
    Icon: ShieldAlert,
    iconColor: 'text-red-400',
  },
  warning: {
    label: '警告',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    card: 'border-l-amber-500 bg-amber-500/10',
    Icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  info: {
    label: '提示',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    card: 'border-l-blue-500 bg-blue-500/10',
    Icon: Info,
    iconColor: 'text-blue-400',
  },
} as const;

const METRIC_LABEL: Record<string, string> = {
  gmv: 'GMV',
  orders: '订单量',
  cvr: 'CVR',
  ctr: 'CTR',
  refund: '退款率',
  aov: '客单价',
};

function formatMetricValue(metric: string, value: number): string {
  switch (metric) {
    case 'gmv':
    case 'aov':
      return formatCurrency(value);
    case 'ctr':
    case 'cvr':
    case 'refund':
      return `${value.toFixed(2)}%`;
    default:
      return formatNumber(value);
  }
}

export default function SmartAlertPanel({ dailyData }: SmartAlertPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const allAlerts = useMemo(() => detectAlerts(dailyData), [dailyData]);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 };
    for (const a of allAlerts) c[a.severity]++;
    return c;
  }, [allAlerts]);

  if (!expanded) {
    const total = allAlerts.length;
    const hasAlerts = total > 0;
    const hasCritical = counts.critical > 0;

    return (
      <div
        className={`rounded-xl border px-4 py-3 flex items-center justify-between cursor-pointer transition-all card-hover ${
          hasAlerts
            ? hasCritical
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
            : 'bg-emerald-500/10 border-emerald-500/20'
        }`}
        onClick={() => setExpanded(true)}
      >
        <div className="flex items-center gap-3">
          {hasAlerts ? (
            <AlertTriangle size={20} strokeWidth={1.75} className={hasCritical ? 'text-red-500' : 'text-amber-500'} />
          ) : (
            <CheckCircle size={20} strokeWidth={1.75} className="text-emerald-500" />
          )}
          <span className="font-semibold text-slate-200 text-sm">
            {hasAlerts ? `${total} 条预警` : '数据正常'}
          </span>
          {hasAlerts && (
            <div className="flex gap-1.5 text-xs">
              {counts.critical > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 font-medium">
                  {counts.critical}严重
                </span>
              )}
              {counts.warning > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-medium">
                  {counts.warning}警告
                </span>
              )}
              {counts.info > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 font-medium">
                  {counts.info}提示
                </span>
              )}
            </div>
          )}
        </div>
        <span className="text-slate-400 text-xs">展开 &#9654;</span>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden card-hover">
      <div
        className={`px-5 py-3.5 flex items-center justify-between cursor-pointer ${
          allAlerts.length > 0
            ? counts.critical > 0
              ? 'bg-red-500/10 border-b border-red-500/20'
              : 'bg-amber-500/10 border-b border-amber-500/20'
            : 'bg-emerald-500/10 border-b border-emerald-500/20'
        }`}
        onClick={() => setExpanded(false)}
      >
        <div className="flex items-center gap-3">
          {allAlerts.length > 0 ? (
            <AlertTriangle size={20} strokeWidth={1.75} className={counts.critical > 0 ? 'text-red-500' : 'text-amber-500'} />
          ) : (
            <CheckCircle size={20} strokeWidth={1.75} className="text-emerald-500" />
          )}
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">
              {allAlerts.length > 0 ? `智能预警 (${allAlerts.length})` : '数据正常 - 未检测到异常'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {allAlerts.length > 0
                ? '基于最近3天数据检测，覆盖GMV/CTR/CVR/退款率/客单价'
                : '所有核心指标在正常范围内波动'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {allAlerts.length > 0 && (
            <div className="flex gap-1.5 text-xs">
              {counts.critical > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 font-semibold">
                  {counts.critical} 严重
                </span>
              )}
              {counts.warning > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold">
                  {counts.warning} 警告
                </span>
              )}
              {counts.info > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold">
                  {counts.info} 提示
                </span>
              )}
            </div>
          )}
          <span className="text-slate-400 text-xs">收起 &#9660;</span>
        </div>
      </div>

      {allAlerts.length > 0 && (
        <div className="px-5 py-4 space-y-2.5 max-h-[500px] overflow-y-auto">
          {allAlerts.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const Icon = cfg.Icon;
            return (
              <div
                key={alert.id}
                className={`border-l-4 rounded-r-lg p-3.5 ${cfg.card}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={16} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${cfg.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-slate-400">{alert.date}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                        {METRIC_LABEL[alert.metric] || alert.metric}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-200 text-sm mb-1">{alert.title}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>
                        当前: <span className="font-semibold text-slate-400">{formatMetricValue(alert.metric, alert.currentValue)}</span>
                      </span>
                      <span>
                        基线: <span className="text-slate-400">{formatMetricValue(alert.metric, alert.baselineValue)}</span>
                      </span>
                      <span
                        className={`font-semibold ${
                          alert.deviationPercent > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {alert.deviationPercent > 0 ? '+' : ''}
                        {alert.deviationPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
