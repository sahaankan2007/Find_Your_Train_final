import type {
  TrainState, LiveTrainData, ETAData, TrainConditions,
  DelayBreakdown, Station, TrainInfo, Checkpoint,
} from '../types';
import { TRAINS } from './trains';

// ─── Mock ML ETA Calculator ───────────────────────────────────────────────────
// Replaces this with a real backend call in production

function calculateMockDelay(conditions: TrainConditions, baseDelayMin: number): number {
  let delay = baseDelayMin;

  // Speed penalty
  const expectedSpeed: Record<string, number> = {
    express: 100, local: 60,
  };
  const refSpeed = 80;
  if (conditions.speedKmh < refSpeed) {
    delay += Math.round((refSpeed - conditions.speedKmh) / 10);
  }

  // Congestion penalty
  const congestionPenalty: Record<string, number> = {
    Low: 0, Moderate: 5, High: 10, Severe: 18,
  };
  delay += congestionPenalty[conditions.congestionLevel] ?? 0;

  // Weather penalty
  const weatherPenalty: Record<string, number> = {
    Clear: 0, Sunny: 0, Cloudy: 1, Fog: 4, Rainy: 3, 'Heavy Rain': 7, Storm: 12,
  };
  delay += weatherPenalty[conditions.weather] ?? 0;

  // Additional conditions
  if (conditions.additionalConditions.includes('Speed Restriction')) delay += 5;
  if (conditions.additionalConditions.includes('Signal Halt')) delay += 3;
  if (conditions.additionalConditions.includes('Unscheduled Stoppage')) delay += 4;
  if (conditions.additionalConditions.includes('Maintenance Block')) delay += 6;

  return Math.max(0, delay);
}

function buildDelayBreakdown(conditions: TrainConditions, totalDelay: number): DelayBreakdown {
  const congestionShare: Record<string, number> = {
    Low: 0, Moderate: 0.3, High: 0.42, Severe: 0.55,
  };
  const weatherShare: Record<string, number> = {
    Clear: 0, Sunny: 0, Cloudy: 0.05, Fog: 0.18, Rainy: 0.15, 'Heavy Rain': 0.3, Storm: 0.45,
  };

  const congestion = Math.round(totalDelay * (congestionShare[conditions.congestionLevel] ?? 0));
  const weather = Math.round(totalDelay * (weatherShare[conditions.weather] ?? 0));
  const signalHalt = conditions.additionalConditions.includes('Signal Halt') ? 3 : 0;
  const maintenanceBlock = conditions.additionalConditions.includes('Maintenance Block') ? 6 : 0;
  const unscheduledStoppage = conditions.additionalConditions.includes('Unscheduled Stoppage') ? 4 : 0;
  const speedRestriction = conditions.additionalConditions.includes('Speed Restriction') ? 5 : 0;
  const other = Math.max(0, totalDelay - congestion - weather - signalHalt - maintenanceBlock - unscheduledStoppage - speedRestriction);

  return { congestion, speedRestriction, signalHalt, weather, unscheduledStoppage, maintenanceBlock, other };
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMin = h * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function interpolatePosition(train: TrainInfo, progressPct: number): [number, number] {
  const coords = (train.routeGeoJSON.features[0]?.geometry as GeoJSON.LineString)?.coordinates ?? [];
  if (coords.length < 2) return [0, 0];
  const ratio = Math.min(progressPct / 100, 0.9999);
  const idx = ratio * (coords.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, coords.length - 1);
  const frac = idx - lo;
  return [
    coords[lo][0] + (coords[hi][0] - coords[lo][0]) * frac,
    coords[lo][1] + (coords[hi][1] - coords[lo][1]) * frac,
  ] as [number, number];
}

function updateStationStates(stations: Station[], progressKm: number): Station[] {
  return stations.map(s => {
    if (s.state === 'destination') return s;
    if (s.distanceFromStart <= progressKm - 5) return { ...s, state: 'passed' };
    if (s.distanceFromStart <= progressKm + 10) return { ...s, state: 'current' };
    return { ...s, state: 'upcoming' };
  });
}

function updateCheckpointStates(checkpoints: Checkpoint[], progressKm: number): Checkpoint[] {
  return checkpoints.map(cp =>
    cp.distanceKm <= progressKm ? { ...cp, isCrossed: true } : cp
  );
}

// ─── Initial State per Train ──────────────────────────────────────────────────

const initialProgress: Record<string, number> = {
  '12301': 35,   // ~35% through journey
  '36835': 28,
  '63296': 42,
  '64423': 22,
};

const initialDelay: Record<string, number> = {
  '12301': 14,
  '36835': 4,
  '63296': 0,
  '64423': 11,
};

const defaultConditions: TrainConditions = {
  speedKmh: 82,
  weather: 'Cloudy',
  temperatureC: 27,
  congestionLevel: 'Moderate',
  congestionReason: 'High train density',
  additionalConditions: [],
};

const trainConditions: Record<string, TrainConditions> = {
  '12301': { ...defaultConditions, speedKmh: 97, congestionLevel: 'Moderate', congestionReason: 'High train density', weather: 'Cloudy', temperatureC: 24 },
  '36835': { ...defaultConditions, speedKmh: 55, congestionLevel: 'Low', congestionReason: null, weather: 'Cloudy', temperatureC: 28 },
  '63296': { ...defaultConditions, speedKmh: 68, congestionLevel: 'Low', congestionReason: null, weather: 'Sunny', temperatureC: 32, additionalConditions: [] },
  '64423': { ...defaultConditions, speedKmh: 60, congestionLevel: 'High', congestionReason: 'Platform occupancy', weather: 'Fog', temperatureC: 22, additionalConditions: ['Signal Halt'] },
};

// ─── Build Initial State ──────────────────────────────────────────────────────

export function buildInitialState(): Record<string, TrainState> {
  const state: Record<string, TrainState> = {};

  for (const train of TRAINS) {
    const n = train.trainNumber;
    const progPct = initialProgress[n] ?? 30;
    const progKm = (progPct / 100) * train.totalDistanceKm;
    const conditions = { ...(trainConditions[n] ?? defaultConditions) };
    const baseDelay = initialDelay[n] ?? 0;
    const delay = calculateMockDelay(conditions, baseDelay);
    const breakdown = buildDelayBreakdown(conditions, delay);

    const stations = updateStationStates([...train.stations], progKm);
    const checkpoints = updateCheckpointStates([...train.checkpoints], progKm);
    const coords = interpolatePosition(train, progPct);
    const nextStation = stations.find(s => s.state === 'upcoming' || s.state === 'destination');
    const currentStation = stations.find(s => s.state === 'current');

    const liveData: LiveTrainData = {
      trainNumber: n,
      coordinates: coords,
      speedKmh: conditions.speedKmh,
      distanceTravelledKm: Math.round(progKm),
      distanceRemainingKm: Math.round(train.totalDistanceKm - progKm),
      journeyProgressPct: progPct,
      currentStationId: currentStation?.id ?? null,
      nextStationId: nextStation?.id ?? '',
      status: delay === 0 ? 'on-time' : delay > 20 ? 'severely-delayed' : 'delayed',
      delayMinutes: delay,
      lastUpdated: new Date().toISOString(),
    };

    const eta: ETAData = {
      scheduledArrival: train.scheduledArrivalTime,
      predictedArrival: addMinutesToTime(train.scheduledArrivalTime, delay),
      predictedDelayMinutes: delay,
      confidence: 0.87,
      lastUpdated: new Date().toISOString(),
    };

    state[n] = {
      info: { ...train, stations, checkpoints },
      live: liveData,
      eta,
      conditions,
      delayBreakdown: breakdown,
    };
  }

  return state;
}

// ─── Update state on admin change ────────────────────────────────────────────

export function recalculateWithConditions(
  prev: TrainState,
  newConditions: TrainConditions
): TrainState {
  const delay = calculateMockDelay(newConditions, 0);
  const breakdown = buildDelayBreakdown(newConditions, delay);
  const eta: ETAData = {
    scheduledArrival: prev.eta.scheduledArrival,
    predictedArrival: addMinutesToTime(prev.eta.scheduledArrival, delay),
    predictedDelayMinutes: delay,
    confidence: 0.83,
    lastUpdated: new Date().toISOString(),
  };
  return {
    ...prev,
    conditions: newConditions,
    live: {
      ...prev.live,
      speedKmh: newConditions.speedKmh,
      status: delay === 0 ? 'on-time' : delay > 20 ? 'severely-delayed' : 'delayed',
      delayMinutes: delay,
      lastUpdated: new Date().toISOString(),
    },
    eta,
    delayBreakdown: breakdown,
  };
}

// ─── Tick: advance train position ─────────────────────────────────────────────

export function tickTrain(prev: TrainState): TrainState {
  const { info, live, conditions } = prev;
  const speedIncrementPct = (conditions.speedKmh / info.totalDistanceKm) * (3 / 3600) * 100;
  const newPct = Math.min(live.journeyProgressPct + speedIncrementPct * 2.5, 99.5);
  const newKm = (newPct / 100) * info.totalDistanceKm;

  const stations = updateStationStates([...info.stations], newKm);
  const checkpoints = updateCheckpointStates([...info.checkpoints], newKm);
  const coords = interpolatePosition(info, newPct);
  const nextStation = stations.find(s => s.state === 'upcoming' || s.state === 'destination');
  const currentStation = stations.find(s => s.state === 'current');

  return {
    ...prev,
    info: { ...info, stations, checkpoints },
    live: {
      ...live,
      coordinates: coords,
      distanceTravelledKm: Math.round(newKm),
      distanceRemainingKm: Math.round(info.totalDistanceKm - newKm),
      journeyProgressPct: newPct,
      currentStationId: currentStation?.id ?? null,
      nextStationId: nextStation?.id ?? '',
      lastUpdated: new Date().toISOString(),
    },
  };
}
