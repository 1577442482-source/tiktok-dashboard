import { useEffect, useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import MetricTable from '../components/analysis/MetricTable';
import { type MetricKey, EMPTY_METRIC_ROW } from '../types';
import { formatDateLabel } from '../utils/formatters';
import {
  aggregateDailyToWeeks,
  aggregateDailyRange, getAllDailyData, computeChangeRow,
} from '../services/weekAggregator';
import { formatCurrency, formatNumber } from '../utils/formatters';

type CompareMode = 'period' | 'weekly' | 'custom';

export default function ComparePage() {
  const { periods, loading, loadPeriods } = useDataStore();

  const [mode, setMode] = useState<CompareMode>('period');

  // Period mode
  const [periodAId, setPeriodAId] = useState('');
  const [periodBId, setPeriodBId] = useState('');

  // Weekly mode
  const [weeklySource, setWeeklySource] = useState('');
  const [selectedWeekA, setSelectedWeekA] = useState(0);
  const [selectedWeekB, setSelectedWeekB] = useState(1);

  // Custom mode
  const [customStartA, setCustomStartA] = useState('');
  const [customEndA, setCustomEndA] = useState('');
  const [customStartB, setCustomStartB] = useState('');
  const [customEndB, setCustomEndB] = useState('');

  useEffect(() => { loadPeriods(); }, []);

  useEffect(() => {
    if (periods.length >= 2 && !periodAId) {
      setPeriodAId(periods[0].id);
      setPeriodBId(periods[1].id);
    }
    if (periods.length > 0 && !weeklySource) {
      setWeeklySource(periods[0].id);
    }
  }, [periods]);

  // ---- Weekly data ----
  const weekBuckets = useMemo(() => {
    const source = periods.find((p) => p.id === weeklySource);
    if (!source) return [];
    return aggregateDailyToWeeks(source.dailyData);
  }, [weeklySource, periods]);

  // ---- Custom period data ----
  const allDaily = useMemo(() => getAllDailyData(periods), [periods]);

  const customResultA = useMemo(() => {
    if (!customStartA || !customEndA) return null;
    return aggregateDailyRange(allDaily, customStartA, customEndA);
  }, [customStartA, customEndA, allDaily]);

  const customResultB = useMemo(() => {
    if (!customStartB || !customEndB) return null;
    return aggregateDailyRange(allDaily, customStartB, customEndB);
  }, [customStartB, customEndB, allDaily]);

  const customChange = useMemo(() => {
    if (!customResultA || !customResultB) return null;
    return computeChangeRow(customResultA, customResultB);
  }, [customResultA, customResultB]);

  if (loading) return <div className="text-slate-400 text-base">加载中...</div>;

  if (periods.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">暂无数据</h2>
        <p className="text-base text-slate-500">请先上传数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">数据对比</h2>
        <p className="text-base text-slate-500 mt-1">多维度、多周期的灵活对比分析</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'period' as const, label: '周期对比' },
          { key: 'weekly' as const, label: '周度对比' },
          { key: 'custom' as const, label: '自定义对比' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-5 py-2 rounded-lg text-base font-medium transition-all ${
              mode === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setMode(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== PERIOD MODE ==================== */}
      {mode === 'period' && (
        <>
          <div className="flex items-center gap-5">
            <select
              className="border border-slate-200 rounded-lg px-4 py-2.5 text-base bg-white"
              value={periodAId}
              onChange={(e) => setPeriodAId(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  当期: {formatDateLabel(p.analysisStart, p.analysisEnd)}
                </option>
              ))}
            </select>
            <span className="text-slate-400 font-bold text-lg">VS</span>
            <select
              className="border border-slate-200 rounded-lg px-4 py-2.5 text-base bg-white"
              value={periodBId}
              onChange={(e) => setPeriodBId(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  对比: {formatDateLabel(p.analysisStart, p.analysisEnd)}
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const periodA = periods.find((p) => p.id === periodAId);
            const periodB = periods.find((p) => p.id === periodBId);
            if (!periodA || !periodB) return <div className="text-slate-400">加载失败</div>;

            const change = { ...EMPTY_METRIC_ROW };
            for (const key of Object.keys(EMPTY_METRIC_ROW) as MetricKey[]) {
              const a = periodA.overview[key];
              const b = periodB.overview[key];
              change[key] = b > 0 ? ((a - b) / b) * 100 : (a > 0 ? 100 : 0);
            }

            return <MetricTable overview={periodA.overview} overviewChange={change} />;
          })()}
        </>
      )}

      {/* ==================== WEEKLY MODE ==================== */}
      {mode === 'weekly' && (
        <div className="space-y-8">
          <div className="flex items-center gap-5 flex-wrap">
            <select
              className="border border-slate-200 rounded-lg px-4 py-2.5 text-base bg-white"
              value={weeklySource}
              onChange={(e) => { setWeeklySource(e.target.value); setSelectedWeekA(0); setSelectedWeekB(1); }}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  数据源: {formatDateLabel(p.analysisStart, p.analysisEnd)}
                </option>
              ))}
            </select>
          </div>

          {weekBuckets.length < 2 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              该周期日度数据不足以拆分为两个以上周，无法进行周度对比
            </div>
          ) : (
            <>
              {/* Week selector cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { label: '本周', weekIdx: selectedWeekA, setter: setSelectedWeekA, color: 'indigo' },
                  { label: '对比周', weekIdx: selectedWeekB, setter: setSelectedWeekB, color: 'slate' },
                ].map((cfg) => (
                  <div key={cfg.label} className="bg-white rounded-xl border border-slate-200 p-5">
                    <h4 className="text-base font-semibold text-slate-700 mb-3">{cfg.label}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {weekBuckets.map((w, i) => (
                        <button
                          key={w.weekLabel}
                          className={`text-left p-3 rounded-lg border text-sm transition-all ${
                            cfg.weekIdx === i
                              ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => cfg.setter(i)}
                        >
                          <div className="font-semibold text-slate-800">{w.weekLabel}</div>
                          <div className="text-xs text-slate-400">{w.weekStart} ~ {w.weekEnd}</div>
                          <div className="text-sm font-bold text-indigo-600 mt-1.5">{formatCurrency(w.overview.gmv)}</div>
                          <div className="text-xs text-slate-400">{w.days}天</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly comparison table */}
              <MetricTable
                overview={weekBuckets[selectedWeekA]?.overview || EMPTY_METRIC_ROW}
                overviewChange={computeChangeRow(
                  weekBuckets[selectedWeekA]?.overview || EMPTY_METRIC_ROW,
                  weekBuckets[selectedWeekB]?.overview || EMPTY_METRIC_ROW,
                )}
              />
            </>
          )}
        </div>
      )}

      {/* ==================== CUSTOM MODE ==================== */}
      {mode === 'custom' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel A */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-base font-semibold text-slate-700 mb-3">分析周期 A</h4>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={customStartA}
                  onChange={(e) => setCustomStartA(e.target.value)}
                />
                <span className="text-slate-400">~</span>
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={customEndA}
                  onChange={(e) => setCustomEndA(e.target.value)}
                />
              </div>
              {customResultA && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-400 mb-2">汇总</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">GMV:</span> <span className="font-semibold">{formatCurrency(customResultA.gmv)}</span></div>
                    <div><span className="text-slate-500">Orders:</span> <span className="font-semibold">{formatNumber(customResultA.orders)}</span></div>
                    <div><span className="text-slate-500">AOV:</span> <span className="font-semibold">{formatCurrency(customResultA.aov)}</span></div>
                    <div><span className="text-slate-500">Customers:</span> <span className="font-semibold">{formatNumber(customResultA.customers)}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel B */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-base font-semibold text-slate-700 mb-3">对比周期 B</h4>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={customStartB}
                  onChange={(e) => setCustomStartB(e.target.value)}
                />
                <span className="text-slate-400">~</span>
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={customEndB}
                  onChange={(e) => setCustomEndB(e.target.value)}
                />
              </div>
              {customResultB && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-400 mb-2">汇总</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">GMV:</span> <span className="font-semibold">{formatCurrency(customResultB.gmv)}</span></div>
                    <div><span className="text-slate-500">Orders:</span> <span className="font-semibold">{formatNumber(customResultB.orders)}</span></div>
                    <div><span className="text-slate-500">AOV:</span> <span className="font-semibold">{formatCurrency(customResultB.aov)}</span></div>
                    <div><span className="text-slate-500">Customers:</span> <span className="font-semibold">{formatNumber(customResultB.customers)}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {customResultA && customResultB && customChange && (
            <MetricTable overview={customResultA} overviewChange={customChange} />
          )}

          {(!customResultA || !customResultB) && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              请选择两组日期范围，系统将自动从每日数据中聚合对比
            </div>
          )}
        </div>
      )}
    </div>
  );
}
