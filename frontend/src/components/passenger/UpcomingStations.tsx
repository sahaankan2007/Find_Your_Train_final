import type { Station } from '../../types';
import { CheckCircle, Circle, MapPin, Navigation, Flag } from 'lucide-react';

interface UpcomingStationsProps {
  stations: Station[];
}

const stateConfig = {
  passed:      { icon: CheckCircle,  color: 'text-slate-400 dark:text-slate-600',   dot: 'bg-slate-300 dark:bg-slate-600', label: 'Passed' },
  current:     { icon: Navigation,   color: 'text-brand-500',                        dot: 'bg-brand-500',                   label: 'Current' },
  upcoming:    { icon: Circle,       color: 'text-slate-500 dark:text-slate-400',    dot: 'bg-slate-200 dark:bg-slate-700', label: 'Upcoming' },
  destination: { icon: Flag,         color: 'text-emerald-500',                      dot: 'bg-emerald-500',                 label: 'Destination' },
};

export function UpcomingStations({ stations }: UpcomingStationsProps) {
  const sorted = [...stations].sort((a, b) => a.distanceFromStart - b.distanceFromStart);

  return (
    <div className="card p-5">
      <h3 className="section-title">Station Schedule</h3>

      <div className="space-y-0">
        {sorted.map((station, idx) => {
          const cfg = stateConfig[station.state];
          const Icon = cfg.icon;
          const isPassed = station.state === 'passed';
          const isCurrent = station.state === 'current';

          return (
            <div key={station.id} className="relative flex gap-3">
              {/* Vertical line */}
              {idx < sorted.length - 1 && (
                <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                  isPassed ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'
                }`} />
              )}

              {/* Icon */}
              <div className="relative z-10 flex items-start pt-0.5">
                <Icon size={16} className={`${cfg.color} ${isCurrent ? 'animate-pulse' : ''}`} />
              </div>

              {/* Content */}
              <div className={`flex-1 pb-5 ${isPassed ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${
                      isCurrent ? 'text-brand-500' : 'text-slate-900 dark:text-white'
                    }`}>
                      {station.name}
                      {isCurrent && <span className="ml-2 text-xs font-normal text-brand-400">(Current)</span>}
                      {station.state === 'destination' && <span className="ml-2 text-xs font-normal text-emerald-400">(Destination)</span>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {station.code}
                      {station.platformNumber && ` · Platform ${station.platformNumber}`}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {station.scheduledArrival}
                    </p>
                    {station.predictedDelay !== undefined && station.predictedDelay > 0 && (
                      <p className="text-xs text-amber-500">+{station.predictedDelay} min</p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {station.distanceFromStart} km
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
