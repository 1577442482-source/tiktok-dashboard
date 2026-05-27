import { useState } from 'react';
import { MessageCircle, Mail, Phone, FileText, MessageSquare } from 'lucide-react';
import { useInfluencerStore } from '../../store/influencerStore';
import { CONTACT_METHODS } from '../../types/influencer';
import type { CommLog } from '../../types/influencer';

const METHOD_ICONS: Record<string, typeof MessageCircle> = {
  '私信': MessageCircle,
  '邮件': Mail,
  '微信': MessageSquare,
  '电话': Phone,
};

export default function CommunicationLog() {
  const { influencers, commLogs, selectedInfluencerId, setSelectedInfluencer, addCommLog, removeCommLog } = useInfluencerStore();
  const [showForm, setShowForm] = useState(false);
  const [method, setMethod] = useState('私信');
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    const log: CommLog = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      influencerId: selectedInfluencerId || '',
      date: new Date().toISOString(),
      method,
      content: content.trim(),
    };
    await addCommLog(log);
    setContent('');
    setShowForm(false);
  };

  const logs = selectedInfluencerId
    ? commLogs.filter(l => l.influencerId === selectedInfluencerId)
    : commLogs;

  const getName = (id: string) => influencers.find(i => i.id === id)?.name || '未知达人';

  return (
    <div>
      {selectedInfluencerId && (
        <div className="mb-3 text-sm text-slate-400">
          当前筛选：<span className="font-medium text-slate-400">{getName(selectedInfluencerId)}</span>
          <button onClick={() => setSelectedInfluencer(null)} className="ml-2 text-emerald-500 hover:text-emerald-300 text-sm transition-colors">清除</button>
        </div>
      )}

      <button
        onClick={() => setShowForm(true)}
        className="mb-4 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all btn-press"
      >
        + 添加沟通记录
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="glass-card rounded-2xl shadow-xl w-full max-w-md mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-200">添加沟通记录</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-400 text-xl leading-none transition-colors">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              {!selectedInfluencerId && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">达人</label>
                  <p className="text-sm text-amber-400">请先在达人列表中点击选择一位达人</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">沟通方式</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-white/5 rounded-lg text-sm bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">内容</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-white/5 rounded-lg text-sm bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="记录沟通内容..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 rounded-lg transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={!selectedInfluencerId} className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-all btn-press">保存</button>
            </div>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">暂无沟通记录</div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => {
            const IconComponent = METHOD_ICONS[log.method] || FileText;
            return (
              <div key={log.id} className="flex gap-4 p-4 glass-card rounded-xl border-white/5 card-hover">
                <div className="shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <IconComponent size={18} strokeWidth={1.5} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!selectedInfluencerId && (
                      <button
                        onClick={() => setSelectedInfluencer(log.influencerId)}
                        className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {getName(log.influencerId)}
                      </button>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-white/5 text-slate-400 rounded">{log.method}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(log.date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 whitespace-pre-wrap">{log.content}</p>
                </div>
                <button
                  onClick={() => removeCommLog(log.id)}
                  className="shrink-0 text-xs text-slate-400 hover:text-red-500 self-start transition-colors"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
