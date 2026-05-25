import { useState } from 'react';
import { useInfluencerStore } from '../../store/influencerStore';
import { PIPELINE_LABELS, PIPELINE_COLORS } from '../../types/influencer';
import { formatNumber } from '../../utils/formatters';

const PLATFORM_ICONS: Record<string, string> = {
  TikTok: '🎵',
  Instagram: '📷',
  YouTube: '▶️',
  Facebook: '📘',
  Kuaishou: '⚡',
  Douyin: '🎶',
};

export default function InfluencerTable() {
  const { influencers, setSelectedInfluencer, selectedInfluencerId, removeInfluencer } = useInfluencerStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = influencers.filter(inf => {
    if (statusFilter !== 'all' && inf.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inf.name.toLowerCase().includes(q) ||
        inf.handle.toLowerCase().includes(q) ||
        inf.category.some(c => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索姓名 / 账号 / 品类..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">全部状态</option>
          {Object.entries(PIPELINE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {influencers.length === 0 ? '暂无达人，点击上方按钮添加' : '无匹配结果'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-500">达人</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">平台</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">粉丝量</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">品类</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">状态</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">联系方式</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(inf => (
                <tr
                  key={inf.id}
                  className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedInfluencerId === inf.id ? 'bg-indigo-50/50' : ''}`}
                  onClick={() => setSelectedInfluencer(selectedInfluencerId === inf.id ? null : inf.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{inf.name}</div>
                    <div className="text-xs text-slate-400">{inf.handle}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {PLATFORM_ICONS[inf.platform] || ''} {inf.platform}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {inf.followers > 0 ? formatNumber(inf.followers) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {inf.category.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PIPELINE_COLORS[inf.status]}`}>
                      {PIPELINE_LABELS[inf.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">{inf.contactInfo || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); removeInfluencer(inf.id); }}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
