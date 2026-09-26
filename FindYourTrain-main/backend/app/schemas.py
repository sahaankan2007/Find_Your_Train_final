"""Pydantic request/response schemas.

Field names match the frontend TypeScript types so that responses can be
consumed without a mapping layer.
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


# ── Shared value types ─────────────────────────────────────────────────────────

WeatherCondition = Literal[
    "Sunny", "Cloudy", "Rainy", "Storm", "Fog", "Clear", "Heavy Rain",
]
CongestionLevel = Literal["Low", "Moderate", "High", "Severe"]
AdditionalCondition = Literal[
    "Speed Restriction", "Signal Halt", "Unscheduled Stoppage", "Maintenance Block",
]
TrainStatus = Literal["on-time", "delayed", "severely-delayed", "cancelled", "arrived"]


# ── Station / topography ──────────────────────────────────────────────────────

class StationSchema(BaseModel):
    id: str
    name: str
    code: str
    coordinates: list[float]  # [lng, lat]
    scheduledArrival: str
    scheduledDeparture: str | None = None
    distanceFromStart: float
    elevationM: float
    state: str = "upcoming"
    predictedArrival: str | None = None
    predictedDelay: float | None = None


class TopographyPoint(BaseModel):
    distanceKm: float
    elevationM: float


# ── Train info (static) ──────────────────────────────────────────────────────

class TrainInfoSchema(BaseModel):
    trainNumber: str
    trainName: str
    trainClass: str
    source: str
    sourceCode: str
    destination: str
    destinationCode: str
    totalDistanceKm: float
    departureTime: str
    scheduledArrivalTime: str
    stations: list[StationSchema]
    routeGeoJSON: dict  # FeatureCollection
    topography: list[TopographyPoint]
    checkpoints: list[dict] = []


# ── Conditions ────────────────────────────────────────────────────────────────

class TrainConditionsSchema(BaseModel):
    speedKmh: float = Field(ge=0, le=200)
    weather: str
    temperatureC: float = Field(ge=-10, le=55)
    congestionLevel: str
    congestionReason: str | None = None
    additionalConditions: list[str] = []


class ConditionsUpdateRequest(BaseModel):
    """Body for PATCH /api/admin/trains/{trainNumber}/conditions"""
    speedKmh: float = Field(ge=0, le=200)
    weather: str
    temperatureC: float = Field(ge=-10, le=55)
    congestionLevel: str
    congestionReason: str | None = None
    additionalConditions: list[str] = []


# ── ETA / Prediction ─────────────────────────────────────────────────────────

class ETADataSchema(BaseModel):
    scheduledArrival: str
    predictedArrival: str
    predictedDelayMinutes: float
    confidence: float
    lastUpdated: str


class DelayBreakdownSchema(BaseModel):
    congestion: float = 0
    speedRestriction: float = 0
    signalHalt: float = 0
    weather: float = 0
    unscheduledStoppage: float = 0
    maintenanceBlock: float = 0
    other: float = 0


# ── Live data ─────────────────────────────────────────────────────────────────

class LiveTrainDataSchema(BaseModel):
    trainNumber: str
    coordinates: list[float]
    speedKmh: float
    distanceTravelledKm: float
    distanceRemainingKm: float
    journeyProgressPct: float
    currentStationId: str | None = None
    nextStationId: str = ""
    status: str
    delayMinutes: float
    lastUpdated: str


# ── Full train state (mirrors frontend TrainState) ────────────────────────────

class TrainStateSchema(BaseModel):
    info: TrainInfoSchema
    live: LiveTrainDataSchema
    eta: ETADataSchema
    conditions: TrainConditionsSchema
    delayBreakdown: DelayBreakdownSchema


# ── Raw prediction endpoints ─────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """Direct model prediction request."""
    train_number: str
    departure_station: str
    arrival_station: str
    scheduled_arrival_minutes: float
    scheduled_departure_minutes: float
    actual_departure_minutes: float | None = None
    weather_condition: str
    temperature_c: float
    rainfall_mm: float | None = None
    visibility_km: float | None = None
    traffic_congestion: str
    platform_number: int = 1
    day_of_week: str | None = None
    month: int | None = None
    time_of_day: str | None = None


class BatchPredictRequest(BaseModel):
    items: list[PredictRequest]


class ShapContribution(BaseModel):
    feature: str
    value: Any
    contribution: float


class PredictResponse(BaseModel):
    train_number: str
    predicted_delay_minutes: float
    delay_cause: str
    delay_cause_probabilities: dict[str, float]
    delay_breakdown: DelayBreakdownSchema
    shap_contributions: list[ShapContribution] | None = None


class BatchPredictResponse(BaseModel):
    predictions: list[PredictResponse]


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    models_loaded: dict[str, dict[str, Any]]
