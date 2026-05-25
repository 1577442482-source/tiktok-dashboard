import { useInfluencerStore } from '../../store/influencerStore';
import type { PipelineStage } from '../../types/influencer';

export default function InfluencerStats() {
  const { influencers, shipments, getPipelineCounts } = useInfluencerStore();
  const pipelineCounts = getPipelineCounts();

  const inTransit = shipments.filter(s => s.status === 'in_transit' || s.status === 'pending').length;
  const delivered = shipments.filter(s => s.status === 'delivered' && !s.acknowledged).length;
  const totalShipments = shipments.length;

  const stagesSummary = [
    { stage: 'pending' as PipelineStage, label: '待联系' },
    { stage: 'confirmed' as PipelineStage, label: '已确认' },
    { stage: 'sample_sent' as PipelineStage, label: '样品已寄' },
    { stage: 'published' as PipelineStage, label: '已发布' },
    { stage: 'settled' as PipelineStage, label: '已结算' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stagesSummary.map(({ stage, label }) => (
        <div key={stage} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">{label}</div>
          <div className={`text-2xl font-bold ${pipelineCounts[stage] ? 'text-slate-800' : 'text-slate-300'}`}>
            {pipelineCounts[stage] || 0}
          </div>
        </div>
      ))}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-xs text-slate-500 mb-1">物流在途</div>
        <div className={`text-2xl font-bold ${inTransit > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{inTransit}</div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-xs text-slate-500 mb-1">待确认签收</div>
        <div className={`text-2xl font-bold ${delivered > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{delivered}</div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-xs text-slate-500 mb-1">合作达人总数</div>
        <div className={`text-2xl font-bold ${influencers.length > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{influencers.length}</div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-xs text-slate-500 mb-1">物流总数</div>
        <div className={`text-2xl font-bold ${totalShipments > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{totalShipments}</div>
      </div>
    </div>
  );
}
