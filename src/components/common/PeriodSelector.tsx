import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';

export default function PeriodSelector() {
  const { periods, currentPeriodId, setCurrentPeriod } = useDataStore();
  const navigate = useNavigate();

  if (periods.length === 0) return null;

  return (
    <select
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={currentPeriodId || ''}
      onChange={(e) => {
        setCurrentPeriod(e.target.value || null);
        navigate(`/analysis/${e.target.value}`);
      }}
    >
      <option value="">选择周期...</option>
      {periods.map((p) => (
        <option key={p.id} value={p.id}>
          {p.analysisStart} ~ {p.analysisEnd} ({p.type === 'monthly' ? '月度' : '周度'})
        </option>
      ))}
    </select>
  );
}
