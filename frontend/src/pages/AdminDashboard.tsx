import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrainStore } from '../store/trainStore';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { AdminControlPanel } from '../components/admin/AdminControlPanel';
import { TrainMap } from '../components/map/TrainMap';
import { DelayBreakdownChart } from '../components/charts/DelayBreakdownChart';
import { TopographyChart } from '../components/charts/TopographyChart';
import { ETACard } from '../components/passenger/ETACard';
import { WeatherCard } from '../components/passenger/WeatherCard';
import { CongestionCard } from '../components/passenger/CongestionCard';
import { ClassBadge, StatusBadge } from '../components/common/Badges';
import { CheckpointPanel } from '../components/admin/CheckpointPanel';
import type { TrainConditions } from '../types';
import { Settings, ChevronLeft, Shield, Map, Sliders, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

type Tab = 'controls' | 'map' | 'checkpoints';

export function AdminDashboard() {
  const { trainNumber } = useParams<{ trainNumber: string }>();
  const navigate = useNavigate();
  const { trains, applyConditions, toggleCheckpoint, startSimulation, stopSimulation } = useTrainStore();
  const [activeTab, setActiveTab] = useState<Tab>('controls');

  const trainState = trainNumber ? trains[trainNumber] : undefined;

  useEffect(() => {
    startSimulation();
    return () => stopSimulation();
  }, []);

  if (!trainState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">Train {trainNumber} not found.</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/admin')}>← Back</button>
        </div>
      </div>
    );
  }

  const { info, live, eta, conditions, delayBreakdown } = trainState;

  const handleApply = (newConditions: TrainConditions) => {
    applyConditions(info.trainNumber, newConditions);
  };

  const tabs: { id: Tab; label: string; icon: typeof Sliders }[] = [
    { id: 'controls', label: 'Controls', icon: Sliders },
    { id: 'map',      label: 'Live Map', icon: Map },
    { id: 'checkpoints', label: 'Checkpoints', icon: Flag },
  ];

  const crossedCount = info.checkpoints.filter(c => c.isCrossed).length;
  const pendingCount = info.checkpoints.length - crossedCount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-orange-500 transition-colors text-sm shrink-0">
              <ChevronLeft size={16} /> Trains
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <Settings size={16} className="text-orange-500 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{info.trainName}</span>
              <ClassBadge trainClass={info.trainClass} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-full">
              <Shield size={11} /> Admin
            </div>
            <StatusBadge delay={live.delayMinutes} status={live.status} />
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      {/* Admin banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
          <Shield size={14} />
          <span className="font-medium">Admin Control — {info.trainNumber}</span>
          <span className="opacity-70">·</span>
          <span className="opacity-80">Checkpoints visible to admin only</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Train info + ETA summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card px-5 py-4 mb-6 flex flex-wrap items-center gap-4 justify-between"
        >
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{info.trainName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
              #{info.trainNumber} &nbsp;·&nbsp; {info.sourceCode} → {info.destinationCode}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Predicted Delay</p>
              <p className={`text-2xl font-black ${live.delayMinutes === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {live.delayMinutes === 0 ? 'On Time' : `+${live.delayMinutes}m`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
              {label}
              {id === 'checkpoints' && pendingCount > 0 && (
                <span className="ml-1 bg-orange-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'controls' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminControlPanel
                  trainNumber={info.trainNumber}
                  trainName={info.trainName}
                  conditions={conditions}
                  onApply={handleApply}
                />
              </motion.div>
            )}
            {activeTab === 'map' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* Live checkpoint progress strip — admin only, visible on map tab */}
                <div className="card px-4 py-3 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Flag size={14} className="text-orange-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Checkpoint Progress</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">(Admin only)</span>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${info.checkpoints.length > 0 ? (crossedCount / info.checkpoints.length) * 100 : 0}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{crossedCount} crossed</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-orange-500 font-bold">{pendingCount} pending</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{info.checkpoints.length} total</span>
                  </div>
                </div>

                <TrainMap
                  info={info}
                  live={live}
                  isAdmin={true}
                  onCheckpointClick={(cpId) => {
                    toggleCheckpoint(info.trainNumber, cpId, !info.checkpoints.find(c => c.id === cpId)?.isActive);
                  }}
                />
                <TopographyChart
                  points={info.topography}
                  currentPositionKm={live.distanceTravelledKm}
                />
              </motion.div>
            )}
            {activeTab === 'checkpoints' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckpointPanel
                  checkpoints={info.checkpoints}
                  info={info}
                  live={live}
                  onToggle={(cpId, active) => toggleCheckpoint(info.trainNumber, cpId, active)}
                />
              </motion.div>
            )}
          </div>

          {/* Right column - always visible */}
          <div className="space-y-5">
            <ETACard eta={eta} />
            <WeatherCard conditions={conditions} />
            <CongestionCard conditions={conditions} />
            <DelayBreakdownChart breakdown={delayBreakdown} totalDelay={live.delayMinutes} />
          </div>
        </div>
      </main>
    </div>
  );
}
