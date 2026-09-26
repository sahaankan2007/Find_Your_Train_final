import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainStore } from '../store/trainStore';
import { TrainCard } from '../components/common/TrainCard';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Train, ChevronLeft, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { NetworkOverview } from '../components/passenger/NetworkOverview';

export function PassengerPage() {
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
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors text-sm">
              <ChevronLeft size={16} /> Home
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <Train size={18} className="text-brand-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Passenger Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
              <Activity size={11} className="animate-pulse" /> Live Tracking
            </div>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Select a Train</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Choose a train to view its live location, ETA, and journey details.
          </p>
        </motion.div>

        {/* Network Overview */}
        <div className="mb-8">
          <NetworkOverview trains={trains} />
        </div>

        {/* Train grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-5">
          {trainList.map((t, i) => (
            <TrainCard key={t.info.trainNumber} trainState={t} mode="passenger" index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
