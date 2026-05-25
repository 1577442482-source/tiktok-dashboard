import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import { formatDateLabel, formatCurrency, formatNumber } from '../utils/formatters';

export default function DataManagePage() {
  const { periods, loading, loadPeriods, removePeriod } = useDataStore();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPeriods();
  }, []);

  if (loading) {
    return <div className="text-slate-400">加载中...</div>;
  }

  if (periods.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">暂无数据</h2>
        <p className="text-base text-slate-500">还没有上传任何数据</p>
      </div>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">数据管理</h2>
        <p className="text-base text-slate-500 mt-1">管理已上传的数据周期</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3.5 font-medium text-slate-600">分析周期</th>
                <th className="text-left px-5 py-3.5 font-medium text-slate-600">类型</th>
                <th className="text-left px-5 py-3.5 font-medium text-slate-600">对比周期</th>
                <th className="text-left px-5 py-3.5 font-medium text-slate-600">GMV</th>
                <th className="text-left px-5 py-3.5 font-medium text-slate-600">Orders</th>
                <th className="text-left px-5 py-3.5 font-medium text-slate-600">上传时间</th>
                <th className="text-right px-5 py-3.5 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {formatDateLabel(p.analysisStart, p.analysisEnd)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm px-2.5 py-1 rounded-full ${
                      p.type === 'monthly' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.type === 'monthly' ? '月度' : '周度'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {formatDateLabel(p.comparisonStart, p.comparisonEnd)}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {formatCurrency(p.overview.gmv)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {formatNumber(p.overview.orders)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-sm">
                    {new Date(p.uploadedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      className="text-indigo-600 hover:text-indigo-800 text-base mr-4"
                      onClick={() => navigate(`/analysis/${p.id}`)}
                    >
                      查看
                    </button>
                    <button
                      className={`text-base ${
                        deleteConfirm === p.id
                          ? 'text-red-600 font-medium'
                          : 'text-slate-400 hover:text-red-500'
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
  );
}
