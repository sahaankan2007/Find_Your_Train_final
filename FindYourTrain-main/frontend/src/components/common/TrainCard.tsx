import { useNavigate } from 'react-router-dom';
import type { TrainState } from '../../types';
import { StatusBadge, ClassBadge, CongestionBadge } from '../common/Badges';
import { MapPin, Clock, Gauge, Thermometer, Cloud, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrainCardProps {
  trainState: TrainState;
  mode: 'passenger' | 'admin';
  index?: number;
}

const weatherIcons: Record<string, string> = {
  Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️', Storm: '⛈️',
  Fog: '🌫️', Clear: '🌤️', 'Heavy Rain': '🌊',
};

export function TrainCard({ trainState, mode, index = 0 }: TrainCardProps) {
  const navigate = useNavigate();
  const { info, live, conditions, eta } = trainState;

  const handleClick = () => {
    navigate(`/${mode}/${info.trainNumber}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="card-hover p-5 group"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClassBadge trainClass={info.trainClass} />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              #{info.trainNumber}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
            {info.trainName}
          </h3>
        </div>
        <StatusBadge delay={live.delayMinutes} status={live.status} />
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
        <MapPin size={13} className="text-brand-500 shrink-0" />
        <span className="font-medium">{info.sourceCode}</span>
        <ArrowRight size={13} className="shrink-0" />
        <span className="font-medium">{info.destinationCode}</span>
        <span className="text-slate-400 dark:text-slate-600 ml-auto text-xs">
          {info.totalDistanceKm} km
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 mb-1.5">
          <span>{info.sourceCode}</span>
          <span className="text-brand-500">{live.journeyProgressPct.toFixed(0)}%</span>
          <span>{info.destinationCode}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${live.journeyProgressPct}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        </div>
      </div>

      {/* Stats grid */}
      {mode === 'admin' ? (
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Gauge size={12} className="text-brand-400" />
            <span>{conditions.speedKmh} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Thermometer size={12} className="text-orange-400" />
            <span>{conditions.temperatureC}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span>{weatherIcons[conditions.weather]}</span>
            <span>{conditions.weather}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CongestionBadge level={conditions.congestionLevel} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Clock size={12} className="text-brand-400" />
            <span>ETA {eta.predictedArrival}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span>{weatherIcons[conditions.weather]}</span>
            <span>{conditions.weather}, {conditions.temperatureC}°C</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-500">
          {live.delayMinutes === 0 ? 'Running on schedule' : `Delayed by ${live.delayMinutes} min`}
        </span>
        <span className="text-xs text-brand-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          {mode === 'admin' ? 'Control' : 'Track'} <ArrowRight size={12} />
        </span>
      </div>
    </motion.div>
  );
}
