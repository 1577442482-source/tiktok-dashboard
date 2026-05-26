import { useEffect, useState, useMemo } from 'react';
import { Search, Calendar } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import AttributionPanel from '../components/analysis/AttributionPanel';
import MetricTable from '../components/analysis/MetricTable';
import DailyTrendChart from '../components/dashboard/DailyTrendChart';
import WeeklyPattern from '../components/dashboard/WeeklyPattern';
import DailyHeatmap from '../components/dashboard/DailyHeatmap';
import DailySourceBreakdown from '../components/dashboard/DailySourceBreakdown';
import DailyAnomalyPanel from '../components/dashboard/DailyAnomalyPanel';
import PageTransition from '../components/ui/PageTransition';
import { Skeleton } from '../components/ui/Skeleton';
import { aggregateDailyRange, getAllDailyData, computeChangeRow } from '../services/weekAggregator';
import { analyzePeriod } from '../services/analysisEngine';
import { EMPTY_METRIC_ROW, type DataPeriod, type AnalysisResult, type DailyRow } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

type SubTabKey = 'overview' | 'daily';

function buildPseudoPeriod(overview: typeof EMPTY_METRIC_ROW, start: string, end: string): DataPeriod {
  return {
    id: `pseudo_${start}_${end}`,
    type: 'weekly',
    analysisStart: start,
    analysisEnd: end,
    comparisonStart: '',
    comparisonEnd: '',
    uploadedAt: '',
    overview,
    overviewChange: EMPTY_METRIC_ROW,
    dailyData: [],
  };
}

export default function AnalysisPage() {
  const { periods, loading, loadPeriods } = useDataStore();
  const [subTab, setSubTab] = useState<SubTabKey>('overview');

  const [periodStartA, setPeriodStartA] = useState('');
  const [periodEndA, setPeriodEndA] = useState('');
  const [periodStartB, setPeriodStartB] = useState('');
  const [periodEndB, setPeriodEndB] = useState('');

  useEffect(() => {
    loadPeriods();
  }, []);

  const allDaily = useMemo(() => getAllDailyData(periods), [periods]);

  const periodResultA = useMemo(() => {
    if (!periodStartA || !periodEndA) return null;
    return aggregateDailyRange(allDaily, periodStartA, periodEndA);
  }, [periodStartA, periodEndA, allDaily]);

  const periodResultB = useMemo(() => {
    if (!periodStartB || !periodEndB) return null;
    return aggregateDailyRange(allDaily, periodStartB, periodEndB);
  }, [periodStartB, periodEndB, allDaily]);

  const periodDailyA = useMemo((): DailyRow[] => {
    if (!periodStartA || !periodEndA) return [];
    return allDaily.filter(d => d.date >= periodStartA && d.date <= periodEndA);
  }, [periodStartA, periodEndA, allDaily]);

  const periodAnalysis = useMemo((): AnalysisResult | null => {
    if (!periodResultA || !periodResultB) return null;
    const current = buildPseudoPeriod(periodResultA, periodStartA, periodEndA);
    const previous = buildPseudoPeriod(periodResultB, periodStartB, periodEndB);
    return analyzePeriod(current, previous);
  }, [periodResultA, periodResultB, periodStartA, periodEndA, periodStartB, periodEndB]);

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (periods.length === 0) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="inline-flex p-5 bg-white/5 rounded-full mb-5">
            <Search size={48} strokeWidth={1.5} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">暂无数据</h2>
          <p className="text-base text-slate-400">请先上传数据再进行数据分析</p>
        </div>
      </PageTransition>
    );
  }

  const subtitle = periodAnalysis
    ? `${periodStartA} ~ ${periodEndA}  VS  ${periodStartB} ~ ${periodEndB}`
    : '选择两段时间范围进行对比分析';

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white">数据分析</h2>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5 card-hover">
            <h4 className="text-sm font-semibold text-slate-400 mb-3">分析周期 A</h4>
            <div className="flex items-center gap-2">
              <input type="date" className="border border-slate-600 rounded-lg px-3 py-2 text-sm bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-shadow" value={periodStartA} onChange={e => setPeriodStartA(e.target.value)} />
              <span className="text-slate-400">~</span>
              <input type="date" className="border border-slate-600 rounded-lg px-3 py-2 text-sm bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-shadow" value={periodEndA} onChange={e => setPeriodEndA(e.target.value)} />
            </div>
            {periodResultA && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-xs text-slate-400 mb-2">汇总</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-400">GMV:</span> <span className="font-semibold text-slate-200">{formatCurrency(periodResultA.gmv)}</span></div>
                  <div><span className="text-slate-400">Orders:</span> <span className="font-semibold text-slate-200">{formatNumber(periodResultA.orders)}</span></div>
                  <div><span className="text-slate-400">AOV:</span> <span className="font-semibold text-slate-200">{formatCurrency(periodResultA.aov)}</span></div>
                  <div><span className="text-slate-400">Customers:</span> <span className="font-semibold text-slate-200">{formatNumber(periodResultA.customers)}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-5 card-hover">
            <h4 className="text-sm font-semibold text-slate-400 mb-3">对比周期 B</h4>
            <div className="flex items-center gap-2">
              <input type="date" className="border border-slate-600 rounded-lg px-3 py-2 text-sm bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-shadow" value={periodStartB} onChange={e => setPeriodStartB(e.target.value)} />
              <span className="text-slate-400">~</span>
              <input type="date" className="border border-slate-600 rounded-lg px-3 py-2 text-sm bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-shadow" value={periodEndB} onChange={e => setPeriodEndB(e.target.value)} />
            </div>
            {periodResultB && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-xs text-slate-400 mb-2">汇总</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-400">GMV:</span> <span className="font-semibold text-slate-200">{formatCurrency(periodResultB.gmv)}</span></div>
                  <div><span className="text-slate-400">Orders:</span> <span className="font-semibold text-slate-200">{formatNumber(periodResultB.orders)}</span></div>
                  <div><span className="text-slate-400">AOV:</span> <span className="font-semibold text-slate-200">{formatCurrency(periodResultB.aov)}</span></div>
                  <div><span className="text-slate-400">Customers:</span> <span className="font-semibold text-slate-200">{formatNumber(periodResultB.customers)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {(!periodResultA || !periodResultB) && (
          <div className="glass-card rounded-xl p-8 text-center text-slate-400 animate-fade-in">
            请选择两组日期范围，系统将自动从所有日数据中聚合对比
          </div>
        )}

        {periodAnalysis && periodResultA && (
          <>
            {periodAnalysis.summary && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-sm text-emerald-300 animate-scale-in">
                <span className="font-semibold">分析摘要：</span>{periodAnalysis.summary}
              </div>
            )}

            <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
              <button className={`px-5 py-2 rounded-lg text-sm font-medium transition-all btn-press ${subTab === 'overview' ? 'bg-white/5 text-white shadow-sm' : 'text-slate-400 hover:text-slate-400'}`} onClick={() => setSubTab('overview')}>概览分析</button>
              <button className={`px-5 py-2 rounded-lg text-sm font-medium transition-all btn-press ${subTab === 'daily' ? 'bg-white/5 text-white shadow-sm' : 'text-slate-400 hover:text-slate-400'}`} onClick={() => setSubTab('daily')}>日度分析</button>
            </div>

            {subTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">异常归因分析</h3>
                  <AttributionPanel attributions={periodAnalysis.attributions} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">全量指标对比</h3>
                  <MetricTable overview={periodResultA} overviewChange={periodResultB ? computeChangeRow(periodResultA, periodResultB) : EMPTY_METRIC_ROW} />
                </div>
              </div>
            )}

            {subTab === 'daily' && (
              <div className="space-y-6">
                {periodDailyA.length > 0 ? (
                  <>
                    <DailyTrendChart dailyData={periodDailyA} title="日度 GMV 趋势（周期A）" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <WeeklyPattern dailyData={periodDailyA} />
                      <DailyHeatmap dailyData={periodDailyA} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <DailySourceBreakdown dailyData={periodDailyA} />
                      <DailyAnomalyPanel dailyData={periodDailyA} />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 glass-card rounded-xl">
                    <div className="inline-flex p-4 bg-white/5 rounded-full mb-3">
                      <Calendar size={32} strokeWidth={1.5} className="text-slate-400" />
                    </div>
                    <p className="text-slate-400">所选周期 A 暂无日度明细数据</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
