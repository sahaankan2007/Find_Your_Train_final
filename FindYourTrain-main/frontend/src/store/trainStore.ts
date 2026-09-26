import { create } from 'zustand';
import type { TrainState, TrainConditions, Checkpoint } from '../types';
import { tickTrain } from '../mock/simulation';
import { api } from '../api';
import { fetchWeatherForTrain } from '../api/weather';

interface TrainStore {
  trains: Record<string, TrainState>;
  selectedTrainNumber: string | null;
  isSimulating: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadInitialData: () => Promise<void>;
  selectTrain: (n: string | null) => void;
  applyConditions: (trainNumber: string, conditions: TrainConditions) => Promise<void>;
  toggleCheckpoint: (trainNumber: string, cpId: string, active: boolean) => void;
  tick: () => void;
  refreshWeather: () => Promise<void>;
  startSimulation: () => void;
  stopSimulation: () => void;
}

let simInterval: ReturnType<typeof setInterval> | null = null;

// Refresh real weather every N ticks (tick fires every 3 s → ~5 min = 100 ticks)
const WEATHER_REFRESH_TICKS = 100;
let tickCount = 0;

export const useTrainStore = create<TrainStore>((set, get) => ({
  trains: {},
  selectedTrainNumber: null,
  isSimulating: false,
  isLoading: false,
  error: null,

  loadInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const trains = await api.getTrains();
      set({ trains, isLoading: false });
      // Fetch real weather right after data loads (non-blocking)
      get().refreshWeather();
    } catch (err: any) {
      set({ error: err.message || 'Failed to load trains', isLoading: false });
    }
  },

  selectTrain: (n) => set({ selectedTrainNumber: n }),

  applyConditions: async (trainNumber, conditions) => {
    try {
      const updatedState = await api.updateConditions(trainNumber, conditions);
      set(s => {
        const prev = s.trains[trainNumber];
        return {
          trains: {
            ...s.trains,
            [trainNumber]: {
              ...updatedState,
              info: {
                ...updatedState.info,
                stations: prev.info.stations, // preserve station states
              },
              live: {
                ...updatedState.live,
                coordinates: prev.live.coordinates,
                distanceTravelledKm: prev.live.distanceTravelledKm,
                distanceRemainingKm: prev.live.distanceRemainingKm,
                journeyProgressPct: prev.live.journeyProgressPct,
                currentStationId: prev.live.currentStationId,
                nextStationId: prev.live.nextStationId,
              },
            },
          },
        };
      });
    } catch (err: any) {
      console.error('Failed to apply conditions:', err);
    }
  },

  toggleCheckpoint: (trainNumber, cpId, active) => {
    set(s => {
      const prev = s.trains[trainNumber];
      if (!prev) return s;
      const checkpoints: Checkpoint[] = prev.info.checkpoints.map(cp =>
        cp.id === cpId ? { ...cp, isActive: active } : cp
      );
      return {
        trains: {
          ...s.trains,
          [trainNumber]: { ...prev, info: { ...prev.info, checkpoints } },
        },
      };
    });
  },

  tick: () => {
    set(s => {
      const updated: Record<string, TrainState> = {};
      for (const [num, state] of Object.entries(s.trains)) {
        updated[num] = tickTrain(state);
      }
      return { trains: updated };
    });

    // Periodically refresh live weather data
    tickCount += 1;
    if (tickCount >= WEATHER_REFRESH_TICKS) {
      tickCount = 0;
      get().refreshWeather();
    }
  },

  /**
   * Fetch real weather from OpenWeatherMap for every loaded train and patch
   * only the weather-related fields in their conditions object.
   * All other conditions (speed, congestion, etc.) remain unchanged.
   */
  refreshWeather: async () => {
    const { trains } = get();
    if (Object.keys(trains).length === 0) return;

    const updates = await Promise.all(
      Object.entries(trains).map(async ([trainNumber, state]) => {
        const [lng, lat] = state.live.coordinates;
        const weather = await fetchWeatherForTrain(trainNumber, lng, lat);
        return { trainNumber, weather };
      })
    );

    set(s => {
      const patched: Record<string, TrainState> = { ...s.trains };
      for (const { trainNumber, weather } of updates) {
        if (!weather || !patched[trainNumber]) continue;
        patched[trainNumber] = {
          ...patched[trainNumber],
          conditions: {
            ...patched[trainNumber].conditions,
            weather: weather.condition,
            temperatureC: weather.temperatureC,
          },
        };
      }
      return { trains: patched };
    });
  },

  startSimulation: () => {
    if (simInterval) return;
    simInterval = setInterval(() => {
      get().tick();
    }, 3000);
    set({ isSimulating: true });
  },

  stopSimulation: () => {
    if (simInterval) {
      clearInterval(simInterval);
      simInterval = null;
    }
    set({ isSimulating: false });
  },
}));

