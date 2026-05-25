import { useInfluencerStore } from '../../store/influencerStore';
import { PIPELINE_STAGES, PIPELINE_LABELS, PIPELINE_COLORS, type PipelineStage } from '../../types/influencer';

export default function PipelineBoard() {
  const { influencers, updateInfluencer } = useInfluencerStore();

  const grouped: Record<PipelineStage, typeof influencers> = {} as Record<PipelineStage, typeof influencers>;
  for (const stage of PIPELINE_STAGES) {
    grouped[stage] = influencers.filter(inf => inf.status === stage);
  }

  const handleStageChange = async (inf: (typeof influencers)[0], direction: 'prev' | 'next') => {
    const idx = PIPELINE_STAGES.indexOf(inf.status);
    const newIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= PIPELINE_STAGES.length) return;
    const updated = { ...inf, status: PIPELINE_STAGES[newIdx] as PipelineStage };
    await updateInfluencer(updated);
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3" style={{ minWidth: PIPELINE_STAGES.length * 180 }}>
        {PIPELINE_STAGES.map(stage => (
          <div key={stage} className="flex-1 min-w-[160px] bg-slate-50 rounded-xl p-3">
            <div className={`text-xs font-semibold mb-2 px-2.5 py-1 rounded-full inline-block ${PIPELINE_COLORS[stage]}`}>
              {PIPELINE_LABELS[stage]}
              <span className="ml-1.5 opacity-70">{grouped[stage].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[stage].map(inf => (
                <div key={inf.id} className="bg-white rounded-lg p-2.5 border border-slate-100 shadow-sm">
                  <div className="text-sm font-medium text-slate-800 truncate">{inf.name}</div>
                  <div className="text-xs text-slate-400 truncate">{inf.handle || inf.platform}</div>
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleStageChange(inf, 'prev')}
                      disabled={PIPELINE_STAGES.indexOf(stage) === 0}
                      className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleStageChange(inf, 'next')}
                      disabled={PIPELINE_STAGES.indexOf(stage) === PIPELINE_STAGES.length - 1}
                      className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
              {grouped[stage].length === 0 && (
                <div className="text-xs text-slate-300 text-center py-4">空</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
