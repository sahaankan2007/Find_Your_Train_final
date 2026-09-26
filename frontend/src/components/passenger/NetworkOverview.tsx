import type { TrainState } from '../../types';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../common/Badges';
import { ArrowRight, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface NetworkOverviewProps {
  trains: Record<string, TrainState>;
}

export function NetworkOverview({ trains }: NetworkOverviewProps) {
  const navigate = useNavigate();
  const trainList = Object.values(trains);
  const onTimeCount = trainList.filter(t => t.live.delayMinutes === 0).length;

  const overallCongestion = () => {
    const levels = trainList.map(t => t.conditions.congestionLevel);
    if (levels.includes('Severe')) return { label: 'Severe', color: 'text-purple-500' };
    if (levels.includes('High')) return { label: 'High', color: 'text-red-500' };
    if (levels.includes('Moderate')) return { label: 'Moderate', color: 'text-amber-500' };
    return { label: 'Low', color: 'text-emerald-500' };
  };
  const cong = overallCongestion();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-brand-500" />
          <h2 className="font-bold text-slate-900 dark:text-white">Network Overview</h2>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {onTimeCount}/{trainList.length} trains on time
          &nbsp;·&nbsp;
          <span className={`font-semibold ${cong.color}`}>
            Congestion: {cong.label}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {trainList.map((t, i) => (
          <motion.button
            key={t.info.trainNumber}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(`/passenger/${t.info.trainNumber}`)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {t.info.trainNumber} — {t.info.trainName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {t.info.sourceCode} → {t.info.destinationCode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Clock size={11} />
                {t.eta.predictedArrival}
              </div>
              <StatusBadge delay={t.live.delayMinutes} status={t.live.status} />
              <ArrowRight size={14} className="text-slate-400 group-hover:text-brand-500 transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
