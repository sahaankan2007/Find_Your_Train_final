import type { TrainStatus, CongestionLevel } from '../../types';

interface StatusBadgeProps {
  delay: number;
  status?: TrainStatus;
}

export function StatusBadge({ delay, status }: StatusBadgeProps) {
  if (status === 'cancelled') return <span className="badge-red">Cancelled</span>;
  if (delay === 0 || status === 'on-time') return <span className="badge-green">● On Time</span>;
  if (delay <= 10) return <span className="badge-yellow">▲ +{delay} min</span>;
  return <span className="badge-red">▲ +{delay} min</span>;
}

interface CongestionBadgeProps {
  level: CongestionLevel;
}
export function CongestionBadge({ level }: CongestionBadgeProps) {
  const cls = {
    Low: 'badge-green',
    Moderate: 'badge-yellow',
    High: 'badge-red',
    Severe: 'badge bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  }[level] ?? 'badge-gray';
  return <span className={cls}>{level}</span>;
}

interface ClassBadgeProps { trainClass: 'express' | 'local'; }
export function ClassBadge({ trainClass }: ClassBadgeProps) {
  return trainClass === 'express'
    ? <span className="badge-blue">⚡ Express</span>
    : <span className="badge-gray">🚃 Local</span>;
}
