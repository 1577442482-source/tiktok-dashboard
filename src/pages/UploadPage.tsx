import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileDropzone from '../components/upload/FileDropzone';
import { parseExcelFile } from '../services/excelParser';
import { parseRefundExcel } from '../services/refundParser';
import { saveRefundDataset } from '../services/refundStorage';
import { useDataStore } from '../store/dataStore';
import type { DataPeriod, AnalysisResult } from '../types';
import type { RefundDataset } from '../types/refund';
import { formatDateLabel, formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

type UploadTab = 'biz' | 'refund';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<UploadTab>('biz');

  // Business data state
  const [bizFile, setBizFile] = useState<File | null>(null);
  const [bizParsing, setBizParsing] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);
  const [bizPreview, setBizPreview] = useState<{ period: DataPeriod; analysis: AnalysisResult } | null>(null);

  // Refund data state
  const [refundFile, setRefundFile] = useState<File | null>(null);
  const [refundParsing, setRefundParsing] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundPreview, setRefundPreview] = useState<RefundDataset | null>(null);

  const { addPeriod } = useDataStore();
  const navigate = useNavigate();

  const handleBizFile = async (f: File) => {
    setBizFile(f);
    setBizError(null);
    setBizPreview(null);
    setBizParsing(true);
    try {
      const period = parseExcelFile(f);
      const result = await addPeriod(await period);
      setBizPreview({ period: await period, analysis: result.analysis });
    } catch (e) {
      setBizError((e as Error).message);
    } finally {
      setBizParsing(false);
    }
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

  const coreKeys = ['gmv', 'orders', 'customers', 'itemsSold', 'aov'] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">上传数据</h2>
        <p className="text-base text-slate-500 mt-1">上传 TikTok 后台导出的经营数据或售后退货数据</p>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          className={`px-5 py-2 rounded-lg text-base font-medium transition-all ${
            activeTab === 'biz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('biz')}
        >
          经营数据
        </button>
        <button
          className={`px-5 py-2 rounded-lg text-base font-medium transition-all ${
            activeTab === 'refund' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('refund')}
        >
          售后/退货数据
        </button>
      </div>

      {/* ==================== BUSINESS DATA ==================== */}
      {activeTab === 'biz' && (
        <>
          <FileDropzone onFile={handleBizFile} disabled={bizParsing} />

          {bizParsing && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <div className="animate-pulse text-slate-500">正在解析文件...</div>
            </div>
          )}

          {bizError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-base text-red-700">
              <span className="font-medium">解析失败：</span>{bizError}
            </div>
          )}

          {bizPreview && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                <span className="text-emerald-600 text-lg">✅</span>
                <div>
                  <p className="font-semibold text-emerald-800">数据上传成功</p>
                  <p className="text-sm text-emerald-600">
                    文件: {bizFile?.name} | 周期: {formatDateLabel(bizPreview.period.analysisStart, bizPreview.period.analysisEnd)}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <h4 className="text-lg font-semibold text-slate-800 mb-3">核心指标概览</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {coreKeys.map((key) => {
                    const val = bizPreview.period.overview[key];
                    const change = bizPreview.period.overviewChange[key];
                    return (
                      <div key={key} className="bg-slate-50 rounded-lg p-4">
                        <div className="text-sm text-slate-400">{key.toUpperCase()}</div>
                        <div className="text-lg font-bold text-slate-800 mt-1">
                          {key === 'gmv' || key === 'aov' ? formatCurrency(val) : formatNumber(val)}
                        </div>
                        <div className={`text-sm mt-1 ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {formatPercent(change)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {bizPreview.analysis.summary && (
                  <div className="mt-5 p-4 bg-indigo-50 rounded-lg text-base text-indigo-700">
                    <span className="font-medium">AI 分析：</span>{bizPreview.analysis.summary}
                  </div>
                )}
                <div className="mt-5 flex gap-3">
                  <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-indigo-700 transition-colors" onClick={() => navigate(`/analysis/${bizPreview.period.id}`)}>
                    查看详细分析
                  </button>
                  <button className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-base font-medium hover:bg-slate-50 transition-colors" onClick={() => { setBizFile(null); setBizPreview(null); }}>
                    继续上传
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== REFUND DATA ==================== */}
      {activeTab === 'refund' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            上传 TikTok 后台导出的退货/售后 Excel 数据。如日期重复将自动覆盖为新数据。
          </div>

          <FileDropzone onFile={handleRefundFile} disabled={refundParsing} />

          {refundParsing && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <div className="animate-pulse text-slate-500">正在解析售后数据...</div>
            </div>
          )}

          {refundError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-base text-red-700">
              <span className="font-medium">解析失败：</span>{refundError}
            </div>
          )}

          {refundPreview && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                <span className="text-emerald-600 text-lg">✅</span>
                <div>
                  <p className="font-semibold text-emerald-800">售后数据上传成功</p>
                  <p className="text-sm text-emerald-600">
                    文件: {refundFile?.name} | {refundPreview.rows.length} 条退货记录 | {refundPreview.dateRange.start} ~ {refundPreview.dateRange.end}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <h4 className="text-lg font-semibold text-slate-800 mb-3">退货数据概览</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-slate-400">退货总数</div>
                    <div className="text-xl font-bold text-slate-800">{refundPreview.rows.length}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-slate-400">退货总金额</div>
                    <div className="text-xl font-bold text-slate-800">
                      {formatCurrency(refundPreview.rows.reduce((s, r) => s + r.orderAmount, 0))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-indigo-700 transition-colors" onClick={() => navigate('/after-sales')}>
                    查看售后看板
                  </button>
                  <button className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-base font-medium hover:bg-slate-50 transition-colors" onClick={() => { setRefundFile(null); setRefundPreview(null); }}>
                    继续上传
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
