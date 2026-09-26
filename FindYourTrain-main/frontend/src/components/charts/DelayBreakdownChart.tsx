import type { DelayBreakdown } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useThemeStore } from '../../store/themeStore';

interface DelayBreakdownChartProps {
  breakdown: DelayBreakdown;
  totalDelay: number;
}

const REASONS = [
  { key: 'congestion',         label: 'Congestion',         color: '#ef4444' },
  { key: 'speedRestriction',   label: 'Speed Restriction',  color: '#f97316' },
  { key: 'signalHalt',         label: 'Signal Halt',        color: '#eab308' },
  { key: 'weather',            label: 'Weather',            color: '#3b82f6' },
  { key: 'unscheduledStoppage',label: 'Unscheduled Stop',   color: '#8b5cf6' },
  { key: 'maintenanceBlock',   label: 'Maintenance Block',  color: '#06b6d4' },
  { key: 'other',              label: 'Other',              color: '#6b7280' },
] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      <p className="text-lg font-bold text-brand-500">+{payload[0]?.value} min</p>
    </div>
  );
};

export function DelayBreakdownChart({ breakdown, totalDelay }: DelayBreakdownChartProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const data = REASONS
    .map(r => ({
      name: r.label,
      value: breakdown[r.key as keyof DelayBreakdown] ?? 0,
      color: r.color,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (totalDelay === 0) {
    return (
      <div className="card p-5">
        <h3 className="section-title">Delay Breakdown</h3>
        <div className="flex flex-col items-center justify-center py-10 text-emerald-500">
          <div className="text-4xl mb-2">✓</div>
          <p className="font-semibold">No Delay</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Train is running on schedule</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">Delay Breakdown</h3>
        <div className="text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Predicted</span>
          <p className="text-xl font-bold text-red-500">+{totalDelay} min</p>
        </div>
      </div>

      <div className="mb-4" style={{ height: Math.max(data.length * 44, 120) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke={isDark ? '#1e293b' : '#f1f5f9'}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
              axisLine={false}
              tickLine={false}
              unit=" min"
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{
              position: 'right', formatter: (v: unknown) => `${v}m`,
              fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b',
            }}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend chips */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-slate-600 dark:text-slate-400">{d.name}: {d.value}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}
