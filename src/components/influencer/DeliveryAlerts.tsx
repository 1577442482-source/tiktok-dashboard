import { useState } from 'react';
import { useInfluencerStore } from '../../store/influencerStore';

export default function DeliveryAlerts() {
  const { getDeliveryAlerts, updateShipment } = useInfluencerStore();
  const [expanded, setExpanded] = useState(true);
  const alerts = getDeliveryAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">📦</span>
          <span className="font-semibold text-amber-800">
            到货提醒 ({alerts.length})
          </span>
          <span className="text-sm text-amber-600">
            {alerts.length > 0 ? '有达人样品已送达，请确认' : ''}
          </span>
        </div>
        <span className="text-amber-400 text-sm">{expanded ? '收起' : '展开'}</span>
      </button>

      {expanded && (
        <div className="border-t border-amber-200 divide-y divide-amber-100">
          {alerts.map(s => (
            <div key={s.id} className="px-5 py-3 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔔</span>
                <div>
                  <span className="font-medium text-slate-800">{s.influencerName}</span>
                  <span className="text-sm text-slate-500 ml-2">{s.productName}</span>
                  <span className="text-xs text-slate-400 ml-2">
                    {s.carrierName} {s.trackingNumber}
                  </span>
                  {s.deliveredAt && (
                    <span className="text-xs text-amber-600 ml-2">
                      签收于 {new Date(s.deliveredAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => updateShipment({ ...s, acknowledged: true })}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
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
