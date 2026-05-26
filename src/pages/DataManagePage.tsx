import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import PageTransition from '../components/ui/PageTransition';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDateLabel, formatCurrency, formatNumber } from '../utils/formatters';

export default function DataManagePage() {
  const { periods, loading, loadPeriods, removePeriod } = useDataStore();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPeriods();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageTransition>
    );
  }

  if (periods.length === 0) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="inline-flex p-5 bg-white/5 rounded-full mb-5">
            <Database size={48} strokeWidth={1.5} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">暂无数据</h2>
          <p className="text-base text-slate-400">还没有上传任何数据</p>
        </div>
      </PageTransition>
    );
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await removePeriod(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white">数据管理</h2>
          <p className="text-sm text-slate-400 mt-1">管理已上传的数据周期</p>
        </div>

        <div className="glass-card rounded-xl overflow-hidden card-hover">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="text-left px-5 py-3.5 font-medium text-slate-400">分析周期</th>
                  <th className="text-left px-5 py-3.5 font-medium text-slate-400">类型</th>
                  <th className="text-left px-5 py-3.5 font-medium text-slate-400">对比周期</th>
                  <th className="text-left px-5 py-3.5 font-medium text-slate-400">GMV</th>
                  <th className="text-left px-5 py-3.5 font-medium text-slate-400">Orders</th>
                  <th className="text-left px-5 py-3.5 font-medium text-slate-400">上传时间</th>
                  <th className="text-right px-5 py-3.5 font-medium text-slate-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {periods.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors duration-150">
                    <td className="px-5 py-3.5 font-medium text-slate-200">
                      {formatDateLabel(p.analysisStart, p.analysisEnd)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        p.type === 'monthly' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {p.type === 'monthly' ? '月度' : '周度'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {formatDateLabel(p.comparisonStart, p.comparisonEnd)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-200 tabular-nums">
                      {formatCurrency(p.overview.gmv)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 tabular-nums">
                      {formatNumber(p.overview.orders)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(p.uploadedAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        className="text-emerald-400 hover:text-emerald-300 text-sm mr-4 transition-colors"
                        onClick={() => navigate(`/analysis/${p.id}`)}
                      >
                        查看
                      </button>
                      <button
                        className={`text-sm transition-all ${
                          deleteConfirm === p.id
                            ? 'text-red-400 font-medium'
                            : 'text-slate-400 hover:text-red-400'
                        }`}
                        onClick={() => handleDelete(p.id)}
                      >
                        {deleteConfirm === p.id ? '确认删除' : '删除'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
