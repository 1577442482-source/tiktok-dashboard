import { useMemo } from 'react';
import type { DailyRow } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DailyHeatmapProps {
  dailyData: DailyRow[];
}

const DAY_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];

function getIntensity(date: string, gmvMap: Record<string, number>, maxGmv: number): string {
  if (!date) return 'bg-slate-50';
  const gmv = gmvMap[date] || 0;
  if (gmv === 0) return 'bg-slate-100 border border-slate-200';
  const ratio = gmv / maxGmv;
  if (ratio >= 0.75) return 'bg-indigo-500 border border-indigo-400';
  if (ratio >= 0.5) return 'bg-indigo-400 border border-indigo-300';
  if (ratio >= 0.25) return 'bg-indigo-300 border border-indigo-200';
  return 'bg-indigo-200 border border-indigo-100';
}

function getTextClass(date: string, gmvMap: Record<string, number>, maxGmv: number): string {
  if (!date || (gmvMap[date] || 0) === 0) return 'text-slate-400';
  return (gmvMap[date] || 0) / maxGmv > 0.5 ? 'text-white' : 'text-slate-700';
}

function buildMonthGrid(year: number, month: number): string[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay();

  const weeks: string[][] = [];
  const firstWeek: string[] = [];
  for (let i = 0; i < startDayOfWeek; i++) firstWeek.push('');

  let currentWeek = [...firstWeek];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    currentWeek.push(dateStr);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push('');
    weeks.push(currentWeek);
  }

  return weeks;
}

export default function DailyHeatmap({ dailyData }: DailyHeatmapProps) {
  const { months, maxGmv, gmvMap, dateStart, dateEnd } = useMemo(() => {
    const gmvMap: Record<string, number> = {};
    dailyData.forEach(d => { gmvMap[d.date] = d.gmv; });

    const allValues = dailyData.map(d => d.gmv).filter(g => g > 0);
    const maxGmv = allValues.length > 0 ? Math.max(...allValues) : 1;

    if (dailyData.length === 0) return { months: [], maxGmv, gmvMap, dateStart: '', dateEnd: '' };

    const sorted = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
    const start = new Date(sorted[0].date);
    const end = new Date(sorted[sorted.length - 1].date);

    const months: { year: number; month: number; label: string; weeks: string[][] }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      months.push({
        year: y,
        month: m,
        label: `${y}年${m}月`,
        weeks: buildMonthGrid(y, m),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { months, maxGmv, gmvMap, dateStart: sorted[0].date, dateEnd: sorted[sorted.length - 1].date };
  }, [dailyData]);

  if (dailyData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center h-64 text-slate-400">
        暂无周期数据
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-base font-semibold text-slate-700 mb-1">周期内每日销售热力图</h3>
      <p className="text-xs text-slate-400 mb-4">
        {dateStart} ~ {dateEnd} · {dailyData.length}天
      </p>

      <div className="space-y-4">
        {months.map(({ label, weeks }) => (
          <div key={label}>
            <div className="text-xs font-medium text-slate-500 mb-2">{label}</div>
            <div className="space-y-1">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_HEADERS.map(d => (
                  <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((date, di) => (
                    <div
                      key={di}
                      className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-colors ${getIntensity(date, gmvMap, maxGmv)}`}
                      title={date ? `${date}: ${formatCurrency(gmvMap[date] || 0)}` : ''}
                    >
                      {date ? (
                        <span className={`font-medium ${getTextClass(date, gmvMap, maxGmv)}`}>
                          {new Date(date).getDate()}
                        </span>
                      ) : (
                        <span className="text-slate-300" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-4 text-xs text-slate-400">
        <span>低</span>
        <div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" />
        <div className="w-3 h-3 rounded-sm bg-indigo-200" />
        <div className="w-3 h-3 rounded-sm bg-indigo-300" />
        <div className="w-3 h-3 rounded-sm bg-indigo-400" />
        <div className="w-3 h-3 rounded-sm bg-indigo-500" />
        <span>高</span>
      </div>
    </div>
  );
}
