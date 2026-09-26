import type { TopographyPoint } from '../../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useThemeStore } from '../../store/themeStore';

interface TopographyChartProps {
  points: TopographyPoint[];
  currentPositionKm: number;
  trainName?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-slate-500 dark:text-slate-400">{payload[0]?.payload?.distanceKm} km from origin</p>
      <p className="text-base font-bold text-brand-500">{payload[0]?.value} m</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Elevation</p>
    </div>
  );
};

export function TopographyChart({ points, currentPositionKm }: TopographyChartProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const min = Math.min(...points.map(p => p.elevationM));
  const max = Math.max(...points.map(p => p.elevationM));

  // Find current elevation by interpolation
  let currentElevation = min;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    if (currentPositionKm >= a.distanceKm && currentPositionKm <= b.distanceKm) {
      const frac = (currentPositionKm - a.distanceKm) / (b.distanceKm - a.distanceKm);
      currentElevation = Math.round(a.elevationM + frac * (b.elevationM - a.elevationM));
      break;
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title !mb-0">Journey Topography</h3>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Current Elevation</p>
          <p className="text-base font-bold text-brand-400">{currentElevation} m</p>
        </div>
      </div>

      <div className="flex gap-4 mb-3 text-xs text-slate-500 dark:text-slate-400">
        <span>↑ Highest: {max} m</span>
        <span>↓ Lowest: {min} m</span>
      </div>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="topoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1e293b' : '#f1f5f9'}
            />
            <XAxis
              dataKey="distanceKm"
              tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}km`}
              interval="preserveStartEnd"
            />
            <YAxis
              dataKey="elevationM"
              tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}m`}
              domain={[Math.max(0, min - 20), max + 20]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="elevationM"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#topoGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            />
            {/* Current train position */}
            <ReferenceLine
              x={currentPositionKm}
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="4 2"
              label={{
                value: '🚂',
                position: 'top',
                fontSize: 16,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
