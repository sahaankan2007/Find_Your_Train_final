import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainStore } from '../store/trainStore';
import { TrainCard } from '../components/common/TrainCard';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Settings, ChevronLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdminPage() {
  const navigate = useNavigate();
  const { trains, startSimulation, stopSimulation } = useTrainStore();

  useEffect(() => {
    startSimulation();
    return () => stopSimulation();
  }, []);

  const trainList = Object.values(trains);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-orange-500 transition-colors text-sm">
              <ChevronLeft size={16} /> Home
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-orange-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full">
              <Shield size={11} /> Admin Mode
            </div>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      {/* Orange admin banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Shield size={16} />
          <p className="text-sm font-medium">
            Admin Interface — Changes apply to ML prediction engine and update passenger view in real time.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Train Control Panel</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Select a train to modify operating conditions and observe ETA changes.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-5">
          {trainList.map((t, i) => (
            <TrainCard key={t.info.trainNumber} trainState={t} mode="admin" index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
