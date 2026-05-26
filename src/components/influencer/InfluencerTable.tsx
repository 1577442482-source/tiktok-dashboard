import { useState } from 'react';
import { useInfluencerStore } from '../../store/influencerStore';
import { PIPELINE_LABELS, PIPELINE_COLORS } from '../../types/influencer';
import { formatNumber } from '../../utils/formatters';

const PLATFORM_LABELS: Record<string, string> = {
  TikTok: 'TikTok',
  Instagram: 'Instagram',
  YouTube: 'YouTube',
  Facebook: 'Facebook',
  Kuaishou: '快手',
  Douyin: '抖音',
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
          className="flex-1 px-3 py-2 border border-white/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-shadow"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-white/5 rounded-lg text-sm bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="all">全部状态</option>
          {Object.entries(PIPELINE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {influencers.length === 0 ? '暂无达人，点击上方按钮添加' : '无匹配结果'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 font-medium text-slate-400">达人</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">平台</th>
                <th className="text-right px-4 py-3 font-medium text-slate-400">粉丝量</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">品类</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">状态</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">联系方式</th>
                <th className="text-right px-4 py-3 font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(inf => (
                <tr
                  key={inf.id}
                  className={`hover:bg-white/5 cursor-pointer transition-colors duration-150 ${selectedInfluencerId === inf.id ? 'bg-emerald-500/10' : ''}`}
                  onClick={() => setSelectedInfluencer(selectedInfluencerId === inf.id ? null : inf.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{inf.name}</div>
                    <div className="text-xs text-slate-400">{inf.handle}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {PLATFORM_LABELS[inf.platform] || inf.platform}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-400 tabular-nums">
                    {inf.followers > 0 ? formatNumber(inf.followers) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {inf.category.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-white/5 text-slate-400 rounded text-xs">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PIPELINE_COLORS[inf.status]}`}>
                      {PIPELINE_LABELS[inf.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[120px] truncate">{inf.contactInfo || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); removeInfluencer(inf.id); }}
                      className="text-xs text-red-500 hover:text-red-300 px-2 py-1 transition-colors"
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
