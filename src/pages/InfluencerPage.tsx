import { useEffect, useState } from 'react';
import { useInfluencerStore } from '../store/influencerStore';
import type { InfluencerTab } from '../store/influencerStore';
import DeliveryAlerts from '../components/influencer/DeliveryAlerts';
import InfluencerStats from '../components/influencer/InfluencerStats';
import InfluencerTable from '../components/influencer/InfluencerTable';
import InfluencerForm from '../components/influencer/InfluencerForm';
import PipelineBoard from '../components/influencer/PipelineBoard';
import TrackingTable from '../components/influencer/TrackingTable';
import TrackingInput from '../components/influencer/TrackingInput';
import CommunicationLog from '../components/influencer/CommunicationLog';

const TABS: { key: InfluencerTab; label: string }[] = [
  { key: 'influencers', label: '达人列表' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'tracking', label: '物流追踪' },
  { key: 'commlog', label: '沟通记录' },
];

export default function InfluencerPage() {
  const { loadAll, loading, activeTab, setActiveTab, refreshAllShipments } = useInfluencerStore();
  const [showForm, setShowForm] = useState(false);
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">达人建联</h2>
          <p className="text-base text-slate-500 mt-1">管理达人合作、追踪样品物流</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshAllShipments()}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
          >
            刷新物流
          </button>
          {activeTab === 'influencers' && (
            <button
              onClick={() => { setEditingId(null); setShowForm(true); }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              + 添加达人
            </button>
          )}
          {activeTab === 'tracking' && (
            <button
              onClick={() => setShowTrackingInput(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              + 录入物流
            </button>
          )}
        </div>
      </div>

      <DeliveryAlerts />
      <InfluencerStats />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">加载中...</div>
        ) : (
          <>
            {activeTab === 'influencers' && <InfluencerTable />}
            {activeTab === 'pipeline' && <PipelineBoard />}
            {activeTab === 'tracking' && <TrackingTable />}
            {activeTab === 'commlog' && <CommunicationLog />}
          </>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <InfluencerForm
          editingId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
        />
      )}
      {showTrackingInput && (
        <TrackingInput onClose={() => setShowTrackingInput(false)} />
      )}
    </div>
  );
}
