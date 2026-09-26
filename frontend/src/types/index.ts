// ─── Train Types ──────────────────────────────────────────────────────────────

export type TrainClass = 'express' | 'local';
export type TrainStatus = 'on-time' | 'delayed' | 'severely-delayed' | 'cancelled' | 'arrived';

export type WeatherCondition =
  | 'Sunny' | 'Cloudy' | 'Rainy' | 'Storm' | 'Fog' | 'Clear' | 'Heavy Rain';

export type CongestionLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

export type CongestionReason =
  | 'High train density'
  | 'Preceding train delay'
  | 'Signal restriction'
  | 'Platform occupancy'
  | 'Maintenance block'
  | 'Track availability'
  | 'Operational bottleneck'
  | 'Other';

export type AdditionalCondition =
  | 'Speed Restriction'
  | 'Signal Halt'
  | 'Unscheduled Stoppage'
  | 'Maintenance Block';

// ─── Station ─────────────────────────────────────────────────────────────────

export type StationState = 'upcoming' | 'current' | 'passed' | 'destination';

export interface Station {
  id: string;
  name: string;
  code: string;
  coordinates: [number, number]; // [lng, lat]
  scheduledArrival: string;      // HH:MM
  scheduledDeparture?: string;
  distanceFromStart: number;     // km
  elevationM: number;
  state: StationState;
  predictedArrival?: string;
  predictedDelay?: number;       // minutes
  platformNumber?: number;
}

// ─── Topography ──────────────────────────────────────────────────────────────

export interface TopographyPoint {
  distanceKm: number;
  elevationM: number;
}

export interface TopographyData {
  points: TopographyPoint[];
  minElevation: number;
  maxElevation: number;
  currentPositionKm: number;
}

// ─── ETA ─────────────────────────────────────────────────────────────────────

export interface ETAData {
  scheduledArrival: string;
  predictedArrival: string;
  predictedDelayMinutes: number;
  confidence: number; // 0–1
  lastUpdated: string;
}

// ─── Delay Breakdown ─────────────────────────────────────────────────────────

export interface DelayBreakdown {
  congestion: number;
  speedRestriction: number;
  signalHalt: number;
  weather: number;
  unscheduledStoppage: number;
  maintenanceBlock: number;
  other: number;
}

// ─── Train Conditions ────────────────────────────────────────────────────────

export interface TrainConditions {
  speedKmh: number;
  weather: WeatherCondition;
  temperatureC: number;
  congestionLevel: CongestionLevel;
  congestionReason: CongestionReason | null;
  additionalConditions: AdditionalCondition[];
}

// ─── Live Train Data ─────────────────────────────────────────────────────────

export interface LiveTrainData {
  trainNumber: string;
  coordinates: [number, number]; // current position [lng, lat]
  speedKmh: number;
  distanceTravelledKm: number;
  distanceRemainingKm: number;
  journeyProgressPct: number;
  currentStationId: string | null;
  nextStationId: string;
  status: TrainStatus;
  delayMinutes: number;
  lastUpdated: string;
}

// ─── Checkpoint ───────────────────────────────────────────────────────────────

export interface Checkpoint {
  id: string;
  label: string;
  distanceKm: number;
  coordinates: [number, number];
  isActive: boolean;
  isCrossed: boolean;          // true once the train passes this checkpoint
  activeConditions: AdditionalCondition[];
}

// ─── Full Train Info ──────────────────────────────────────────────────────────

export interface TrainInfo {
  trainNumber: string;
  trainName: string;
  trainClass: TrainClass;
  source: string;
  sourceCode: string;
  destination: string;
  destinationCode: string;
  totalDistanceKm: number;
  departureTime: string;   // HH:MM
  scheduledArrivalTime: string;
  stations: Station[];
  routeGeoJSON: GeoJSON.FeatureCollection;
  topography: TopographyPoint[];
  checkpoints: Checkpoint[];
}

// ─── Combined State ───────────────────────────────────────────────────────────

export interface TrainState {
  info: TrainInfo;
  live: LiveTrainData;
  eta: ETAData;
  conditions: TrainConditions;
  delayBreakdown: DelayBreakdown;
}
