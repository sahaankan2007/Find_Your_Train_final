import type { TrainInfo, TopographyPoint, Station, Checkpoint } from '../types';
import * as turf from '@turf/turf';

// ─── 12301 Howrah–New Delhi Rajdhani Express ──────────────────────────────────

const rajdhaniStations: Station[] = [
  {
    id: 'hwh', name: 'Howrah Junction', code: 'HWH',
    coordinates: [88.3426, 22.5839], scheduledArrival: '17:05', scheduledDeparture: '17:05',
    distanceFromStart: 0, elevationM: 12, state: 'passed',
  },
  {
    id: 'dhn', name: 'Dhanbad', code: 'DHN',
    coordinates: [86.4369, 23.7957], scheduledArrival: '20:10', scheduledDeparture: '20:15',
    distanceFromStart: 260, elevationM: 237, state: 'passed',
  },
  {
    id: 'gaya', name: 'Gaya Junction', code: 'GAYA',
    coordinates: [84.9940, 24.7956], scheduledArrival: '22:15', scheduledDeparture: '22:20',
    distanceFromStart: 438, elevationM: 115, state: 'current',
  },
  {
    id: 'pnbe', name: 'Patna Junction', code: 'PNBE',
    coordinates: [85.1376, 25.5941], scheduledArrival: '23:55', scheduledDeparture: '00:05',
    distanceFromStart: 531, elevationM: 54, state: 'upcoming',
  },
  {
    id: 'ddu', name: 'Pt. Deen Dayal Upadhyaya Jn', code: 'DDU',
    coordinates: [83.4568, 25.2728], scheduledArrival: '01:52', scheduledDeparture: '01:55',
    distanceFromStart: 643, elevationM: 79, state: 'upcoming',
  },
  {
    id: 'ald', name: 'Prayagraj Junction', code: 'ALD',
    coordinates: [81.8462, 25.4358], scheduledArrival: '03:35', scheduledDeparture: '03:40',
    distanceFromStart: 793, elevationM: 98, state: 'upcoming',
  },
  {
    id: 'cnb', name: 'Kanpur Central', code: 'CNB',
    coordinates: [80.3458, 26.4499], scheduledArrival: '05:10', scheduledDeparture: '05:15',
    distanceFromStart: 935, elevationM: 126, state: 'upcoming',
  },
  {
    id: 'ndls', name: 'New Delhi', code: 'NDLS',
    coordinates: [77.2090, 28.6422], scheduledArrival: '10:05', scheduledDeparture: undefined,
    distanceFromStart: 1447, elevationM: 216, state: 'destination',
  },
];

const rajdhaniRoute: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { trainNumber: '12301' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [88.3426, 22.5839], [87.5, 23.3], [86.4369, 23.7957],
        [85.9, 24.1], [85.3, 24.5], [84.9940, 24.7956],
        [85.0, 25.1], [85.1376, 25.5941], [84.3, 25.3],
        [83.4568, 25.2728], [82.5, 25.3], [81.8462, 25.4358],
        [81.0, 25.7], [80.3458, 26.4499], [79.5, 27.0],
        [78.8, 27.5], [78.0, 28.0], [77.5, 28.4], [77.2090, 28.6422],
      ],
    },
  }],
};

const rajdhaniTopo: TopographyPoint[] = [
  { distanceKm: 0, elevationM: 12 }, { distanceKm: 50, elevationM: 45 },
  { distanceKm: 100, elevationM: 120 }, { distanceKm: 150, elevationM: 198 },
  { distanceKm: 200, elevationM: 215 }, { distanceKm: 260, elevationM: 237 },
  { distanceKm: 320, elevationM: 189 }, { distanceKm: 380, elevationM: 145 },
  { distanceKm: 438, elevationM: 115 }, { distanceKm: 531, elevationM: 54 },
  { distanceKm: 600, elevationM: 72 }, { distanceKm: 643, elevationM: 79 },
  { distanceKm: 720, elevationM: 92 }, { distanceKm: 793, elevationM: 98 },
  { distanceKm: 870, elevationM: 112 }, { distanceKm: 935, elevationM: 126 },
  { distanceKm: 1050, elevationM: 148 }, { distanceKm: 1150, elevationM: 167 },
  { distanceKm: 1250, elevationM: 189 }, { distanceKm: 1350, elevationM: 204 },
  { distanceKm: 1447, elevationM: 216 },
];

// ─── 36835 Howrah–Barddhaman Chord Local ─────────────────────────────────────

const chordLocalStations: Station[] = [
  {
    id: 'hwh_cl', name: 'Howrah Junction', code: 'HWH',
    coordinates: [88.3426, 22.5839], scheduledArrival: '06:00', scheduledDeparture: '06:00',
    distanceFromStart: 0, elevationM: 12, state: 'passed',
  },
  {
    id: 'bkn', name: 'Bankura Road', code: 'BRR',
    coordinates: [88.25, 22.72], scheduledArrival: '06:18', scheduledDeparture: '06:19',
    distanceFromStart: 15, elevationM: 18, state: 'passed',
  },
  {
    id: 'dom', name: 'Domjur', code: 'DMJ',
    coordinates: [88.10, 22.78], scheduledArrival: '06:32', scheduledDeparture: '06:33',
    distanceFromStart: 26, elevationM: 22, state: 'current',
  },
  {
    id: 'uli', name: 'Uluberia', code: 'ULB',
    coordinates: [87.97, 22.47], scheduledArrival: '06:55', scheduledDeparture: '06:56',
    distanceFromStart: 40, elevationM: 14, state: 'upcoming',
  },
  {
    id: 'bly', name: 'Bally', code: 'BLY',
    coordinates: [88.22, 22.65], scheduledArrival: '07:15', scheduledDeparture: '07:16',
    distanceFromStart: 58, elevationM: 16, state: 'upcoming',
  },
  {
    id: 'bddc', name: 'Barddhaman', code: 'BWN',
    coordinates: [87.8615, 23.2324], scheduledArrival: '07:45', scheduledDeparture: undefined,
    distanceFromStart: 96, elevationM: 38, state: 'destination',
  },
];

const chordLocalRoute: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { trainNumber: '36835' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [88.3426, 22.5839], [88.25, 22.72], [88.10, 22.78],
        [88.0, 22.65], [87.97, 22.47], [88.0, 22.75],
        [88.22, 22.65], [88.1, 22.9], [87.9, 23.0],
        [87.8615, 23.2324],
      ],
    },
  }],
};

const chordLocalTopo: TopographyPoint[] = [
  { distanceKm: 0, elevationM: 12 }, { distanceKm: 15, elevationM: 18 },
  { distanceKm: 26, elevationM: 22 }, { distanceKm: 40, elevationM: 14 },
  { distanceKm: 58, elevationM: 16 }, { distanceKm: 70, elevationM: 25 },
  { distanceKm: 82, elevationM: 30 }, { distanceKm: 96, elevationM: 38 },
];

// ─── 63296 DDU–Gaya MEMU ──────────────────────────────────────────────────────

const memuStations: Station[] = [
  {
    id: 'ddu_m', name: 'Pt. Deen Dayal Upadhyaya Jn', code: 'DDU',
    coordinates: [83.4568, 25.2728], scheduledArrival: '08:30', scheduledDeparture: '08:30',
    distanceFromStart: 0, elevationM: 79, state: 'passed',
  },
  {
    id: 'ssx', name: 'Sasaram', code: 'SSM',
    coordinates: [84.0274, 24.9478], scheduledArrival: '09:35', scheduledDeparture: '09:37',
    distanceFromStart: 64, elevationM: 138, state: 'current',
  },
  {
    id: 'ehm', name: 'Dehri-On-Sone', code: 'DOS',
    coordinates: [84.1843, 24.9124], scheduledArrival: '09:58', scheduledDeparture: '09:59',
    distanceFromStart: 80, elevationM: 118, state: 'upcoming',
  },
  {
    id: 'gaya_m', name: 'Gaya Junction', code: 'GAYA',
    coordinates: [84.9940, 24.7956], scheduledArrival: '11:10', scheduledDeparture: undefined,
    distanceFromStart: 155, elevationM: 115, state: 'destination',
  },
];

const memuRoute: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { trainNumber: '63296' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [83.4568, 25.2728], [83.7, 25.1], [84.0274, 24.9478],
        [84.1843, 24.9124], [84.4, 24.85], [84.7, 24.82],
        [84.9940, 24.7956],
      ],
    },
  }],
};

const memuTopo: TopographyPoint[] = [
  { distanceKm: 0, elevationM: 79 }, { distanceKm: 30, elevationM: 108 },
  { distanceKm: 64, elevationM: 138 }, { distanceKm: 80, elevationM: 118 },
  { distanceKm: 110, elevationM: 125 }, { distanceKm: 155, elevationM: 115 },
];

// ─── 64423 Ghaziabad–New Delhi EMU ───────────────────────────────────────────

const emuStations: Station[] = [
  {
    id: 'ghz', name: 'Ghaziabad', code: 'GZB',
    coordinates: [77.4169, 28.6674], scheduledArrival: '07:00', scheduledDeparture: '07:00',
    distanceFromStart: 0, elevationM: 207, state: 'passed',
  },
  {
    id: 'sbb', name: 'Sahibabad', code: 'SBB',
    coordinates: [77.3543, 28.6681], scheduledArrival: '07:12', scheduledDeparture: '07:13',
    distanceFromStart: 6, elevationM: 209, state: 'current',
  },
  {
    id: 'anz', name: 'Anand Vihar Terminal', code: 'ANVT',
    coordinates: [77.3159, 28.6469], scheduledArrival: '07:22', scheduledDeparture: '07:23',
    distanceFromStart: 12, elevationM: 213, state: 'upcoming',
  },
  {
    id: 'ndls_e', name: 'New Delhi', code: 'NDLS',
    coordinates: [77.2090, 28.6422], scheduledArrival: '07:40', scheduledDeparture: undefined,
    distanceFromStart: 28, elevationM: 216, state: 'destination',
  },
];

const emuRoute: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { trainNumber: '64423' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.4169, 28.6674], [77.3543, 28.6681],
        [77.3159, 28.6469], [77.2090, 28.6422],
      ],
    },
  }],
};

const emuTopo: TopographyPoint[] = [
  { distanceKm: 0, elevationM: 207 }, { distanceKm: 6, elevationM: 209 },
  { distanceKm: 12, elevationM: 213 }, { distanceKm: 20, elevationM: 215 },
  { distanceKm: 28, elevationM: 216 },
];

// ─── Checkpoint Generator ─────────────────────────────────────────────────────

function generateCheckpoints(
  route: GeoJSON.FeatureCollection,
  totalKm: number,
  intervalKm = 5,
  includeRouteEndpoints = false,
): Checkpoint[] {
  const line = route.features[0]?.geometry as GeoJSON.LineString;
  if (!line) return [];

  const checkpoints: Checkpoint[] = [];
  const numCheckpoints = Math.floor(totalKm / intervalKm);
  const turfLine = turf.lineString(line.coordinates as [number, number][]);
  // The hand-authored map path is illustrative and can be geographically longer
  // than the route's operational distance. Scale checkpoint positions across the
  // full line so the final checkpoint always reaches the destination.
  const mapLineLengthKm = turf.length(turfLine, { units: 'kilometers' });

  for (let i = 1; i <= numCheckpoints; i++) {
    const distKm = i * intervalKm;
    if (distKm >= totalKm) break;

    let coords: [number, number] = [0, 0];
    try {
      const distanceAlongMapKm = (distKm / totalKm) * mapLineLengthKm;
      const pt = turf.along(turfLine, distanceAlongMapKm, { units: 'kilometers' });
      coords = pt.geometry.coordinates as [number, number];
    } catch {
      // fallback: interpolate
      const ratio = distKm / totalKm;
      const idx = Math.floor(ratio * (line.coordinates.length - 1));
      coords = line.coordinates[Math.min(idx, line.coordinates.length - 1)] as [number, number];
    }

    checkpoints.push({
      id: `CP-${String(i).padStart(3, '0')}`,
      label: `CP-${String(i).padStart(3, '0')}`,
      distanceKm: distKm,
      coordinates: coords,
      isActive: false,
      isCrossed: false,
      activeConditions: [],
    });
  }

  if (includeRouteEndpoints) {
    const startCoordinates = line.coordinates[0] as [number, number];
    const endCoordinates = line.coordinates[line.coordinates.length - 1] as [number, number];

    checkpoints.unshift({
      id: 'CP-000',
      label: 'Origin',
      distanceKm: 0,
      coordinates: startCoordinates,
      isActive: false,
      isCrossed: false,
      activeConditions: [],
    });

    checkpoints.push({
      id: 'CP-END',
      label: 'Destination',
      distanceKm: totalKm,
      coordinates: endCoordinates,
      isActive: false,
      isCrossed: false,
      activeConditions: [],
    });
  }

  return checkpoints;
}

// ─── Export Trains ────────────────────────────────────────────────────────────

export const TRAINS: TrainInfo[] = [
  {
    trainNumber: '12301',
    trainName: 'Howrah Rajdhani Express',
    trainClass: 'express',
    source: 'Howrah Junction',
    sourceCode: 'HWH',
    destination: 'New Delhi',
    destinationCode: 'NDLS',
    totalDistanceKm: 1447,
    departureTime: '17:05',
    scheduledArrivalTime: '10:05',
    stations: rajdhaniStations,
    routeGeoJSON: rajdhaniRoute,
    topography: rajdhaniTopo,
    checkpoints: generateCheckpoints(rajdhaniRoute, 1447, 5),
  },
  {
    trainNumber: '36835',
    trainName: 'Howrah–Barddhaman Chord Local',
    trainClass: 'local',
    source: 'Howrah Junction',
    sourceCode: 'HWH',
    destination: 'Barddhaman',
    destinationCode: 'BWN',
    totalDistanceKm: 96,
    departureTime: '06:00',
    scheduledArrivalTime: '07:45',
    stations: chordLocalStations,
    routeGeoJSON: chordLocalRoute,
    topography: chordLocalTopo,
    // One checkpoint every 5 km along the route.
    checkpoints: generateCheckpoints(chordLocalRoute, 96, 5, true),
  },
  {
    trainNumber: '63296',
    trainName: 'DDU–Gaya MEMU',
    trainClass: 'local',
    source: 'Pt. Deen Dayal Upadhyaya Jn',
    sourceCode: 'DDU',
    destination: 'Gaya Junction',
    destinationCode: 'GAYA',
    totalDistanceKm: 155,
    departureTime: '08:30',
    scheduledArrivalTime: '11:10',
    stations: memuStations,
    routeGeoJSON: memuRoute,
    topography: memuTopo,
    checkpoints: generateCheckpoints(memuRoute, 155, 5),
  },
  {
    trainNumber: '64423',
    trainName: 'Ghaziabad–New Delhi EMU',
    trainClass: 'local',
    source: 'Ghaziabad',
    sourceCode: 'GZB',
    destination: 'New Delhi',
    destinationCode: 'NDLS',
    totalDistanceKm: 28,
    departureTime: '07:00',
    scheduledArrivalTime: '07:40',
    stations: emuStations,
    routeGeoJSON: emuRoute,
    topography: emuTopo,
    checkpoints: generateCheckpoints(emuRoute, 28, 5),
  },
];

export const getTrainByNumber = (num: string) =>
  TRAINS.find(t => t.trainNumber === num);
