"""Feature builder: maps admin-friendly inputs to the model's 14-feature vector.

Handles derivation of features the admin UI doesn't expose (rainfall, visibility,
time_of_day, day_of_week, month) from available inputs and the current datetime.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

# ── Weather → derived features ────────────────────────────────────────────────

WEATHER_TO_RAINFALL: dict[str, float] = {
    "Clear": 0.0,
    "Sunny": 0.0,
    "Cloudy": 0.5,
    "Fog": 0.2,
    "Rainy": 5.0,
    "Heavy Rain": 15.0,
    "Storm": 25.0,
}

WEATHER_TO_VISIBILITY: dict[str, float] = {
    "Clear": 15.0,
    "Sunny": 12.0,
    "Cloudy": 8.0,
    "Fog": 1.0,
    "Rainy": 4.0,
    "Heavy Rain": 2.0,
    "Storm": 1.5,
}


def _time_str_to_minutes(time_str: str) -> float:
    """Convert 'HH:MM' to minutes since midnight."""
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def _hour_to_time_of_day(hour: int) -> str:
    """Classify hour into a period label matching the training data."""
    if 5 <= hour < 12:
        return "Morning"
    if 12 <= hour < 17:
        return "Afternoon"
    if 17 <= hour < 21:
        return "Evening"
    return "Night"


def _day_name(dt: datetime) -> str:
    """Return the English weekday name matching the training data."""
    return dt.strftime("%A")  # e.g. "Monday"


# ── Feature names and categorical indices (from model metadata) ───────────────

FEATURE_NAMES: list[str] = [
    "Departure_Station",
    "Arrival_Station",
    "Scheduled_Arrival_Minutes",
    "Scheduled_Departure_Minutes",
    "Actual_Departure_Minutes",
    "Weather Condition",
    "Temperature (C)",
    "Rainfall (mm)",
    "Visibility (km)",
    "Traffic Congestion",
    "Platform Number",
    "Day_of_Week",
    "Month",
    "Time_of_Day",
]

CAT_FEATURE_INDICES: list[int] = [0, 1, 5, 9, 11, 13]

# ── SHAP grouping: map model features → frontend breakdown categories ────────

SHAP_GROUPS: dict[str, list[str]] = {
    "weather": ["Weather Condition", "Rainfall (mm)", "Visibility (km)", "Temperature (C)"],
    "congestion": ["Traffic Congestion"],
    "other": [
        "Departure_Station", "Arrival_Station",
        "Scheduled_Arrival_Minutes", "Scheduled_Departure_Minutes",
        "Actual_Departure_Minutes", "Platform Number",
        "Day_of_Week", "Month", "Time_of_Day",
    ],
}


def build_feature_row(
    *,
    departure_station: str,
    arrival_station: str,
    scheduled_arrival_minutes: float,
    scheduled_departure_minutes: float,
    actual_departure_minutes: float | None,
    weather_condition: str,
    temperature_c: float,
    rainfall_mm: float | None,
    visibility_km: float | None,
    traffic_congestion: str,
    platform_number: int,
    day_of_week: str | None,
    month: int | None,
    time_of_day: str | None,
) -> list[Any]:
    """Build a single feature row matching FEATURE_NAMES order.

    Auto-derives rainfall, visibility, day_of_week, month, and time_of_day
    when not provided.
    """
    now = datetime.now()

    if rainfall_mm is None:
        rainfall_mm = WEATHER_TO_RAINFALL.get(weather_condition, 0.0)
    if visibility_km is None:
        visibility_km = WEATHER_TO_VISIBILITY.get(weather_condition, 10.0)
    if actual_departure_minutes is None:
        actual_departure_minutes = scheduled_departure_minutes
    if day_of_week is None:
        day_of_week = _day_name(now)
    if month is None:
        month = now.month
    if time_of_day is None:
        time_of_day = _hour_to_time_of_day(now.hour)

    return [
        departure_station,           # 0  cat
        arrival_station,             # 1  cat
        scheduled_arrival_minutes,   # 2  num
        scheduled_departure_minutes, # 3  num
        actual_departure_minutes,    # 4  num
        weather_condition,           # 5  cat
        temperature_c,               # 6  num
        rainfall_mm,                 # 7  num
        visibility_km,               # 8  num
        traffic_congestion,          # 9  cat
        platform_number,             # 10 num
        day_of_week,                 # 11 cat
        month,                       # 12 num
        time_of_day,                 # 13 cat
    ]


def build_feature_row_from_conditions(
    *,
    departure_station_code: str,
    arrival_station_code: str,
    scheduled_departure_time: str,
    scheduled_arrival_time: str,
    weather: str,
    temperature_c: float,
    congestion_level: str,
    platform_number: int = 1,
) -> list[Any]:
    """Build a feature row from admin-level inputs + static train data.

    Derives all secondary features (rainfall, visibility, time info) automatically.
    """
    sched_dep_min = _time_str_to_minutes(scheduled_departure_time)
    sched_arr_min = _time_str_to_minutes(scheduled_arrival_time)

    return build_feature_row(
        departure_station=departure_station_code,
        arrival_station=arrival_station_code,
        scheduled_arrival_minutes=sched_arr_min,
        scheduled_departure_minutes=sched_dep_min,
        actual_departure_minutes=None,  # assume on-time departure
        weather_condition=weather,
        temperature_c=temperature_c,
        rainfall_mm=None,           # derived from weather
        visibility_km=None,         # derived from weather
        traffic_congestion=congestion_level,
        platform_number=platform_number,
        day_of_week=None,           # derived from current time
        month=None,                 # derived from current time
        time_of_day=None,           # derived from current time
    )


def group_shap_values(
    feature_names: list[str],
    shap_values: list[float],
) -> dict[str, float]:
    """Group per-feature SHAP values into frontend breakdown categories.

    Only includes positive contributions (delay-increasing).
    Negative contributions are absorbed into the model's base prediction.
    """
    feature_shap = dict(zip(feature_names, shap_values))

    grouped: dict[str, float] = {}
    for group_name, features in SHAP_GROUPS.items():
        total = sum(max(0.0, feature_shap.get(f, 0.0)) for f in features)
        grouped[group_name] = round(total, 1)

    return grouped
