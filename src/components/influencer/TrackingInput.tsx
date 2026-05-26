import { useState, useCallback } from 'react';
import { useInfluencerStore } from '../../store/influencerStore';
import { CARRIERS, type Shipment } from '../../types/influencer';

interface Props {
  onClose: () => void;
}

// Tracking number pattern → carrier detection
function detectCarrier(num: string): string | null {
  const n = num.trim().replace(/\s+/g, '').toUpperCase();
  if (!n) return null;

  // UPS: starts with "1Z" + 16 alphanumeric (e.g., 1Z999AA10123456784)
  if (/^1Z[A-Z0-9]{16}$/.test(n)) return 'ups';

  // USPS: 20-22 digits starting with 92/93/94 (typical USPS tracking)
  if (/^9[2-4]\d{18,22}$/.test(n)) return 'usps';
  // USPS: "EA 000 000 000 US" or "EC 000 000 000 US" or "CP 000 000 000 US" format
  if (/^[A-Z]{2}\d{9}US$/.test(n)) return 'usps';

  // FedEx: 12-15 digits (no letters), often starts with 6/7/8
  if (/^\d{12,15}$/.test(n) && /^[6-8]/.test(n)) return 'fedex';
  // FedEx Express: starts with specific patterns
  if (/^\d{12}$/.test(n)) return 'fedex';

  // DHL Express: 10 digits
  if (/^\d{10}$/.test(n)) return 'dhl';
  // DHL eCommerce: starts with GM, JJD, JD
  if (/^(GM|JD|JJD)\d+$/.test(n)) return 'dhl';

  // OnTrac: starts with C + digits
  if (/^C\d{12,15}$/.test(n)) return 'ontrac';

  // Amazon Logistics: starts with TBA or TBM
  if (/^TB[AM]\d+$/.test(n)) return 'amazon';

  // Canada Post: 16 chars (mix of letter and digits)
  if (/^[A-Z0-9]{16}$/.test(n) && /[A-Z]/.test(n) && /\d/.test(n)) return 'canadapost';

  // GLS: 8-12 digits
  if (/^\d{8,12}$/.test(n)) return 'gls';

  // Swift Express: often starts with SW or SX
  if (/^(SW|SX)[A-Z0-9]+$/.test(n)) return 'swift';

  // LaserShip: often starts with LS or 1LS
  if (/^(LS|1LS)[A-Z0-9]+$/.test(n)) return 'lasership';

  // OSM Worldwide: often starts with OSM
  if (/^OSM[A-Z0-9]+$/.test(n)) return 'osm';

  return null;
}

function getCarrierConfidenceLabel(n: string): string {
  const detected = detectCarrier(n);
  if (!detected) return n.length >= 8 ? '未识别' : '';
  const c = CARRIERS.find(c => c.code === detected);
  return c ? `识别为 ${c.name}` : '';
}

export default function TrackingInput({ onClose }: Props) {
  const { influencers, addShipment } = useInfluencerStore();
  const [influencerId, setInfluencerId] = useState('');
  const [productName, setProductName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState(CARRIERS[0].code);
  const [autoDetected, setAutoDetected] = useState(false);
  const [detectLabel, setDetectLabel] = useState('');

  const handleTrackingChange = useCallback((value: string) => {
    setTrackingNumber(value);
    const detected = detectCarrier(value);
    if (detected) {
      setCarrier(detected);
      setAutoDetected(true);
      setDetectLabel(getCarrierConfidenceLabel(value));
    } else {
      setAutoDetected(false);
      setDetectLabel(value.length >= 8 ? '未识别' : '');
    }
  }, []);

  const handleSubmit = async () => {
    if (!influencerId || !trackingNumber.trim()) return;
    const inf = influencers.find(i => i.id === influencerId);
    const carrierInfo = CARRIERS.find(c => c.code === carrier);
    const now = new Date().toISOString();
    const shipment: Shipment = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      influencerId,
      influencerName: inf?.name || '',
      productName: productName.trim(),
      trackingNumber: trackingNumber.trim(),
      carrier,
      carrierName: carrierInfo?.name || carrier,
      status: 'pending',
      statusDetail: '',
      statusUpdatedAt: now,
      deliveredAt: null,
      acknowledged: false,
      createdAt: now,
    };
    await addShipment(shipment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="glass-card rounded-2xl shadow-xl w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-200">录入物流单号</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-400 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">选择达人 *</label>
            <select
              value={influencerId}
              onChange={e => setInfluencerId(e.target.value)}
              className="w-full px-3 py-2 border border-white/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">-- 请选择 --</option>
              {influencers.map(inf => (
                <option key={inf.id} value={inf.id}>{inf.name} ({inf.handle || inf.platform})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">样品名称</label>
            <input
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full px-3 py-2 border border-white/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="如：美妆样品包"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">快递单号 *</label>
            <input
              value={trackingNumber}
              onChange={e => handleTrackingChange(e.target.value)}
              className="w-full px-3 py-2 border border-white/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="输入单号自动识别快递公司"
            />
            {detectLabel && (
              <p className={`text-xs mt-1 ${autoDetected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {detectLabel}{autoDetected ? '' : '，请手动选择'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">快递公司</label>
            <select
              value={carrier}
              onChange={e => { setCarrier(e.target.value); setAutoDetected(false); }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors ${autoDetected ? 'border-emerald-300 bg-emerald-500/10' : 'border-white/5'}`}
            >
              {CARRIERS.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {autoDetected && (
              <p className="text-xs text-emerald-400 mt-1">已自动匹配，可手动修改</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 rounded-lg">取消</button>
          <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">录入并跟踪</button>
        </div>
      </div>
    </div>
  );
}
