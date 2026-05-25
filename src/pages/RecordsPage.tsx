import { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import PeriodCard from '../components/records/PeriodCard';
import { exportToPDF, exportToMarkdown } from '../services/exportService';
import { formatDateLabel } from '../utils/formatters';

export default function RecordsPage() {
  const { periods, analyses, loading, loadPeriods } = useDataStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  if (loading) {
    return <div className="text-slate-400">加载中...</div>;
  }

  if (periods.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">暂无记录</h2>
        <p className="text-base text-slate-500">上传数据后会自动生成运营记录</p>
      </div>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">运营记录</h2>
        <p className="text-base text-slate-500 mt-1">按时间轴排列的每个周期的数据记录</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {periods.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${
                selectedId === p.id
                  ? 'border-indigo-400 ring-2 ring-indigo-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedId(p.id)}
            >
              <h4 className="text-base font-semibold text-slate-800">
                {formatDateLabel(p.analysisStart, p.analysisEnd)}
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                {p.type === 'monthly' ? '月度' : '周度'} | 上传于 {new Date(p.uploadedAt).toLocaleDateString('zh-CN')}
              </p>
              {analyses[p.id]?.summary && (
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{analyses[p.id].summary}</p>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedPeriod ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">
                  {formatDateLabel(selectedPeriod.analysisStart, selectedPeriod.analysisEnd)}
                </h3>
                <div className="flex gap-2">
                  <button
                    className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-base hover:bg-slate-50 transition-colors"
                    onClick={handleExportMD}
                  >
                    导出 MD
                  </button>
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-base hover:bg-indigo-700 transition-colors"
                    onClick={handleExportPDF}
                  >
                    导出 PDF
                  </button>
                </div>
              </div>

              <PeriodCard period={selectedPeriod} summary={selectedAnalysis?.summary} />

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h4 className="text-lg font-semibold text-slate-800 mb-3">分析摘要</h4>
                <p className="text-base text-slate-600 whitespace-pre-wrap">
                  {selectedAnalysis?.summary || '暂无分析结果'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-base">
              请从左侧选择一个周期查看记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
