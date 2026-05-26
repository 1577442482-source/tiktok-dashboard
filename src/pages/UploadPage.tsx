import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
import { parseExcelFile, type ParseProgress } from '../services/excelParser';
import { parseRefundExcel } from '../services/refundParser';
import { saveRefundDataset } from '../services/refundStorage';
import { useDataStore } from '../store/dataStore';
import { getAllPeriods } from '../services/storageService';
import PageTransition from '../components/ui/PageTransition';
import type { DataPeriod, AnalysisResult } from '../types';
import type { RefundDataset } from '../types/refund';
import { formatDateLabel, formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { bulkImportFromDirectory, type BulkImportResult } from '../services/bulkImport';

type UploadTab = 'biz' | 'refund';

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<UploadTab>('biz');

  const [bizFile, setBizFile] = useState<File | null>(null);
  const [bizParsing, setBizParsing] = useState(false);
  const [bizStage, setBizStage] = useState<string>('');
  const [bizProgress, setBizProgress] = useState(0);
  const [bizError, setBizError] = useState<string | null>(null);
  const [bizPreview, setBizPreview] = useState<{ period: DataPeriod; analysis: AnalysisResult } | null>(null);
  const [bizSaving, setBizSaving] = useState(false);
  const [bizReplaced, setBizReplaced] = useState<string[]>([]);
  const [bizPending, setBizPending] = useState<DataPeriod | null>(null);
  const [bizOverlapNames, setBizOverlapNames] = useState<string[]>([]);

  const [refundFile, setRefundFile] = useState<File | null>(null);
  const [refundParsing, setRefundParsing] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundPreview, setRefundPreview] = useState<RefundDataset | null>(null);

  const [bulkDir, setBulkDir] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const { addPeriod } = useDataStore();
  const navigate = useNavigate();
  const autoImported = useRef(false);

  useEffect(() => {
    if (autoImported.current) return;
    autoImported.current = true;

    const tryAutoImport = async () => {
      try {
        const res = await fetch('/_bulk_data.json');
        if (!res.ok) return;
        const data: BulkImportResult = await res.json();
        if (!data.success || data.count === 0) return;

        setBulkDir('[自动导入]');
        setBulkImporting(true);
        let imported = 0;
        const errs: { file: string; error: string }[] = [];

        for (const period of data.periods) {
          try {
            await addPeriod(period);
            imported++;
          } catch (e) {
            errs.push({ file: period.id, error: (e as Error).message });
          }
        }

        setBulkResult({ ...data, count: imported, errors: [...data.errors, ...errs] });
        setBulkImporting(false);
        if (errs.length > 0 || data.errors.length > 0) {
          setBulkError(`${errs.length + data.errors.length} 个文件导入失败`);
        }
      } catch {
        // No bulk data file — fine
      }
    };

    tryAutoImport();
  }, [addPeriod]);

  const handleBizProgress = useCallback((p: ParseProgress) => {
    setBizStage(p.stage);
    setBizProgress(p.percent);
  }, []);

  const handleBizFile = async (f: File) => {
    setBizFile(f);
    setBizError(null);
    setBizPreview(null);
    setBizReplaced([]);
    setBizPending(null);
    setBizOverlapNames([]);
    setBizParsing(true);
    setBizStage('读取文件...');
    setBizProgress(0);

    try {
      const period = await parseExcelFile(f, handleBizProgress);
      setBizParsing(false);

      const existing = await getAllPeriods();
      const overlaps = existing.filter((p) => {
        if (p.id === period.id) return true;
        if (!p.analysisStart || !p.analysisEnd) return false;
        return datesOverlap(
          period.analysisStart, period.analysisEnd,
          p.analysisStart, p.analysisEnd,
        );
      });

      if (overlaps.length > 0) {
        setBizPreview({ period, analysis: { periodId: period.id, attributions: [], summary: '', generatedAt: '' } });
        setBizPending(period);
        setBizOverlapNames(overlaps.map((p) => formatDateLabel(p.analysisStart, p.analysisEnd)));
      } else {
        await doSavePeriod(period);
      }
    } catch (e) {
      setBizError((e as Error).message);
      setBizParsing(false);
    }
  };

  const doSavePeriod = async (period: DataPeriod) => {
    setBizSaving(true);
    setBizPending(null);
    try {
      const result = await addPeriod(period);
      setBizPreview({ period, analysis: result.analysis });
      if (result.replacedPeriods.length > 0) {
        setBizReplaced(result.replacedPeriods.map((p) => formatDateLabel(p.analysisStart, p.analysisEnd)));
      }
    } catch (e) {
      setBizError((e as Error).message);
    } finally {
      setBizSaving(false);
    }
  };

  const handleConfirmOverwrite = () => {
    if (bizPending) {
      doSavePeriod(bizPending);
    }
  };

  const handleCancelUpload = () => {
    setBizFile(null);
    setBizPreview(null);
    setBizPending(null);
    setBizOverlapNames([]);
    setBizReplaced([]);
  };

  const handleRefundFile = async (f: File) => {
    setRefundFile(f);
    setRefundError(null);
    setRefundPreview(null);
    setRefundParsing(true);
    try {
      const dataset = await parseRefundExcel(f);
      await saveRefundDataset(dataset);
      setRefundPreview(dataset);
    } catch (e) {
      setRefundError((e as Error).message);
    } finally {
      setRefundParsing(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkDir.trim()) return;
    setBulkImporting(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const result = await bulkImportFromDirectory(bulkDir.trim());
      setBulkResult(result);
      if (result.errors.length > 0) {
        setBulkError(`${result.errors.length} 个文件解析失败`);
      }
    } catch (e) {
      setBulkError((e as Error).message);
    } finally {
      setBulkImporting(false);
    }
  };

  const coreKeys = ['gmv', 'orders', 'customers', 'itemsSold', 'aov'] as const;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">上传数据</h2>
          <p className="text-sm text-slate-400 mt-1">上传 TikTok 后台导出的经营数据或售后退货数据</p>
        </div>

        {/* BULK IMPORT */}
        <div className="glass-card rounded-xl p-5 space-y-4 card-hover">
          <div>
            <h3 className="text-base font-semibold text-slate-200">批量导入</h3>
            <p className="text-sm text-slate-400 mt-1">输入文件夹路径，一次性导入所有 Excel 文件</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-sm bg-white/5 text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="例如：/Users/vigo/Desktop/周度数据"
              value={bulkDir}
              onChange={(e) => setBulkDir(e.target.value)}
              disabled={bulkImporting}
            />
            <button
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all btn-press whitespace-nowrap"
              onClick={handleBulkImport}
              disabled={bulkImporting || !bulkDir.trim()}
            >
              {bulkImporting ? '导入中...' : '批量导入'}
            </button>
          </div>

          {bulkImporting && (
            <div className="bg-emerald-500/10 rounded-lg p-3 text-sm text-emerald-300 animate-pulse">
              正在解析文件夹中的 Excel 文件...
            </div>
          )}

          {bulkError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
              <span className="font-medium">导入出错：</span>{bulkError}
            </div>
          )}

          {bulkResult && (
            <div className="bg-emerald-500/10 rounded-lg p-4 text-sm text-emerald-300 space-y-1 animate-scale-in">
              <p className="font-medium">导入完成</p>
              <p>成功导入 <span className="font-bold">{bulkResult.count}</span> / {bulkResult.total} 个文件</p>
              {bulkResult.errors.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {bulkResult.errors.map((e, i) => (
                    <li key={i} className="text-red-400">{e.file}: {e.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* TAB SWITCHER */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all btn-press ${
              activeTab === 'biz' ? 'bg-white/5 text-white shadow-sm' : 'text-slate-400 hover:text-slate-400'
            }`}
            onClick={() => setActiveTab('biz')}
          >
            经营数据
          </button>
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all btn-press ${
              activeTab === 'refund' ? 'bg-white/5 text-white shadow-sm' : 'text-slate-400 hover:text-slate-400'
            }`}
            onClick={() => setActiveTab('refund')}
          >
            售后/退货数据
          </button>
        </div>

        {/* BUSINESS DATA */}
        {activeTab === 'biz' && (
          <>
            <FileDropzone onFile={handleBizFile} disabled={bizParsing || bizSaving} />

            {bizParsing && (
              <div className="glass-card rounded-xl p-6 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium">{bizStage}</span>
                  <span className="text-emerald-400 font-semibold">{bizProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${bizProgress}%` }}
                  />
                </div>
              </div>
            )}

            {bizError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300 animate-scale-in">
                <span className="font-medium">解析失败：</span>{bizError}
              </div>
            )}

            {bizPending && bizOverlapNames.length > 0 && (
              <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-5 space-y-4 animate-scale-in">
                <div>
                  <p className="text-base font-semibold text-amber-300 flex items-center gap-2">
                    <AlertTriangle size={18} strokeWidth={1.75} />
                    检测到日期范围重叠
                  </p>
                  <p className="text-sm text-amber-300/80 mt-1">
                    新数据周期 <span className="font-medium">{formatDateLabel(bizPending.analysisStart, bizPending.analysisEnd)}</span> 与以下已有数据重叠：
                  </p>
                  <ul className="mt-2 space-y-1">
                    {bizOverlapNames.map((name, i) => (
                      <li key={i} className="text-amber-300/80 flex items-center gap-2 text-sm">
                        <span className="text-amber-400">•</span> {name}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-400 mt-2">确认后将自动移除旧数据，替换为新上传的数据。</p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-all btn-press"
                    onClick={handleConfirmOverwrite}
                  >
                    确认替换
                  </button>
                  <button
                    className="border border-amber-500/30 text-amber-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-all btn-press"
                    onClick={handleCancelUpload}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {bizPreview && (
              <div className="glass-card rounded-xl overflow-hidden animate-scale-in">
                <div className="px-5 py-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle size={20} strokeWidth={1.75} className="text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-300 text-sm">
                      {bizPending ? '数据解析完成（等待确认）' : bizSaving ? '数据解析成功（正在保存...）' : '数据已就绪'}
                    </p>
                    <p className="text-xs text-emerald-400">
                      文件: {bizFile?.name} | 周期: {formatDateLabel(bizPreview.period.analysisStart, bizPreview.period.analysisEnd)}
                      {bizSaving && <span className="ml-2 text-amber-400">正在保存和分析...</span>}
                    </p>
                    {bizReplaced.length > 0 && (
                      <p className="text-xs text-amber-400 mt-1">
                        已移除 {bizReplaced.length} 个重叠周期: {bizReplaced.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="text-base font-semibold text-slate-200 mb-3">核心指标概览</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {coreKeys.map((key) => {
                      const val = bizPreview.period.overview[key];
                      const change = bizPreview.period.overviewChange[key];
                      return (
                        <div key={key} className="bg-white/5 rounded-lg p-4">
                          <div className="text-xs text-slate-400 uppercase tracking-wide">{key}</div>
                          <div className="text-lg font-bold text-slate-200 mt-1 tabular-nums">
                            {key === 'gmv' || key === 'aov' ? formatCurrency(val) : formatNumber(val)}
                          </div>
                          <div className={`text-xs mt-1 font-medium ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                            {formatPercent(change)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {bizPreview.analysis.summary && (
                    <div className="mt-5 p-4 bg-emerald-500/10 rounded-lg text-sm text-emerald-300">
                      <span className="font-medium">分析：</span>{bizPreview.analysis.summary}
                    </div>
                  )}
                  {!bizPending && (
                    <div className="mt-5 flex gap-3">
                      <button className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all btn-press" onClick={() => navigate(`/analysis/${bizPreview.period.id}`)}>
                        查看详细分析
                      </button>
                      <button className="border border-slate-600 text-slate-400 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-all btn-press" onClick={() => { setBizFile(null); setBizPreview(null); }}>
                        继续上传
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* REFUND DATA */}
        {activeTab === 'refund' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
              上传 TikTok 后台导出的退货/售后 Excel 数据。如日期重复将自动覆盖为新数据。
            </div>

            <FileDropzone onFile={handleRefundFile} disabled={refundParsing} />

            {refundParsing && (
              <div className="glass-card rounded-xl p-6 text-center animate-pulse">
                <div className="text-sm text-slate-400">正在解析售后数据...</div>
              </div>
            )}

            {refundError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300 animate-scale-in">
                <span className="font-medium">解析失败：</span>{refundError}
              </div>
            )}

            {refundPreview && (
              <div className="glass-card rounded-xl overflow-hidden animate-scale-in">
                <div className="px-5 py-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle size={20} strokeWidth={1.75} className="text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-300 text-sm">售后数据上传成功</p>
                    <p className="text-xs text-emerald-400">
                      文件: {refundFile?.name} | {refundPreview.rows.length} 条退货记录 | {refundPreview.dateRange.start} ~ {refundPreview.dateRange.end}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="text-base font-semibold text-slate-200 mb-3">退货数据概览</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-slate-400">退货总数</div>
                      <div className="text-xl font-bold text-slate-200 tabular-nums">{refundPreview.rows.length}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-slate-400">退货总金额</div>
                      <div className="text-xl font-bold text-slate-200 tabular-nums">
                        {formatCurrency(refundPreview.rows.reduce((s, r) => s + r.orderAmount, 0))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all btn-press" onClick={() => navigate('/after-sales')}>
                      查看售后看板
                    </button>
                    <button className="border border-slate-600 text-slate-400 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-all btn-press" onClick={() => { setRefundFile(null); setRefundPreview(null); }}>
                      继续上传
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
