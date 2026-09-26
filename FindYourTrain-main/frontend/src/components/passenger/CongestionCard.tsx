import type { TrainConditions } from '../../types';
import { AlertTriangle, Info } from 'lucide-react';
import { CongestionBadge } from '../common/Badges';
import { motion, AnimatePresence } from 'framer-motion';

interface CongestionCardProps {
  conditions: TrainConditions;
}

const congestionColors = {
  Low:      'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10',
  Moderate: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10',
  High:     'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
  Severe:   'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10',
};

export function CongestionCard({ conditions }: CongestionCardProps) {
  const isNoIssue = conditions.congestionLevel === 'Low';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">Congestion</h3>
        <CongestionBadge level={conditions.congestionLevel} />
      </div>

      <div className={`rounded-xl p-4 border-2 mb-4 ${congestionColors[conditions.congestionLevel]}`}>
        <div className="flex items-center gap-3">
          {isNoIssue ? (
            <Info size={24} className="text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle size={24} className={
              conditions.congestionLevel === 'Severe' ? 'text-purple-500' :
              conditions.congestionLevel === 'High' ? 'text-red-500' : 'text-amber-500'
            } />
          )}
          <div>
            <p className="font-bold text-lg text-slate-900 dark:text-white">
              {conditions.congestionLevel.toUpperCase()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Congestion Level</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!isNoIssue && conditions.congestionReason && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Reason for Congestion
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              {conditions.congestionReason === 'High train density'
                ? 'Heavy traffic ahead due to multiple trains occupying the downstream section.'
                : conditions.congestionReason === 'Preceding train delay'
                ? 'Preceding train is delayed, causing cascading delays on this route.'
                : conditions.congestionReason === 'Signal restriction'
                ? 'Signal at caution ahead — train operating under restricted speed.'
                : conditions.congestionReason === 'Platform occupancy'
                ? 'Upcoming platform is occupied. Train is holding at current position.'
                : conditions.congestionReason === 'Maintenance block'
                ? 'Maintenance block active on upcoming track section. Speed restricted.'
                : conditions.congestionReason === 'Track availability'
                ? 'Limited track availability due to parallel operations on this corridor.'
                : conditions.congestionReason === 'Operational bottleneck'
                ? 'Operational bottleneck at junction — multiple trains converging.'
                : conditions.congestionReason}
            </p>
          </motion.div>
        )}
        {isNoIssue && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-emerald-600 dark:text-emerald-400 text-center py-2"
          >
            ✓ No congestion on this route
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
