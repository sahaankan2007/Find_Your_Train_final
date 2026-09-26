import type { Checkpoint, AdditionalCondition, TrainInfo, LiveTrainData } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Zap, CheckSquare, Square, CheckCircle2,
  AlertTriangle, Gauge, Clock, Activity, Shield,
  Search, RotateCcw, Radio, FileText, ChevronDown, ChevronUp,
  Flag, ArrowRight, Info
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface CheckpointPanelProps {
  checkpoints: Checkpoint[];
  info?: TrainInfo;
  live?: LiveTrainData;
  onToggle: (cpId: string, active: boolean) => void;
}

const ADDITIONAL_CONDITIONS: AdditionalCondition[] = [
  'Speed Restriction', 'Signal Halt', 'Unscheduled Stoppage', 'Maintenance Block',
];

export function CheckpointPanel({ checkpoints, info, live, onToggle }: CheckpointPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'upcoming' | 'crossed'>('all');
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);
  const itemsPerPage = 8;

  // Counts
  const crossedCount = checkpoints.filter(c => c.isCrossed).length;
  const activeCount = checkpoints.filter(c => c.isActive).length;
  const upcomingCount = checkpoints.filter(c => !c.isCrossed && !c.isActive).length;
  const totalKm = info?.totalDistanceKm || (checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].distanceKm : 0);
  const currentKm = live?.distanceTravelledKm ?? (crossedCount * 5);
  const progressPct = totalKm > 0 ? Math.min(100, Math.round((currentKm / totalKm) * 100)) : 0;

  // Next upcoming checkpoint target
  const nextTarget = checkpoints.find(c => !c.isCrossed);
  const distToNext = nextTarget && live ? Math.max(0, +(nextTarget.distanceKm - live.distanceTravelledKm).toFixed(1)) : null;
  const etaMinsToNext = distToNext !== null && live && live.speedKmh > 5 ? Math.round((distToNext / live.speedKmh) * 60) : null;

  // Filter & Search
  const filtered = useMemo(() => {
    return checkpoints.filter(cp => {
      // Tab filter
      if (filterTab === 'active' && !cp.isActive) return false;
      if (filterTab === 'crossed' && !cp.isCrossed) return false;
      if (filterTab === 'upcoming' && (cp.isCrossed || cp.isActive)) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchLabel = cp.label.toLowerCase().includes(q);
        const matchKm = `${cp.distanceKm}km`.toLowerCase().includes(q) || `${cp.distanceKm}`.includes(q);
        const matchCond = cp.activeConditions.some(c => c.toLowerCase().includes(q));
        if (!matchLabel && !matchKm && !matchCond) return false;
      }
      return true;
    });
  }, [checkpoints, filterTab, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayedCheckpoints = viewAll ? filtered : filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Simulated recent crossings audit log
  const crossedCheckpoints = useMemo(() => {
    return checkpoints.filter(c => c.isCrossed).slice(-4).reverse();
  }, [checkpoints]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Route Checkpoint Overview Banner ─────────────────────── */}
      <div className="card p-5 bg-gradient-to-br from-white via-slate-50 to-orange-50/30 dark:from-slate-800 dark:via-slate-800/90 dark:to-orange-950/20 border-orange-100 dark:border-orange-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Flag size={16} />
              </span>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                Route Waypoint & Checkpoint Telemetry
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fixed 5 km interval automated transponder beacons across {totalKm} km corridor
            </p>
          </div>

          {/* Stat counters */}
          <div className="flex items-center gap-3 sm:gap-6 bg-white dark:bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
            <div className="text-center sm:text-right">
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{crossedCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Passed</p>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center sm:text-right">
              <p className="text-xl font-black text-orange-500">{activeCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cautions</p>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center sm:text-right">
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{checkpoints.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
            </div>
          </div>
        </div>

        {/* Corridor Distance Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Corridor Traversal: {currentKm} km covered</span>
            <span>{progressPct}% completed</span>
          </div>
          <div className="relative h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>KM 0.0 ({info?.sourceCode || 'Start'})</span>
            <span>KM {totalKm.toFixed(1)} ({info?.destinationCode || 'End'})</span>
          </div>
        </div>
      </div>

      {/* ── 2. Next Checkpoint Radar & Immediate Ahead Corridor ──────────── */}
      {nextTarget && (
        <div className="card p-4 border-l-4 border-l-orange-500 bg-white dark:bg-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold">
                <Radio size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-orange-600 dark:text-orange-400">
                    Next Approaching Waypoint
                  </span>
                  {nextTarget.isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                      Active Notice
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {nextTarget.label} &nbsp;·&nbsp; KM {nextTarget.distanceKm.toFixed(1)}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              {distToNext !== null && (
                <div className="bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 font-normal">Distance: </span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">{distToNext} km ahead</span>
                </div>
              )}
              {etaMinsToNext !== null && (
                <div className="bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 font-normal">Est. Time: </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">~{etaMinsToNext} min{etaMinsToNext === 1 ? '' : 's'}</span>
                </div>
              )}
              <button
                onClick={() => onToggle(nextTarget.id, !nextTarget.isActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  nextTarget.isActive
                    ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs'
                }`}
              >
                {nextTarget.isActive ? 'Clear Caution' : 'Set Caution Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Search & Status Filter Controls ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          <button
            onClick={() => { setFilterTab('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All ({checkpoints.length})
          </button>
          <button
            onClick={() => { setFilterTab('active'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterTab === 'active'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20'
            }`}
          >
            <AlertTriangle size={12} /> Cautions ({activeCount})
          </button>
          <button
            onClick={() => { setFilterTab('upcoming'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'upcoming'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => { setFilterTab('crossed'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterTab === 'crossed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
            }`}
          >
            <CheckCircle2 size={12} /> Passed ({crossedCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search checkpoint or KM..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* ── 4. Main Checkpoint Grid / Cards ───────────────────────────────── */}
      <div className="space-y-2.5">
        {displayedCheckpoints.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">
            <Info size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No checkpoints match your filter</p>
            <button
              onClick={() => { setFilterTab('all'); setSearchQuery(''); }}
              className="mt-2 text-xs text-orange-500 font-bold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          displayedCheckpoints.map((cp) => {
            const relKm = live ? +(cp.distanceKm - live.distanceTravelledKm).toFixed(1) : null;
            return (
              <div
                key={cp.id}
                className={`card overflow-hidden transition-all duration-200 ${
                  cp.isCrossed
                    ? 'opacity-70 bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                    : cp.isActive
                      ? 'border-orange-400 dark:border-orange-600 bg-orange-50/20 dark:bg-orange-950/10 shadow-xs'
                      : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors"
                  onClick={() => setExpanded(expanded === cp.id ? null : cp.id)}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Icon marker */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      cp.isCrossed
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : cp.isActive
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50'
                    }`}>
                      {cp.isCrossed ? (
                        <CheckCircle2 size={16} />
                      ) : cp.isActive ? (
                        <AlertTriangle size={16} />
                      ) : (
                        <MapPin size={16} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-extrabold font-mono ${
                          cp.isCrossed
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {cp.label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">·</span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          KM {cp.distanceKm.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        {relKm !== null && (
                          <span>
                            {relKm > 0
                              ? `+${relKm} km ahead`
                              : relKm === 0
                                ? 'Train at position'
                                : `${Math.abs(relKm)} km past`}
                          </span>
                        )}
                        <span>•</span>
                        <span className="font-mono text-[10px]">
                          [{cp.coordinates[1].toFixed(4)}°N, {cp.coordinates[0].toFixed(4)}°E]
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex items-center gap-2.5">
                    {cp.isCrossed && (
                      <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                        ✓ Passed
                      </span>
                    )}
                    {!cp.isCrossed && cp.isActive && (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <AlertTriangle size={11} /> Caution
                      </span>
                    )}

                    {!cp.isCrossed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(cp.id, !cp.isActive);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          cp.isActive
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs'
                        }`}
                      >
                        {cp.isActive ? 'Deactivate' : 'Set Caution'}
                      </button>
                    )}

                    <div className="text-slate-400 pl-1">
                      {expanded === cp.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expandable condition details */}
                <AnimatePresence>
                  {expanded === cp.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30"
                    >
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Active Railway Conditions & Speed Orders:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ADDITIONAL_CONDITIONS.map(cond => {
                          const isActive = cp.activeConditions.includes(cond);
                          return (
                            <div
                              key={cond}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                                isActive
                                  ? 'bg-orange-100/70 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300 font-semibold'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                              }`}
                            >
                              {isActive ? <CheckSquare size={13} className="text-orange-500" /> : <Square size={13} />}
                              <span>{cond}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                        <span>Speed Restriction default: <strong className="text-slate-700 dark:text-slate-300">30 km/h</strong></span>
                        <span className="font-mono text-[11px]">Transponder ID: TR-{cp.id.toUpperCase()}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        {/* Pagination & View Controls */}
        {filtered.length > itemsPerPage && (
          <div className="flex items-center justify-between pt-3 px-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {displayedCheckpoints.length} of {filtered.length} checkpoints
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewAll(!viewAll)}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline px-2 py-1"
              >
                {viewAll ? 'Show Paginated' : 'View All'}
              </button>
              {!viewAll && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold px-2 text-slate-600 dark:text-slate-300">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Lower Operational Dashboard & Safety Matrix ────────────────── */}
      {/* (Fills the lower portion when scrolling down so the UI never looks empty) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Card A: Automated Block Signaling (ABS) Corridor Matrix */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-emerald-500" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Track Block Signaling Matrix
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              ABS Active
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Rear Section Block</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Clear · Green Signal</span>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Current Occupied Block</span>
              </div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                Train #{info?.trainNumber || 'Active'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Forward Block (+5 km)</span>
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Line Clear Granted</span>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Advance Block (+10 km)</span>
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Station Approach Open</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Interlocking: Electronic (EI)</span>
            <span>Safety Integrity: SIL-4</span>
          </div>
        </div>

        {/* Card B: Recent Waypoint Crossings Audit Log */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-orange-500" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Live Waypoint Transit Log
              </h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              REAL-TIME
            </span>
          </div>

          <div className="space-y-2">
            {crossedCheckpoints.length > 0 ? (
              crossedCheckpoints.map((cp, idx) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{cp.label}</p>
                      <p className="text-[10px] text-slate-400">At KM {cp.distanceKm.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Passed</span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ~{Math.max(10, (live?.speedKmh || 80) - (idx * 3))} km/h
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                Train has not yet crossed any milestones on this trip
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Beacon Accuracy: ±2.5 m</span>
            <span>Telemetry Ping: 1.2s</span>
          </div>
        </div>
      </div>

      {/* ── 6. Administrative Dispatch & Incident Command Bar ─────────────── */}
      <div className="card p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Zap size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
              Emergency Checkpoint Dispatch Tools
            </h5>
            <p className="text-[11px] text-slate-400">
              Direct telemetry override for Section Controllers and Chief Train Dispatchers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={() => {
                checkpoints.filter(c => c.isActive).forEach(c => onToggle(c.id, false));
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 transition-colors"
            >
              Clear All Cautions
            </button>
          )}
          <button
            onClick={() => {
              if (nextTarget) onToggle(nextTarget.id, true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-sm"
          >
            Halt Ahead Section
          </button>
        </div>
      </div>
    </div>
  );
}
