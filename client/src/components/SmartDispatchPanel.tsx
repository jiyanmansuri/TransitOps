import { useEffect, useState } from 'react';
import { Sparkles, Truck, User, CheckCircle2, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/client';

interface Recommendation {
  id: string;
  registrationNumber?: string;
  nameModel?: string;
  maxLoadCapacityKg?: number;
  name?: string;
  licenseNumber?: string;
  safetyScore?: number;
  score: number;
  reasons: string[];
}

interface SmartDispatchResult {
  vehicle: Recommendation | null;
  driver: Recommendation | null;
  allVehicleCount: number;
  allDriverCount: number;
}

interface Props {
  cargoWeightKg: string;
  onAccept: (vehicleId: string, driverId: string) => void;
  currentVehicleId: string;
  currentDriverId: string;
}

export default function SmartDispatchPanel({ cargoWeightKg, onAccept, currentVehicleId, currentDriverId }: Props) {
  const [data, setData] = useState<SmartDispatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [accepted, setAccepted] = useState(false);

  const isApplied =
    data?.vehicle?.id === currentVehicleId &&
    data?.driver?.id === currentDriverId &&
    !!currentVehicleId && !!currentDriverId;

  useEffect(() => {
    setAccepted(false);
    const timeout = setTimeout(() => {
      fetchRecommendation();
    }, 400); // debounce on cargoWeightKg change
    return () => clearTimeout(timeout);
  }, [cargoWeightKg]);

  async function fetchRecommendation() {
    setLoading(true);
    setError('');
    try {
      const params = cargoWeightKg ? { cargoWeightKg } : {};
      const res = await api.get('/trips/recommend', { params });
      setData(res.data);
    } catch {
      setError('Could not load recommendations');
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!data?.vehicle || !data?.driver) return;
    onAccept(data.vehicle.id, data.driver.id);
    setAccepted(true);
  }

  return (
    <div className="rounded-2xl border border-accent-amber/25 bg-gradient-to-br from-dark-700/80 via-dark-700/60 to-dark-800/80 backdrop-blur-sm overflow-hidden shadow-lg shadow-neutral-950/15">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-amber/15 border border-accent-amber/30 flex items-center justify-center">
            <Sparkles size={14} className="text-accent-amber" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white leading-tight">Smart Dispatch Assistant</p>
            <p className="text-[10px] text-gray-500 leading-tight">Auto-scored recommendation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isApplied && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-accent-green bg-accent-green/10 border border-accent-green/20 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={10} /> Applied
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {loading && (
            <div className="flex items-center gap-2 py-3 justify-center text-gray-500 text-xs">
              <Loader2 size={14} className="animate-spin text-accent-amber" />
              Analyzing fleet data…
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-2 text-red-400 text-xs py-2">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* Vehicle Card */}
                <RecommendCard
                  icon={<Truck size={13} />}
                  label="Recommended Vehicle"
                  name={data.vehicle?.registrationNumber || '—'}
                  subtitle={data.vehicle?.nameModel}
                  score={data.vehicle?.score}
                  reasons={data.vehicle?.reasons || []}
                  available={!!data.vehicle}
                  totalPool={data.allVehicleCount}
                />

                {/* Driver Card */}
                <RecommendCard
                  icon={<User size={13} />}
                  label="Recommended Driver"
                  name={data.driver?.name || '—'}
                  subtitle={data.driver?.licenseNumber}
                  score={data.driver?.score}
                  reasons={data.driver?.reasons || []}
                  available={!!data.driver}
                  totalPool={data.allDriverCount}
                />
              </div>

              {/* Accept button */}
              {data.vehicle && data.driver && (
                <button
                  type="button"
                  onClick={handleAccept}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                    isApplied
                      ? 'bg-accent-green/10 text-accent-green border-accent-green/30 cursor-default'
                      : 'bg-accent-amber/10 text-accent-amber border-accent-amber/30 hover:bg-accent-amber/20 active:scale-[0.98]'
                  }`}
                >
                  {isApplied ? (
                    <><CheckCircle2 size={13} /> Recommendation Applied</>
                  ) : (
                    <><Sparkles size={13} /> Apply Recommendation</>
                  )}
                </button>
              )}

              {(!data.vehicle || !data.driver) && (
                <p className="text-[11px] text-gray-500 text-center py-1">
                  {!data.vehicle && !data.driver
                    ? 'No available vehicles or drivers at this time.'
                    : !data.vehicle
                    ? 'No available vehicles. Check fleet status.'
                    : 'No eligible drivers. Check driver statuses.'}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Recommendation Card ──────────────────────────────────────────────────────
interface CardProps {
  icon: React.ReactNode;
  label: string;
  name: string;
  subtitle?: string;
  score?: number;
  reasons: string[];
  available: boolean;
  totalPool: number;
}

function RecommendCard({ icon, label, name, subtitle, score, reasons, available, totalPool }: CardProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleReasons = showAll ? reasons : reasons.slice(0, 3);

  return (
    <div className={`rounded-xl border p-3 space-y-2 transition-all duration-300 ${
      available
        ? 'bg-dark-600/60 border-dark-400/60 hover:border-accent-amber/20'
        : 'bg-dark-700/40 border-dark-500/40 opacity-60'
    }`}>
      {/* Label */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        <span className="text-accent-amber">{icon}</span>
        {label}
      </div>

      {/* Name + score */}
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className="text-sm font-bold text-white leading-tight flex items-center gap-1">
            {available && <CheckCircle2 size={12} className="text-accent-green flex-shrink-0" />}
            {name}
          </p>
          {subtitle && <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{subtitle}</p>}
        </div>
        {score !== undefined && available && (
          <div className="flex-shrink-0 text-right">
            <div className="text-[10px] font-bold text-accent-amber tabular-nums">{score}pts</div>
            <div className="text-[8px] text-gray-600">score</div>
          </div>
        )}
      </div>

      {/* Score bar */}
      {score !== undefined && available && (
        <div className="w-full h-1 bg-dark-500 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-amber to-accent-amber-light rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(0, (score / 100) * 100))}%` }}
          />
        </div>
      )}

      {/* Reasons */}
      <ul className="space-y-0.5">
        {visibleReasons.map((r, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-400 leading-tight">
            <span className="text-accent-amber mt-0.5 flex-shrink-0">•</span>
            {r}
          </li>
        ))}
        {reasons.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll(s => !s)}
            className="text-[10px] text-accent-amber/60 hover:text-accent-amber transition-colors mt-0.5"
          >
            {showAll ? 'Show less' : `+${reasons.length - 3} more`}
          </button>
        )}
      </ul>

      {available && (
        <p className="text-[9px] text-gray-600 pt-0.5">Best of {totalPool} available</p>
      )}
    </div>
  );
}
