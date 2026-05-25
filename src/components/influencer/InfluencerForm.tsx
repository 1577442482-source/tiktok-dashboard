import { useState, useEffect } from 'react';
import { useInfluencerStore } from '../../store/influencerStore';
import { PIPELINE_STAGES, PIPELINE_LABELS, type Influencer, type PipelineStage } from '../../types/influencer';

interface Props {
  editingId: string | null;
  onClose: () => void;
}

const empty: Omit<Influencer, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  platform: 'TikTok',
  handle: '',
  followers: 0,
  category: [],
  contactInfo: '',
  status: 'pending',
  notes: '',
};

export default function InfluencerForm({ editingId, onClose }: Props) {
  const { influencers, addInfluencer, updateInfluencer } = useInfluencerStore();
  const [form, setForm] = useState(empty);
  const [catInput, setCatInput] = useState('');

  useEffect(() => {
    if (editingId) {
      const inf = influencers.find(i => i.id === editingId);
      if (inf) {
        const { id, createdAt, updatedAt, ...rest } = inf;
        setForm(rest);
        setCatInput(rest.category.join(', '));
      }
    }
  }, [editingId, influencers]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    const categories = catInput.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    if (editingId) {
      const inf = influencers.find(i => i.id === editingId);
      await updateInfluencer({
        id: editingId,
        ...form,
        category: categories,
        createdAt: inf?.createdAt || now,
        updatedAt: now,
      } as Influencer);
    } else {
      await addInfluencer({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        ...form,
        category: categories,
        createdAt: now,
        updatedAt: now,
      } as Influencer);
    }
    onClose();
  };

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {editingId ? '编辑达人' : '添加达人'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">姓名 *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="达人姓名"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">平台</label>
              <select
                value={form.platform}
                onChange={e => set('platform', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option>TikTok</option>
                <option>Instagram</option>
                <option>YouTube</option>
                <option>Facebook</option>
                <option>Kuaishou</option>
                <option>Douyin</option>
                <option>其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">账号</label>
              <input
                value={form.handle}
                onChange={e => set('handle', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="@username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">粉丝量</label>
            <input
              type="number"
              value={form.followers || ''}
              onChange={e => set('followers', Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">品类标签（逗号分隔）</label>
            <input
              value={catInput}
              onChange={e => setCatInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="美妆, 服饰, 3C"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">联系方式</label>
            <input
              value={form.contactInfo}
              onChange={e => set('contactInfo', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="微信/邮箱/电话"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">合作状态</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {PIPELINE_STAGES.map(s => (
                <option key={s} value={s}>{PIPELINE_LABELS[s as PipelineStage]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            {editingId ? '保存修改' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
