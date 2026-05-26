import { useEffect, useState } from 'react';
import { ScrollText, FileDown, FileText } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import PeriodCard from '../components/records/PeriodCard';
import PageTransition from '../components/ui/PageTransition';
import { Skeleton } from '../components/ui/Skeleton';
import { exportToPDF, exportToMarkdown } from '../services/exportService';
import { formatDateLabel } from '../utils/formatters';

export default function RecordsPage() {
  const { periods, analyses, loading, loadPeriods } = useDataStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 col-span-2 w-full" />
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
            <ScrollText size={48} strokeWidth={1.5} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">暂无记录</h2>
          <p className="text-base text-slate-400">上传数据后会自动生成运营记录</p>
        </div>
      </PageTransition>
    );
  }

  const selectedPeriod = periods.find((p) => p.id === selectedId);
  const selectedAnalysis = selectedId ? analyses[selectedId] : undefined;

  const handleExportPDF = () => {
    if (selectedPeriod) {
      exportToPDF(selectedPeriod, selectedAnalysis?.summary || '');
    }
  };

  const handleExportMD = () => {
    if (selectedPeriod) {
      const md = exportToMarkdown(selectedPeriod, selectedAnalysis?.summary || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `运营记录_${selectedPeriod.analysisStart}_${selectedPeriod.analysisEnd}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white">运营记录</h2>
          <p className="text-sm text-slate-400 mt-1">按时间轴排列的每个周期的数据记录</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {periods.map((p) => (
              <div
                key={p.id}
                className={`glass-card rounded-xl p-5 cursor-pointer transition-all duration-150 ${
                  selectedId === p.id
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-white/5 hover:border-slate-600 hover:shadow-sm'
                }`}
                onClick={() => setSelectedId(p.id)}
              >
                <h4 className="text-sm font-semibold text-slate-200">
                  {formatDateLabel(p.analysisStart, p.analysisEnd)}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {p.type === 'monthly' ? '月度' : '周度'} | 上传于 {new Date(p.uploadedAt).toLocaleDateString('zh-CN')}
                </p>
                {analyses[p.id]?.summary && (
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{analyses[p.id].summary}</p>
                )}
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedPeriod ? (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-200">
                    {formatDateLabel(selectedPeriod.analysisStart, selectedPeriod.analysisEnd)}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      className="border border-slate-600 text-slate-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-all btn-press inline-flex items-center gap-1.5"
                      onClick={handleExportMD}
                    >
                      <FileText size={15} strokeWidth={1.75} />
                      导出 MD
                    </button>
                    <button
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all btn-press inline-flex items-center gap-1.5"
                      onClick={handleExportPDF}
                    >
                      <FileDown size={15} strokeWidth={1.75} />
                      导出 PDF
                    </button>
                  </div>
                </div>

                <PeriodCard period={selectedPeriod} summary={selectedAnalysis?.summary} />

                <div className="glass-card rounded-xl p-5 card-hover">
                  <h4 className="text-base font-semibold text-slate-200 mb-3">分析摘要</h4>
                  <p className="text-sm text-slate-400 whitespace-pre-wrap">
                    {selectedAnalysis?.summary || '暂无分析结果'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                请从左侧选择一个周期查看记录
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
