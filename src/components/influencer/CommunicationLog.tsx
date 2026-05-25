import { useState } from 'react';
import { useInfluencerStore } from '../../store/influencerStore';
import { CONTACT_METHODS } from '../../types/influencer';
import type { CommLog } from '../../types/influencer';

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

  // If an influencer is selected, show only their logs; otherwise show all
  const logs = selectedInfluencerId
    ? commLogs.filter(l => l.influencerId === selectedInfluencerId)
    : commLogs;

  const getName = (id: string) => influencers.find(i => i.id === id)?.name || '未知达人';

  return (
    <div>
      {selectedInfluencerId && (
        <div className="mb-3 text-sm text-slate-500">
          当前筛选：<span className="font-medium text-slate-700">{getName(selectedInfluencerId)}</span>
          <button onClick={() => setSelectedInfluencer(null)} className="ml-2 text-indigo-500 hover:text-indigo-700">清除</button>
        </div>
      )}

      <button
        onClick={() => setShowForm(true)}
        className="mb-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
      >
        + 添加沟通记录
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">添加沟通记录</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              {!selectedInfluencerId && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">达人</label>
                  <p className="text-sm text-amber-600">请先在达人列表中点击选择一位达人</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">沟通方式</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">内容</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="记录沟通内容..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">取消</button>
              <button onClick={handleSubmit} disabled={!selectedInfluencerId} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">保存</button>
            </div>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">暂无沟通记录</div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100">
              <div className="shrink-0 w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-lg">
                {log.method === '私信' ? '💬' : log.method === '邮件' ? '📧' : log.method === '微信' ? '💚' : log.method === '电话' ? '📞' : '📝'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!selectedInfluencerId && (
                    <button
                      onClick={() => setSelectedInfluencer(log.influencerId)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {getName(log.influencerId)}
                    </button>
                  )}
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">{log.method}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(log.date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.content}</p>
              </div>
              <button
                onClick={() => removeCommLog(log.id)}
                className="shrink-0 text-xs text-slate-300 hover:text-red-500 self-start"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
