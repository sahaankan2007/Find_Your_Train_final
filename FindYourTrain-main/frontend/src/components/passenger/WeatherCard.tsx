import type { TrainConditions } from '../../types';
import { Gauge, Thermometer } from 'lucide-react';
import { CongestionBadge } from '../common/Badges';

interface WeatherCardProps {
  conditions: TrainConditions;
}

const weatherDetails: Record<string, { icon: string; color: string; bg: string }> = {
  Sunny:      { icon: '☀️', color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  Cloudy:     { icon: '☁️', color: 'text-slate-600 dark:text-slate-400',   bg: 'bg-slate-50 dark:bg-slate-800/50' },
  Rainy:      { icon: '🌧️', color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  Storm:      { icon: '⛈️', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  Fog:        { icon: '🌫️', color: 'text-gray-600 dark:text-gray-400',     bg: 'bg-gray-50 dark:bg-gray-800/50' },
  Clear:      { icon: '🌤️', color: 'text-sky-600 dark:text-sky-400',       bg: 'bg-sky-50 dark:bg-sky-900/20' },
  'Heavy Rain':{ icon: '🌊', color: 'text-blue-700 dark:text-blue-300',    bg: 'bg-blue-50 dark:bg-blue-900/30' },
};

export function WeatherCard({ conditions }: WeatherCardProps) {
  const w = weatherDetails[conditions.weather] ?? weatherDetails.Cloudy;

  return (
    <div className="card p-5">
      <h3 className="section-title">Weather & Conditions</h3>

      {/* Weather main */}
      <div className={`rounded-xl p-4 mb-4 ${w.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{w.icon}</span>
              <div>
                <p className={`text-lg font-bold ${w.color}`}>{conditions.weather}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {conditions.temperatureC}°C
                </p>
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-1.5">
              <Thermometer size={13} className="text-orange-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">{conditions.temperatureC}°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Speed & Congestion */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Gauge size={11} /> Speed
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {conditions.speedKmh}
            <span className="text-sm font-normal text-slate-500 ml-1">km/h</span>
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Congestion</p>
          <CongestionBadge level={conditions.congestionLevel} />
        </div>
      </div>
    </div>
  );
}
