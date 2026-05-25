import { useMemo } from 'react';
import type { DailyRow } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DailyAnomalyPanelProps {
  dailyData: DailyRow[];
}

interface DailyAnomaly {
  date: string;
  gmv: number;
  reason: string;
  level: 'spike' | 'dip' | 'normal';
}

export default function DailyAnomalyPanel({ dailyData }: DailyAnomalyPanelProps) {
  const anomalies = useMemo((): DailyAnomaly[] => {
    if (dailyData.length < 3) return [];

    const gmvValues = dailyData.map((d) => d.gmv).filter((g) => g > 0);
    if (gmvValues.length === 0) return [];
    const mean = gmvValues.reduce((a, b) => a + b, 0) / gmvValues.length;
    const stdDev = Math.sqrt(
      gmvValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / gmvValues.length,
    );

    const results: DailyAnomaly[] = [];

    dailyData.forEach((d, i) => {
      const prevDay = i > 0 ? dailyData[i - 1] : null;

      let level: DailyAnomaly['level'] = 'normal';
      let reason = '';

      // Check vs mean + std dev
      if (d.gmv > mean + 2 * stdDev && d.gmv > 0) {
        level = 'spike';
        if (d.videoAttributedGmv > d.gmv * 0.6) {
          reason = '短视频爆量，疑似有达人内容爆发或视频被算法推荐';
        } else if (d.productCardGmv > d.gmv * 0.6) {
          reason = '商品卡渠道集中出单，可能有大促活动或广告集中消耗';
        } else if (d.liveAttributedGmv > 0 && prevDay && prevDay.liveAttributedGmv === 0) {
          reason = '新增直播渠道贡献，可能有直播场次';
        } else {
          reason = 'GMV显著高于周期均值，建议检查当天是否有特殊营销活动';
        }
      } else if (d.gmv < mean - stdDev && mean > 0) {
        level = 'dip';
        reason = 'GMV显著低于周期均值，可能受工作日/节假日影响或广告暂停';
      } else if (prevDay && prevDay.gmv > 0 && d.gmv > prevDay.gmv * 2.5) {
        level = 'spike';
        reason = `环比前日暴涨 ${Math.round(((d.gmv - prevDay.gmv) / prevDay.gmv) * 100)}%，建议排查数据波动原因`;
      } else if (prevDay && d.gmv > 0 && prevDay.gmv > 0 && d.gmv < prevDay.gmv * 0.3) {
        level = 'dip';
        reason = `环比前日骤降 ${Math.round(((prevDay.gmv - d.gmv) / prevDay.gmv) * 100)}%`;
      }

      if (level !== 'normal' || reason) {
        results.push({ date: d.date, gmv: d.gmv, level, reason });
      }
    });

    return results;
  }, [dailyData]);

  if (anomalies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-700 mb-3">日度异常检测</h3>
        <p className="text-sm text-slate-400 text-center py-8">本周期日度数据平稳，未检测到显著异常</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-base font-semibold text-slate-700 mb-4">日度异常检测</h3>
      <div className="space-y-2">
        {anomalies.map((a) => (
          <div
            key={a.date}
            className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
              a.level === 'spike'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <span className={`text-lg shrink-0 ${a.level === 'spike' ? '' : ''}`}>
              {a.level === 'spike' ? '📈' : '📉'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-800">{a.date}</span>
                <span className={`font-semibold ${a.level === 'spike' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(a.gmv)}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  a.level === 'spike' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {a.level === 'spike' ? '暴涨' : '骤降'}
                </span>
              </div>
              <p className="text-slate-600">{a.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
