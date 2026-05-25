interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: string;
}

export default function KpiCard({ title, value, change, changeLabel, icon }: KpiCardProps) {
  const showChange = change !== undefined;
  const isPositive = showChange && change > 0;
  const isNegative = showChange && change < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-base text-slate-500">{title}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-[28px] font-bold text-slate-900 mb-2">{value}</div>
      {showChange ? (
        <div className="flex items-center gap-1 text-base">
          {isPositive && <span className="text-emerald-600 font-medium">↑ {change.toFixed(1)}%</span>}
          {isNegative && <span className="text-red-500 font-medium">↓ {Math.abs(change).toFixed(1)}%</span>}
          {!isPositive && !isNegative && <span className="text-slate-400">-</span>}
          {changeLabel && <span className="text-slate-400 ml-1">{changeLabel}</span>}
        </div>
      ) : (
        <div className="text-base text-slate-300">累计</div>
      )}
    </div>
  );
}
