import type { ETAData } from '../../types';
import { Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ETACardProps {
  eta: ETAData;
}

export function ETACard({ eta }: ETACardProps) {
  const isOnTime = eta.predictedDelayMinutes === 0;
  const isEarly = eta.predictedDelayMinutes < 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">Arrival ETA</h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ML Prediction
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Scheduled */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Clock size={11} /> Scheduled
          </p>
          <p className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300">
            {eta.scheduledArrival}
          </p>
        </div>

        {/* Predicted */}
        <div className={`rounded-xl p-3 ${
          isOnTime
            ? 'bg-emerald-50 dark:bg-emerald-900/20'
            : eta.predictedDelayMinutes > 20
            ? 'bg-red-50 dark:bg-red-900/20'
            : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <TrendingUp size={11} /> Predicted
          </p>
          <p className={`text-2xl font-bold font-mono ${
            isOnTime ? 'text-emerald-600 dark:text-emerald-400'
            : eta.predictedDelayMinutes > 20 ? 'text-red-600 dark:text-red-400'
            : 'text-amber-600 dark:text-amber-400'
          }`}>
            {eta.predictedArrival}
          </p>
        </div>
      </div>

      {/* Delay summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnTime ? (
            <CheckCircle size={16} className="text-emerald-500" />
          ) : (
            <AlertCircle size={16} className={eta.predictedDelayMinutes > 20 ? 'text-red-500' : 'text-amber-500'} />
          )}
          <span className={`font-semibold text-sm ${
            isOnTime ? 'text-emerald-600 dark:text-emerald-400'
            : eta.predictedDelayMinutes > 20 ? 'text-red-600 dark:text-red-400'
            : 'text-amber-600 dark:text-amber-400'
          }`}>
            {isOnTime ? 'On Time' : isEarly ? `${Math.abs(eta.predictedDelayMinutes)} min early` : `+${eta.predictedDelayMinutes} min delay`}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500">Confidence</p>
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${eta.confidence * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {Math.round(eta.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
