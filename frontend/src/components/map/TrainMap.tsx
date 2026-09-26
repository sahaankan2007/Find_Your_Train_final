import { useRef, useEffect, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
// @ts-ignore - MapTiler SDK CSS side-effect import
import '@maptiler/sdk/dist/maptiler-sdk.css';
import type { TrainInfo, LiveTrainData, Checkpoint } from '../../types';
import { useThemeStore } from '../../store/themeStore';
import { CheckpointToast } from '../admin/CheckpointToast';

const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';
if (API_KEY) {
  maptilersdk.config.apiKey = API_KEY;
}

interface TrainMapProps {
  info: TrainInfo;
  live: LiveTrainData;
  isAdmin?: boolean;
  onCheckpointClick?: (cpId: string) => void;
}

const LIGHT_STYLE = 'https://api.maptiler.com/maps/dataviz-light/style.json?key=' + API_KEY;
const DARK_STYLE  = 'https://api.maptiler.com/maps/dataviz-dark/style.json?key='  + API_KEY;

const stateColor: Record<string, string> = {
  passed:      '#94a3b8',
  current:     '#3b82f6',
  upcoming:    '#e2e8f0',
  destination: '#10b981',
};

export function TrainMap({ info, live, isAdmin = false, onCheckpointClick }: TrainMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const trainMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const stationMarkersRef = useRef<maptilersdk.Marker[]>([]);
  const { theme } = useThemeStore();
  const [mapReady, setMapReady] = useState(false);

  // Get center of route
  const routeCoords = (info.routeGeoJSON.features[0]?.geometry as GeoJSON.LineString)?.coordinates ?? [];
  const midIdx = Math.floor(routeCoords.length / 2);
  const center: [number, number] = routeCoords.length > 0
    ? [routeCoords[midIdx][0], routeCoords[midIdx][1]]
    : [82, 25];

  // Compute zoom based on route bounding box
  const getZoom = () => {
    if (routeCoords.length < 2) return 8;
    const lngs = routeCoords.map(c => c[0]);
    const lats = routeCoords.map(c => c[1]);
    const span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats));
    if (span > 10) return 5;
    if (span > 5) return 6.5;
    if (span > 2) return 8;
    return 10;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maptilersdk.Map({
      container: mapContainer.current,
      style: theme === 'dark' ? DARK_STYLE : LIGHT_STYLE,
      center,
      zoom: getZoom(),
      attributionControl: false as any,
    });

    map.addControl(new maptilersdk.NavigationControl(), 'top-right');
    map.addControl(new maptilersdk.AttributionControl({ compact: true } as any), 'bottom-right');

    map.on('load', () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update route layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const coords = (info.routeGeoJSON.features[0]?.geometry as GeoJSON.LineString)?.coordinates ?? [];
    const splitIdx = Math.floor((live.journeyProgressPct / 100) * coords.length);

    const completedCoords = coords.slice(0, Math.max(splitIdx, 1));
    const remainingCoords = coords.slice(Math.max(splitIdx - 1, 0));

    const addOrUpdateSource = (id: string, data: GeoJSON.FeatureCollection) => {
      if (map.getSource(id)) {
        (map.getSource(id) as maptilersdk.GeoJSONSource).setData(data);
      } else {
        map.addSource(id, { type: 'geojson', data });
      }
    };

    const completedData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: completedCoords } }],
    };
    const remainingData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: remainingCoords } }],
    };

    addOrUpdateSource('route-completed', completedData);
    addOrUpdateSource('route-remaining', remainingData);

    if (!map.getLayer('route-remaining-line')) {
      map.addLayer({ id: 'route-remaining-line', type: 'line', source: 'route-remaining',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#cbd5e1', 'line-width': 3, 'line-dasharray': [4, 3] },
      });
    }
    if (!map.getLayer('route-completed-line')) {
      map.addLayer({ id: 'route-completed-line', type: 'line', source: 'route-completed',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 4 },
      });
    }
  }, [mapReady, live.journeyProgressPct, info]);

  // Station markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Remove old
    stationMarkersRef.current.forEach(m => m.remove());
    stationMarkersRef.current = [];

    info.stations.forEach(station => {
      const el = document.createElement('div');
      const isDestination = station.state === 'destination';
      const isCurrent = station.state === 'current';
      const size = isDestination ? 18 : isCurrent ? 16 : 12;
      const border = isCurrent ? 3 : 2;
      el.innerHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${stateColor[station.state]};
          border: ${border}px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
          transform-origin: center center;
        "></div>
      `;
      
      const inner = el.firstElementChild as HTMLElement;
      el.onmouseenter = () => { inner.style.transform = 'scale(1.4)'; };
      el.onmouseleave = () => { inner.style.transform = 'scale(1)'; };

      const popup = new maptilersdk.Popup({ offset: 15, closeButton: false, className: 'station-popup' })
        .setHTML(`
          <div style="padding:12px 14px; min-width:160px;">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">${station.code} · ${station.state.toUpperCase()}</div>
            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:6px;">${station.name}</div>
            <div style="font-size:12px;color:#3b82f6;">Arr: ${station.scheduledArrival}</div>
            ${station.distanceFromStart > 0 ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">${station.distanceFromStart} km from start</div>` : ''}
          </div>
        `);

      const marker = new maptilersdk.Marker({ element: el, anchor: 'center' })
        .setLngLat(station.coordinates)
        .setPopup(popup)
        .addTo(map);

      stationMarkersRef.current.push(marker);
    });
  }, [mapReady, info.stations]);

  // Train marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!trainMarkerRef.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(59,130,246,0.25);animation:ripple 1.5s ease-out infinite;"></div>
          <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(59,130,246,0.15);animation:ripple 1.5s ease-out 0.5s infinite;"></div>
          <div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 4px 12px rgba(59,130,246,0.5);z-index:10;display:flex;align-items:center;justify-content:center;font-size:10px;">🚂</div>
        </div>
      `;
      trainMarkerRef.current = new maptilersdk.Marker({ element: el, anchor: 'center' })
        .setLngLat(live.coordinates)
        .addTo(map);
    } else {
      trainMarkerRef.current.setLngLat(live.coordinates);
    }
  }, [mapReady, live.coordinates]);



  // Theme switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(theme === 'dark' ? DARK_STYLE : LIGHT_STYLE);
  }, [theme]);

  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <div ref={mapContainer} className="w-full" style={{ height: 420 }} />
        {/* Admin-only checkpoint crossing notifications rendered over the map */}
        {isAdmin && <CheckpointToast checkpoints={info.checkpoints} />}
      </div>
    </div>
  );
}
