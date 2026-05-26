import { useState } from 'react';
import { Package, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { useInfluencerStore } from '../../store/influencerStore';

export default function DeliveryAlerts() {
  const { getDeliveryAlerts, updateShipment } = useInfluencerStore();
  const [expanded, setExpanded] = useState(true);
  const alerts = getDeliveryAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-amber-500/20/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Package size={18} strokeWidth={1.75} className="text-amber-400" />
          <span className="font-semibold text-amber-200 text-sm">
            到货提醒 ({alerts.length})
          </span>
          <span className="text-sm text-amber-400">
            {alerts.length > 0 ? '有达人样品已送达，请确认' : ''}
          </span>
        </div>
        <span className="text-amber-400">
          {expanded ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-amber-500/20 divide-y divide-amber-500/20">
          {alerts.map(s => (
            <div key={s.id} className="px-5 py-3 flex items-center justify-between bg-slate-700/50">
              <div className="flex items-center gap-3">
                <Bell size={16} strokeWidth={1.75} className="text-amber-500 shrink-0" />
                <div>
                  <span className="font-medium text-slate-200 text-sm">{s.influencerName}</span>
                  <span className="text-sm text-slate-400 ml-2">{s.productName}</span>
                  <span className="text-xs text-slate-400 ml-2">
                    {s.carrierName} {s.trackingNumber}
                  </span>
                  {s.deliveredAt && (
                    <span className="text-xs text-amber-400 ml-2">
                      签收于 {new Date(s.deliveredAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => updateShipment({ ...s, acknowledged: true })}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 rounded-lg transition-colors btn-press"
              >
                已处理
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
