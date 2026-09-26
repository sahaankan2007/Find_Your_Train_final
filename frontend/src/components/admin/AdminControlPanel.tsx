import { useState } from 'react';
import type { TrainConditions, CongestionLevel, WeatherCondition, AdditionalCondition, CongestionReason } from '../../types';
import { Gauge, Cloud, Thermometer, AlertTriangle, Zap, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminControlPanelProps {
  trainNumber: string;
  trainName: string;
  conditions: TrainConditions;
  onApply: (conditions: TrainConditions) => void;
}

const WEATHER_OPTIONS: WeatherCondition[] = ['Sunny', 'Clear', 'Cloudy', 'Fog', 'Rainy', 'Heavy Rain', 'Storm'];
const CONGESTION_LEVELS: CongestionLevel[] = ['Low', 'Moderate', 'High', 'Severe'];
const CONGESTION_REASONS: CongestionReason[] = [
  'High train density', 'Preceding train delay', 'Signal restriction',
  'Platform occupancy', 'Maintenance block', 'Track availability',
  'Operational bottleneck', 'Other',
];
const ADDITIONAL_CONDITIONS: AdditionalCondition[] = [
  'Speed Restriction', 'Signal Halt', 'Unscheduled Stoppage', 'Maintenance Block',
];

const weatherEmoji: Record<string, string> = {
  Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️', Storm: '⛈️',
  Fog: '🌫️', Clear: '🌤️', 'Heavy Rain': '🌊',
};

const congestionBg: Record<string, string> = {
  Low:      'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
  Moderate: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
  High:     'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
  Severe:   'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300',
};

export function AdminControlPanel({ trainNumber, trainName, conditions, onApply }: AdminControlPanelProps) {
  const [draft, setDraft] = useState<TrainConditions>({ ...conditions });
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    onApply(draft);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  const toggleAdditional = (c: AdditionalCondition) => {
    setDraft(d => ({
      ...d,
      additionalConditions: d.additionalConditions.includes(c)
        ? d.additionalConditions.filter(x => x !== c)
        : [...d.additionalConditions, c],
    }));
  };

  return (
    <div className="space-y-5">
      {/* Speed */}
      <div className="card p-5">
        <label className="label-text flex items-center gap-2">
          <Gauge size={14} className="text-brand-400" /> Speed Control
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0} max={160} step={5}
            value={draft.speedKmh}
            onChange={e => setDraft(d => ({ ...d, speedKmh: Number(e.target.value) }))}
            className="flex-1 accent-brand-500"
          />
          <div className="w-20 text-center bg-slate-50 dark:bg-slate-800 rounded-xl py-2 px-3">
            <p className="text-xl font-bold text-brand-500 font-mono">{draft.speedKmh}</p>
            <p className="text-xs text-slate-500">km/h</p>
          </div>
        </div>
      </div>

      {/* Weather & Temperature */}
      <div className="card p-5">
        <label className="label-text flex items-center gap-2">
          <Cloud size={14} className="text-blue-400" /> Weather & Temperature
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {WEATHER_OPTIONS.map(w => (
            <button
              key={w}
              onClick={() => setDraft(d => ({ ...d, weather: w }))}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                draft.weather === w
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>{weatherEmoji[w]}</span> {w}
            </button>
          ))}
        </div>

        <label className="label-text flex items-center gap-2">
          <Thermometer size={14} className="text-orange-400" /> Temperature (°C)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={-5} max={50}
            value={draft.temperatureC}
            onChange={e => setDraft(d => ({ ...d, temperatureC: Number(e.target.value) }))}
            className="input-field w-28 text-center text-lg font-bold font-mono"
          />
          <span className="text-slate-500 dark:text-slate-400 text-sm">Degrees Celsius</span>
        </div>
      </div>

      {/* Congestion */}
      <div className="card p-5">
        <label className="label-text flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-400" /> Congestion Level
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {CONGESTION_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => {
                setDraft(d => ({
                  ...d,
                  congestionLevel: level,
                  congestionReason: level === 'Low' ? null : d.congestionReason ?? 'High train density',
                }));
              }}
              className={`py-2.5 px-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                draft.congestionLevel === level
                  ? congestionBg[level]
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {draft.congestionLevel !== 'Low' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="label-text">Congestion Reason</label>
              <div className="relative">
                <select
                  className="select-field pr-8"
                  value={draft.congestionReason ?? ''}
                  onChange={e => setDraft(d => ({ ...d, congestionReason: e.target.value as CongestionReason }))}
                >
                  {CONGESTION_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Additional Conditions */}
      <div className="card p-5">
        <label className="label-text flex items-center gap-2">
          <Zap size={14} className="text-yellow-400" /> Additional Conditions
        </label>
        <div className="space-y-2">
          {ADDITIONAL_CONDITIONS.map(cond => {
            const active = draft.additionalConditions.includes(cond);
            return (
              <button
                key={cond}
                onClick={() => toggleAdditional(cond)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  active
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {active
                  ? <CheckSquare size={16} className="text-brand-500 shrink-0" />
                  : <Square size={16} className="text-slate-400 shrink-0" />
                }
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apply button */}
      <motion.button
        onClick={handleApply}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 ${
          applied
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : 'btn-primary'
        }`}
        whileTap={{ scale: 0.97 }}
      >
        {applied ? '✓ Changes Applied — ETA Recalculated' : 'Apply Changes'}
      </motion.button>

      {applied && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-center text-xs text-slate-500 dark:text-slate-400 -mt-2"
        >
          Admin conditions → CatBoost Model → Updated ETA + Delay Breakdown → Passenger view
        </motion.div>
      )}
    </div>
  );
}
