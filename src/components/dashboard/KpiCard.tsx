import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AnimatedNumber from '../ui/AnimatedNumber';

interface KpiCardProps {
  title: string;
  value: string;
  numericValue: number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  accentColor?: string;
}

export default function KpiCard({
  title,
  value,
  numericValue,
  change,
  changeLabel,
  icon: Icon,
  accentColor = 'from-emerald-500 to-teal-500',
}: KpiCardProps) {
  const showChange = change !== undefined;
  const isPositive = showChange && change > 0;
  const isNegative = showChange && change < 0;
  const isCurrency = value.startsWith('$') || value.startsWith('￥');

  return (
    <div className="glass-card rounded-xl overflow-hidden card-hover-lift group glow-accent">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-400" style={{ fontFamily: "'Geist', sans-serif" }}>
            {title}
          </span>
          <div className="p-2 rounded-lg bg-white/[0.03] group-hover:bg-emerald-500/10 transition-colors duration-300">
            <Icon size={18} strokeWidth={1.75} className="text-slate-500 group-hover:text-emerald-400 transition-colors duration-300" />
          </div>
        </div>

        <div className="text-[28px] font-bold text-white mb-2 tracking-tight tabular-nums" style={{ fontFamily: "'Geist Mono', 'SF Mono', monospace" }}>
          {isCurrency ? (
            <span>
              $<AnimatedNumber value={numericValue} decimals={0} />
            </span>
          ) : value.includes('%') ? (
            <span>
              <AnimatedNumber value={numericValue} decimals={2} />%
            </span>
          ) : (
            <AnimatedNumber value={numericValue} decimals={0} />
          )}
        </div>

        {showChange ? (
          <div className="flex items-center gap-1 text-sm">
            {isPositive && (
              <span className="text-emerald-400 font-medium inline-flex items-center gap-0.5">
                <TrendingUp size={12} strokeWidth={2.5} /> {change.toFixed(1)}%
              </span>
            )}
            {isNegative && (
              <span className="text-red-400 font-medium inline-flex items-center gap-0.5">
                <TrendingDown size={12} strokeWidth={2.5} /> {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {!isPositive && !isNegative && <span className="text-slate-400">-</span>}
            {changeLabel && <span className="text-slate-500 ml-1">{changeLabel}</span>}
          </div>
        ) : (
          <div className="text-sm text-slate-400">累计</div>
        )}
      </div>

      {/* Bottom glow bar */}
      <div className={`h-[2px] bg-gradient-to-r ${accentColor} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  );
}
