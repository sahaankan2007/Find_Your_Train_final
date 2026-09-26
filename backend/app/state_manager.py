"""In-memory state manager: holds mutable per-train runtime state.

Tracks the current operating conditions, most recent prediction, and initial
live position for each train.  The admin PATCH endpoint mutates this state,
and the GET endpoints read from it.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from .feature_builder import build_feature_row_from_conditions
from .model_service import ModelService
from .schemas import (
    DelayBreakdownSchema,
    ETADataSchema,
    LiveTrainDataSchema,
    TrainConditionsSchema,
    TrainStateSchema,
)
from .train_data_provider import TrainDataProvider

logger = logging.getLogger(__name__)


def _add_minutes_to_time(time_str: str, minutes: float) -> str:
    """Add *minutes* to an 'HH:MM' string, wrapping at 24h."""
    h, m = map(int, time_str.split(":"))
    total = h * 60 + m + int(round(minutes))
    new_h = (total // 60) % 24
    new_m = total % 60
    return f"{new_h:02d}:{new_m:02d}"


def _status_from_delay(delay: float) -> str:
    if delay <= 0:
        return "on-time"
    if delay > 20:
        return "severely-delayed"
    return "delayed"


class _TrainRuntimeState:
    """Internal per-train mutable state."""

    def __init__(
        self,
        conditions: dict[str, Any],
        initial_progress_pct: float,
    ) -> None:
        self.conditions = conditions
        self.progress_pct = initial_progress_pct
        self.predicted_delay: float = 0.0
        self.delay_cause: str = "NO_SIGNIFICANT_DELAY"
        self.cause_probabilities: dict[str, float] = {}
        self.delay_breakdown = DelayBreakdownSchema()
        self.last_updated: str = datetime.now(timezone.utc).isoformat()


class StateManager:
    """Coordinates train data, conditions, and predictions."""

    def __init__(
        self,
        data_provider: TrainDataProvider,
        model_service: ModelService,
    ) -> None:
        self._data = data_provider
        self._models = model_service
        self._states: dict[str, _TrainRuntimeState] = {}

    # ── Initialization ─────────────────────────────────────────────────────

    def initialize(self) -> None:
        """Create runtime state for every train and run initial predictions."""
        for tn in self._data.train_numbers:
            train = self._data.get_train(tn)
            if not train:
                continue

            defaults = train.get("defaultConditions", {})
            progress = train.get("initialProgressPct", 30)

            self._states[tn] = _TrainRuntimeState(
                conditions={
                    "speedKmh": defaults.get("speedKmh", 60),
                    "weather": defaults.get("weather", "Clear"),
                    "temperatureC": defaults.get("temperatureC", 25),
                    "congestionLevel": defaults.get("congestionLevel", "Low"),
                    "congestionReason": defaults.get("congestionReason"),
                    "additionalConditions": defaults.get("additionalConditions", []),
                },
                initial_progress_pct=progress,
            )

            # Run initial prediction
            self._run_prediction(tn)

        logger.info("Initialized runtime state for %d trains", len(self._states))

    # ── Prediction ─────────────────────────────────────────────────────────

    def _run_prediction(self, train_number: str) -> None:
        """Run the model for a train with its current conditions."""
        state = self._states.get(train_number)
        train = self._data.get_train(train_number)
        if not state or not train:
            return

        cond = state.conditions
        row = build_feature_row_from_conditions(
            departure_station_code=train["sourceCode"],
            arrival_station_code=train["destinationCode"],
            scheduled_departure_time=train["departureTime"],
            scheduled_arrival_time=train["scheduledArrivalTime"],
            weather=cond["weather"],
            temperature_c=cond["temperatureC"],
            congestion_level=cond["congestionLevel"],
            platform_number=train.get("defaultPlatformNumber", 1),
        )

        try:
            results = self._models.predict(
                train_number, [row], explain=True,
            )
            result = results[0]

            state.predicted_delay = result["predicted_delay_minutes"]
            state.delay_cause = result["delay_cause"]
            state.cause_probabilities = result["delay_cause_probabilities"]
            state.delay_breakdown = result["delay_breakdown"]
            state.last_updated = datetime.now(timezone.utc).isoformat()

            logger.info(
                "Prediction for %s: delay=%.1f min, cause=%s",
                train_number, state.predicted_delay, state.delay_cause,
            )
        except Exception:
            logger.exception("Prediction failed for train %s", train_number)

    # ── Condition updates ──────────────────────────────────────────────────

    def update_conditions(
        self, train_number: str, new_conditions: dict[str, Any],
    ) -> dict[str, Any] | None:
        """Update conditions and re-run prediction. Returns updated TrainState."""
        state = self._states.get(train_number)
        if not state:
            return None

        state.conditions.update(new_conditions)
        self._run_prediction(train_number)
        return self.get_train_state(train_number)

    # ── State assembly ─────────────────────────────────────────────────────

    def get_train_state(self, train_number: str) -> dict[str, Any] | None:
        """Assemble a complete TrainState dict for the frontend."""
        state = self._states.get(train_number)
        train = self._data.get_train(train_number)
        info_dict = self._data.build_train_info(train_number)
        if not state or not train or not info_dict:
            return None

        cond = state.conditions
        delay = state.predicted_delay
        progress_pct = state.progress_pct
        total_km = train["totalDistanceKm"]
        progress_km = (progress_pct / 100) * total_km

        # Interpolate position from route
        coords = train["routeCoordinates"]
        ratio = min(progress_pct / 100, 0.9999)
        idx = ratio * (len(coords) - 1)
        lo = int(idx)
        hi = min(lo + 1, len(coords) - 1)
        frac = idx - lo
        position = [
            coords[lo][0] + (coords[hi][0] - coords[lo][0]) * frac,
            coords[lo][1] + (coords[hi][1] - coords[lo][1]) * frac,
        ]

        # Update station states based on progress
        stations = info_dict["stations"]
        current_station_id = None
        next_station_id = ""
        for s in stations:
            if s.get("state") == "destination":
                if not next_station_id:
                    next_station_id = s["id"]
                continue
            if s["distanceFromStart"] <= progress_km - 5:
                s["state"] = "passed"
            elif s["distanceFromStart"] <= progress_km + 10:
                s["state"] = "current"
                current_station_id = s["id"]
            else:
                s["state"] = "upcoming"
                if not next_station_id:
                    next_station_id = s["id"]

        # Mark checkpoints as crossed based on current progress
        checkpoints = info_dict.get("checkpoints", [])
        for cp in checkpoints:
            cp["isCrossed"] = cp["distanceKm"] <= progress_km

        scheduled_arrival = train["scheduledArrivalTime"]

        return {
            "info": info_dict,
            "live": {
                "trainNumber": train_number,
                "coordinates": position,
                "speedKmh": cond["speedKmh"],
                "distanceTravelledKm": round(progress_km),
                "distanceRemainingKm": round(total_km - progress_km),
                "journeyProgressPct": progress_pct,
                "currentStationId": current_station_id,
                "nextStationId": next_station_id,
                "status": _status_from_delay(delay),
                "delayMinutes": round(delay, 1),
                "lastUpdated": state.last_updated,
            },
            "eta": {
                "scheduledArrival": scheduled_arrival,
                "predictedArrival": _add_minutes_to_time(scheduled_arrival, delay),
                "predictedDelayMinutes": round(delay, 1),
                "confidence": 0.87,
                "lastUpdated": state.last_updated,
            },
            "conditions": {
                "speedKmh": cond["speedKmh"],
                "weather": cond["weather"],
                "temperatureC": cond["temperatureC"],
                "congestionLevel": cond["congestionLevel"],
                "congestionReason": cond.get("congestionReason"),
                "additionalConditions": cond.get("additionalConditions", []),
            },
            "delayBreakdown": state.delay_breakdown.model_dump(),
        }

    def get_all_train_states(self) -> dict[str, dict[str, Any]]:
        """Return all train states keyed by train number."""
        result = {}
        for tn in self._data.train_numbers:
            ts = self.get_train_state(tn)
            if ts:
                result[tn] = ts
        return result

    def get_conditions(self, train_number: str) -> dict[str, Any] | None:
        state = self._states.get(train_number)
        if not state:
            return None
        return state.conditions

    def get_prediction(self, train_number: str) -> dict[str, Any] | None:
        state = self._states.get(train_number)
        if not state:
            return None
        return {
            "predicted_delay_minutes": state.predicted_delay,
            "delay_cause": state.delay_cause,
            "delay_cause_probabilities": state.cause_probabilities,
            "delay_breakdown": state.delay_breakdown.model_dump(),
        }
