import { useInfluencerStore } from '../../store/influencerStore';
import { TRACKING_LABELS, TRACKING_COLORS } from '../../types/influencer';

export default function TrackingTable() {
  const { shipments, removeShipment, refreshShipmentStatus, updateShipment, loading } = useInfluencerStore();

  if (shipments.length === 0) {
    return <div className="text-center py-16 text-slate-400">暂无物流记录</div>;
  }

  const sorted = [...shipments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-4 py-3 font-medium text-slate-500">达人</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">样品</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">快递单号</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">快递公司</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">状态</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">更新时间</th>
            <th className="text-right px-4 py-3 font-medium text-slate-500">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.map(s => (
            <tr key={s.id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium text-slate-800">{s.influencerName}</td>
              <td className="px-4 py-3 text-slate-600">{s.productName || '-'}</td>
              <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                {s.trackingNumber}
                <a
                  href={`https://t.17track.net/en#nums=${s.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-indigo-500 hover:text-indigo-700 text-xs"
                >
                  查询 →
                </a>
              </td>
              <td className="px-4 py-3 text-slate-500">{s.carrierName}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TRACKING_COLORS[s.status]}`}>
                  {TRACKING_LABELS[s.status]}
                </span>
                {s.statusDetail && <div className="text-xs text-slate-400 mt-1 max-w-[180px] truncate">{s.statusDetail}</div>}
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {s.statusUpdatedAt ? new Date(s.statusUpdatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  onClick={() => refreshShipmentStatus(s.id)}
                  disabled={loading}
                  className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 disabled:opacity-50"
                >
                  刷新
                </button>
                {s.status === 'delivered' && !s.acknowledged && (
                  <button
                    onClick={() => updateShipment({ ...s, acknowledged: true })}
                    className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1"
                  >
                    已处理
                  </button>
                )}
                <button
                  onClick={() => removeShipment(s.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
