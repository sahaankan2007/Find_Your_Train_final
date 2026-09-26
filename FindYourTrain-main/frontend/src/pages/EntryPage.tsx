import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { motion } from 'framer-motion';
import { Train, User, Settings, MapPin, Zap, TrendingUp } from 'lucide-react';

export function EntryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-navy-950 dark:via-navy-900 dark:to-slate-900 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-hero-pattern opacity-20 dark:opacity-30" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400/10 dark:bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-300/10 dark:bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex justify-between items-center px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Train size={18} className="text-white" />
          </div>
          <span className="text-slate-900 dark:text-white font-bold text-sm">Find Your Train</span>
        </div>
        <ThemeToggle size="sm" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo area */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          {/* Icon cluster */}
          <div className="relative flex justify-center mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-2xl shadow-brand-600/40">
              <Train size={48} className="text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-3xl border-2 border-brand-500/20 border-dashed"
            />
            {/* Floating badges */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg"
            >
              LIVE
            </motion.div>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Find Your{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent">
              Train
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Dynamic Railway ETA &amp; Journey Tracking
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { icon: MapPin, label: 'Live Location' },
              { icon: TrendingUp, label: 'ML Predictions' },
              { icon: Zap, label: 'Real-time ETA' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs">
                <Icon size={11} className="text-brand-500 dark:text-brand-400" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mode cards */}
        <div className="grid md:grid-cols-2 gap-5 w-full max-w-2xl">
          {/* Passenger */}
          <motion.button
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/passenger')}
            className="group relative bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border-2 border-black/10 dark:border-white/10 hover:border-brand-500/50 rounded-2xl p-7 text-left transition-all duration-300 backdrop-blur-sm shadow-sm dark:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-600/20 border border-brand-200 dark:border-brand-500/30 flex items-center justify-center mb-5 group-hover:bg-brand-200 dark:group-hover:bg-brand-600/30 transition-colors">
              <User size={28} className="text-brand-600 dark:text-brand-400" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Continue as Passenger</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Track train location, ETA, route and journey conditions in real time.
            </p>

            <div className="mt-5 flex items-center gap-1.5 text-brand-600 dark:text-brand-400 text-sm font-medium">
              Open Passenger View
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
            </div>
          </motion.button>

          {/* Admin */}
          <motion.button
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/admin')}
            className="group relative bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border-2 border-black/10 dark:border-white/10 hover:border-orange-500/50 rounded-2xl p-7 text-left transition-all duration-300 backdrop-blur-sm shadow-sm dark:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-600/20 border border-orange-200 dark:border-orange-500/30 flex items-center justify-center mb-5 group-hover:bg-orange-200 dark:group-hover:bg-orange-600/30 transition-colors">
              <Settings size={28} className="text-orange-600 dark:text-orange-400" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Continue as Admin</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Monitor trains and modify operating conditions to simulate real scenarios.
            </p>

            <div className="mt-5 flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-sm font-medium">
              Open Admin Panel
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
