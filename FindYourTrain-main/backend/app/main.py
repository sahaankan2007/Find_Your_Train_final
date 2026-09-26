"""FastAPI application — Find Your Train backend.

Wraps trained CatBoost models for ETA/delay prediction and delay-cause
classification for Indian Railways coaching trains.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .feature_builder import build_feature_row
from .model_service import ModelService
from .schemas import (
    BatchPredictRequest,
    BatchPredictResponse,
    ConditionsUpdateRequest,
    HealthResponse,
    PredictRequest,
    PredictResponse,
)
from .state_manager import StateManager
from .train_data_provider import TrainDataProvider

# ── Logging ────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ── Load .env ──────────────────────────────────────────────────────────────────

load_dotenv()

# ── Shared service instances ───────────────────────────────────────────────────

model_service = ModelService()
data_provider = TrainDataProvider()
state_manager = StateManager(data_provider, model_service)


# ── Lifespan: load everything once at startup ─────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    model_dir = os.getenv("MODEL_DIR", ".")
    train_data_path = os.getenv("TRAIN_DATA_PATH", "./data/trains.json")

    logger.info("Loading models from %s", model_dir)
    model_service.load_models(model_dir)

    logger.info("Loading train data from %s", train_data_path)
    data_provider.load(train_data_path)

    logger.info("Initializing state manager (running initial predictions)…")
    state_manager.initialize()

    yield  # app is running

    logger.info("Shutting down.")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Find Your Train — Backend",
    description="CatBoost ETA prediction & delay-cause classification API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════════════════════


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    return HealthResponse(
        status="ok" if model_service.is_loaded else "no models",
        models_loaded={
            tn: tm.summary for tn, tm in model_service.models.items()
        },
    )


# ── Train list / info (PRD: GET /api/trains) ──────────────────────────────────

@app.get("/api/trains", tags=["Trains"])
async def list_trains():
    """Return all trains with current state (info + conditions + prediction)."""
    return state_manager.get_all_train_states()


@app.get("/api/trains/{train_number}", tags=["Trains"])
async def get_train(train_number: str):
    """Return a single train's full state."""
    ts = state_manager.get_train_state(train_number)
    if not ts:
        raise HTTPException(404, f"Train {train_number} not found")
    return ts


# ── Route (PRD: GET /api/trains/:trainNumber/route) ───────────────────────────

@app.get("/api/trains/{train_number}/route", tags=["Trains"])
async def get_route(train_number: str):
    geojson = data_provider.build_route_geojson(train_number)
    if not geojson["features"]:
        raise HTTPException(404, f"Route not found for train {train_number}")
    return geojson


# ── Live data (PRD: GET /api/trains/:trainNumber/live) ────────────────────────

@app.get("/api/trains/{train_number}/live", tags=["Trains"])
async def get_live(train_number: str):
    ts = state_manager.get_train_state(train_number)
    if not ts:
        raise HTTPException(404, f"Train {train_number} not found")
    return ts["live"]


# ── Prediction (PRD: GET /api/trains/:trainNumber/prediction) ─────────────────

@app.get("/api/trains/{train_number}/prediction", tags=["Trains"])
async def get_prediction(
    train_number: str,
    explain: bool = Query(False, description="Include SHAP feature contributions"),
):
    """Return the current prediction for a train, optionally with SHAP explanation."""
    pred = state_manager.get_prediction(train_number)
    if not pred:
        raise HTTPException(404, f"Train {train_number} not found")

    if explain:
        # Re-run prediction with SHAP
        train = data_provider.get_train(train_number)
        cond = state_manager.get_conditions(train_number)
        if train and cond:
            from .feature_builder import build_feature_row_from_conditions
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
            results = model_service.predict(train_number, [row], explain=True)
            return results[0]

    return pred


# ── Conditions (PRD: GET + PATCH) ─────────────────────────────────────────────

@app.get("/api/trains/{train_number}/conditions", tags=["Trains"])
async def get_conditions(train_number: str):
    cond = state_manager.get_conditions(train_number)
    if cond is None:
        raise HTTPException(404, f"Train {train_number} not found")
    return cond


@app.patch("/api/admin/trains/{train_number}/conditions", tags=["Admin"])
async def update_conditions(train_number: str, body: ConditionsUpdateRequest):
    """Update operating conditions, re-run ML prediction, return updated state."""
    updated = state_manager.update_conditions(
        train_number,
        body.model_dump(),
    )
    if not updated:
        raise HTTPException(404, f"Train {train_number} not found")
    return updated


# ── Raw prediction endpoints ─────────────────────────────────────────────────

@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict_single(
    body: PredictRequest,
    explain: bool = Query(False, description="Include SHAP contributions"),
):
    """Direct model prediction from raw features."""
    if body.train_number not in model_service.models:
        raise HTTPException(404, f"No model for train {body.train_number}")

    row = build_feature_row(
        departure_station=body.departure_station,
        arrival_station=body.arrival_station,
        scheduled_arrival_minutes=body.scheduled_arrival_minutes,
        scheduled_departure_minutes=body.scheduled_departure_minutes,
        actual_departure_minutes=body.actual_departure_minutes,
        weather_condition=body.weather_condition,
        temperature_c=body.temperature_c,
        rainfall_mm=body.rainfall_mm,
        visibility_km=body.visibility_km,
        traffic_congestion=body.traffic_congestion,
        platform_number=body.platform_number,
        day_of_week=body.day_of_week,
        month=body.month,
        time_of_day=body.time_of_day,
    )

    results = model_service.predict(body.train_number, [row], explain=explain)
    result = results[0]
    return PredictResponse(
        train_number=body.train_number,
        **result,
    )


@app.post("/predict/batch", response_model=BatchPredictResponse, tags=["Prediction"])
async def predict_batch(body: BatchPredictRequest):
    """Batch prediction — groups items by train_number for efficient inference."""
    # Group by train
    groups: dict[str, list[tuple[int, PredictRequest]]] = {}
    for i, item in enumerate(body.items):
        groups.setdefault(item.train_number, []).append((i, item))

    all_results: list[tuple[int, dict[str, Any]]] = []

    for tn, items in groups.items():
        if tn not in model_service.models:
            raise HTTPException(404, f"No model for train {tn}")

        rows = []
        for _, item in items:
            rows.append(build_feature_row(
                departure_station=item.departure_station,
                arrival_station=item.arrival_station,
                scheduled_arrival_minutes=item.scheduled_arrival_minutes,
                scheduled_departure_minutes=item.scheduled_departure_minutes,
                actual_departure_minutes=item.actual_departure_minutes,
                weather_condition=item.weather_condition,
                temperature_c=item.temperature_c,
                rainfall_mm=item.rainfall_mm,
                visibility_km=item.visibility_km,
                traffic_congestion=item.traffic_congestion,
                platform_number=item.platform_number,
                day_of_week=item.day_of_week,
                month=item.month,
                time_of_day=item.time_of_day,
            ))

        # Single .predict() call for all items of this train
        results = model_service.predict(tn, rows, explain=False)

        for (orig_idx, item), result in zip(items, results):
            all_results.append((orig_idx, {
                "train_number": tn,
                **result,
            }))

    # Restore original order
    all_results.sort(key=lambda x: x[0])
    predictions = [
        PredictResponse(**r) for _, r in all_results
    ]

    return BatchPredictResponse(predictions=predictions)


# ═══════════════════════════════════════════════════════════════════════════════
# Run with: uvicorn app.main:app --reload
# ═══════════════════════════════════════════════════════════════════════════════
