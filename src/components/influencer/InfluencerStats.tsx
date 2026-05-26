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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {stagesSummary.map(({ stage, label }) => (
        <div key={stage} className="glass-card rounded-xl p-5 card-hover animate-fade-in-up">
          <div className="text-xs text-slate-400 mb-1">{label}</div>
          <div className={`text-2xl font-bold tabular-nums ${pipelineCounts[stage] ? 'text-slate-200' : 'text-slate-400'}`}>
            {pipelineCounts[stage] || 0}
          </div>
        </div>
      ))}
      <div className="glass-card rounded-xl p-5 card-hover animate-fade-in-up">
        <div className="text-xs text-slate-400 mb-1">物流在途</div>
        <div className={`text-2xl font-bold tabular-nums ${inTransit > 0 ? 'text-blue-400' : 'text-slate-400'}`}>{inTransit}</div>
      </div>
      <div className="glass-card rounded-xl p-5 card-hover animate-fade-in-up">
        <div className="text-xs text-slate-400 mb-1">待确认签收</div>
        <div className={`text-2xl font-bold tabular-nums ${delivered > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{delivered}</div>
      </div>
      <div className="glass-card rounded-xl p-5 card-hover animate-fade-in-up">
        <div className="text-xs text-slate-400 mb-1">合作达人总数</div>
        <div className={`text-2xl font-bold tabular-nums ${influencers.length > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{influencers.length}</div>
      </div>
      <div className="glass-card rounded-xl p-5 card-hover animate-fade-in-up">
        <div className="text-xs text-slate-400 mb-1">物流总数</div>
        <div className={`text-2xl font-bold tabular-nums ${totalShipments > 0 ? 'text-slate-200' : 'text-slate-400'}`}>{totalShipments}</div>
      </div>
    </div>
  );
}
