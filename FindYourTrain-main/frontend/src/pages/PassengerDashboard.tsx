import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrainStore } from '../store/trainStore';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { ETACard } from '../components/passenger/ETACard';
import { JourneyProgress } from '../components/passenger/JourneyProgress';
import { WeatherCard } from '../components/passenger/WeatherCard';
import { CongestionCard } from '../components/passenger/CongestionCard';
import { UpcomingStations } from '../components/passenger/UpcomingStations';
import { DelayBreakdownChart } from '../components/charts/DelayBreakdownChart';
import { TopographyChart } from '../components/charts/TopographyChart';
import { TrainMap } from '../components/map/TrainMap';
import { StatusBadge, ClassBadge } from '../components/common/Badges';
import { Train, ChevronLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function PassengerDashboard() {
  const { trainNumber } = useParams<{ trainNumber: string }>();
  const navigate = useNavigate();
  const { trains, startSimulation, stopSimulation } = useTrainStore();

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
          <button className="btn-primary mt-4" onClick={() => navigate('/passenger')}>← Back</button>
        </div>
      </div>
    );
  }

  const { info, live, eta, conditions, delayBreakdown } = trainState;
  const lastUpdated = new Date(live.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/passenger')} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors text-sm shrink-0">
              <ChevronLeft size={16} /> Trains
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <Train size={16} className="text-brand-500 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{info.trainName}</span>
              <ClassBadge trainClass={info.trainClass} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge delay={live.delayMinutes} status={live.status} />
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Train info strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card px-5 py-4 mb-6 flex flex-wrap items-center gap-4 justify-between"
        >
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{info.trainName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
              #{info.trainNumber} &nbsp;·&nbsp; {info.sourceCode} → {info.destinationCode}
              &nbsp;·&nbsp; {info.totalDistanceKm} km
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Clock size={12} />
            Last updated: {lastUpdated}
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
        </motion.div>

        {/* Main layout: mobile stacked, desktop 2-col */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* ETA + Journey Progress */}
            <div className="grid sm:grid-cols-2 gap-5">
              <ETACard eta={eta} />
              <JourneyProgress live={live} info={info} />
            </div>

            {/* Map */}
            <TrainMap info={info} live={live} isAdmin={false} />

            {/* Topography */}
            <TopographyChart
              points={info.topography}
              currentPositionKm={live.distanceTravelledKm}
              trainName={info.trainName}
            />

            {/* Delay Breakdown */}
            <DelayBreakdownChart breakdown={delayBreakdown} totalDelay={live.delayMinutes} />
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <WeatherCard conditions={conditions} />
            <CongestionCard conditions={conditions} />
            <UpcomingStations stations={info.stations} />
          </div>
        </div>
      </main>
    </div>
  );
}
