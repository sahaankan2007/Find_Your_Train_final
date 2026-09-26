import type { LiveTrainData, TrainInfo } from '../../types';
import { motion } from 'framer-motion';
import { Navigation, MapPin, ArrowRight } from 'lucide-react';

interface JourneyProgressProps {
  live: LiveTrainData;
  info: TrainInfo;
}

export function JourneyProgress({ live, info }: JourneyProgressProps) {
  const currentStation = info.stations.find(s => s.id === live.currentStationId);
  const nextStation = info.stations.find(s => s.id === live.nextStationId);

  return (
    <div className="card p-5">
      <h3 className="section-title">Journey Progress</h3>

      {/* Big progress */}
      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-4xl font-bold text-brand-500">{live.journeyProgressPct.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Journey Complete</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {live.distanceTravelledKm} km
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">of {info.totalDistanceKm} km</p>
          </div>
        </div>

        <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 rounded-full"
            animate={{ width: `${live.journeyProgressPct}%` }}
            transition={{ duration: 0.8 }}
          />
          {/* Train dot on progress bar */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-brand-500 rounded-full shadow-lg"
            animate={{ left: `${live.journeyProgressPct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-600 mt-1.5">
          <span>{info.sourceCode}</span>
          <span>{live.distanceRemainingKm} km remaining</span>
          <span>{info.destinationCode}</span>
        </div>
      </div>

      {/* Station info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <Navigation size={11} className="text-brand-400" /> Current
          </p>
          {currentStation ? (
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                {currentStation.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {currentStation.code}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">En route</p>
          )}
        </div>

        <div className="bg-brand-50 dark:bg-brand-950/30 rounded-xl p-3 border border-brand-100 dark:border-brand-900/50">
          <p className="text-xs text-brand-600 dark:text-brand-400 mb-1.5 flex items-center gap-1">
            <ArrowRight size={11} /> Next Stop
          </p>
          {nextStation ? (
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                {nextStation.name}
              </p>
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5 font-mono">
                {nextStation.scheduledArrival}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
