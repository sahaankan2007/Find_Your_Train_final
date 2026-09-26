/**
 * OpenWeatherMap API integration.
 *
 * Uses the free "Current Weather" endpoint:
 *   https://api.openweathermap.org/data/2.5/weather
 *
 * The API key is read from the Vite env variable:
 *   VITE_OPENWEATHER_API_KEY
 */

import type { WeatherCondition } from '../types';

const OWM_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string;
const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

// ─── OWM response shape (minimal) ────────────────────────────────────────────

interface OWMWeatherEntry {
  id: number;       // e.g. 800
  main: string;     // e.g. "Clear"
  description: string;
}

interface OWMResponse {
  weather: OWMWeatherEntry[];
  main: {
    temp: number;       // Kelvin
    humidity: number;
  };
  visibility: number;   // metres (may be absent on some plans)
  rain?: { '1h'?: number };
  dt: number;           // unix timestamp
  name: string;         // city name
}

// ─── Normalised result ────────────────────────────────────────────────────────

export interface LiveWeatherData {
  condition: WeatherCondition;
  temperatureC: number;
  description: string;   // raw OWM description, e.g. "light rain"
  fetchedAt: string;     // ISO timestamp
}

// ─── OWM weather-id → app WeatherCondition ───────────────────────────────────
// https://openweathermap.org/weather-conditions

function owmIdToCondition(id: number, rainfallMmH: number): WeatherCondition {
  // Thunderstorm group
  if (id >= 200 && id < 300) return 'Storm';

  // Drizzle group
  if (id >= 300 && id < 400) return 'Rainy';

  // Rain group
  if (id >= 500 && id < 600) {
    if (id === 502 || id === 503 || id === 504 || rainfallMmH > 7.5) return 'Heavy Rain';
    return 'Rainy';
  }

  // Snow group – treat as fog for train operations
  if (id >= 600 && id < 700) return 'Fog';

  // Atmosphere group (fog, mist, haze, smoke…)
  if (id >= 700 && id < 800) return 'Fog';

  // Clear
  if (id === 800) return 'Clear';

  // Clouds
  if (id === 801 || id === 802) return 'Sunny';   // few / scattered → Sunny
  if (id === 803 || id === 804) return 'Cloudy';  // broken / overcast

  return 'Cloudy';
}

// ─── Public fetch function ────────────────────────────────────────────────────

/**
 * Fetch current weather at [lng, lat] from OpenWeatherMap.
 * Returns null if the API key is missing or the request fails.
 */
export async function fetchWeatherAt(
  lng: number,
  lat: number,
): Promise<LiveWeatherData | null> {
  if (!OWM_API_KEY) {
    console.warn('[weather] VITE_OPENWEATHER_API_KEY is not set – skipping weather fetch.');
    return null;
  }

  try {
    const url = new URL(`${OWM_BASE}/weather`);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('appid', OWM_API_KEY);
    url.searchParams.set('units', 'metric'); // Celsius directly

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`[weather] OWM responded ${res.status} – skipping.`);
      return null;
    }

    const data: OWMResponse = await res.json();

    const primaryWeather = data.weather[0];
    const rainfallMmH = data.rain?.['1h'] ?? 0;
    const condition = owmIdToCondition(primaryWeather.id, rainfallMmH);
    const temperatureC = Math.round(data.main.temp);

    return {
      condition,
      temperatureC,
      description: primaryWeather.description,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[weather] Fetch failed:', err);
    return null;
  }
}

// ─── Per-train weather cache ──────────────────────────────────────────────────
// Avoids hammering the API; caches results for CACHE_TTL_MS per train.

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: LiveWeatherData;
  expiresAt: number;
}

const weatherCache = new Map<string, CacheEntry>();

/**
 * Fetch weather for a train, using a 5-minute per-train cache.
 * trainKey is typically the train number string.
 */
export async function fetchWeatherForTrain(
  trainKey: string,
  lng: number,
  lat: number,
): Promise<LiveWeatherData | null> {
  const now = Date.now();
  const cached = weatherCache.get(trainKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const data = await fetchWeatherAt(lng, lat);
  if (data) {
    weatherCache.set(trainKey, { data, expiresAt: now + CACHE_TTL_MS });
  }
  return data;
}
