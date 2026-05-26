import { ChevronLeft, ChevronRight } from 'lucide-react';
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
          <div key={stage} className="flex-1 min-w-[160px] bg-white/5 rounded-xl p-3">
            <div className={`text-xs font-semibold mb-2 px-2.5 py-1 rounded-full inline-block ${PIPELINE_COLORS[stage]}`}>
              {PIPELINE_LABELS[stage]}
              <span className="ml-1.5 opacity-70">{grouped[stage].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[stage].map(inf => (
                <div key={inf.id} className="glass-card rounded-lg p-2.5 border border-white/5 shadow-sm card-hover">
                  <div className="text-sm font-medium text-slate-200 truncate">{inf.name}</div>
                  <div className="text-xs text-slate-400 truncate">{inf.handle || inf.platform}</div>
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleStageChange(inf, 'prev')}
                      disabled={PIPELINE_STAGES.indexOf(stage) === 0}
                      className="text-xs p-1 rounded bg-white/5 text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={14} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleStageChange(inf, 'next')}
                      disabled={PIPELINE_STAGES.indexOf(stage) === PIPELINE_STAGES.length - 1}
                      className="text-xs p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
              {grouped[stage].length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">空</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
