"""Train data provider: loads static train reference data from a JSON file.

This is a clearly-named data-provider layer.  A real deployment can swap the
JSON file for a database query without changing the rest of the application.
"""
from __future__ import annotations

import copy
import json
import logging
import math
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def _haversine_km(lng1: float, lat1: float, lng2: float, lat2: float) -> float:
    """Haversine distance in km between two [lng, lat] points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _generate_checkpoints(
    route_coords: list[list[float]],
    total_km: float,
    interval_km: float = 5.0,
) -> list[dict[str, Any]]:
    """
    Generate one checkpoint every *interval_km* along the route polyline.
    Coordinates are interpolated linearly between the hand-authored route points.
    Returns a list of checkpoint dicts compatible with the frontend Checkpoint type.
    """
    if len(route_coords) < 2 or total_km <= 0:
        return []

    # Build cumulative distance table along the polyline (haversine)
    seg_lengths: list[float] = []
    for i in range(len(route_coords) - 1):
        a, b = route_coords[i], route_coords[i + 1]
        seg_lengths.append(_haversine_km(a[0], a[1], b[0], b[1]))

    poly_total_km = sum(seg_lengths)
    if poly_total_km == 0:
        return []

    cum: list[float] = [0.0]
    for sl in seg_lengths:
        cum.append(cum[-1] + sl)

    def point_at_poly_km(d_poly: float) -> list[float]:
        """Interpolate a [lng, lat] point at distance d_poly along the polyline."""
        d_poly = max(0.0, min(d_poly, poly_total_km))
        for i in range(len(seg_lengths)):
            if cum[i + 1] >= d_poly or i == len(seg_lengths) - 1:
                seg_len = seg_lengths[i]
                frac = (d_poly - cum[i]) / seg_len if seg_len > 0 else 0.0
                frac = max(0.0, min(frac, 1.0))
                a, b = route_coords[i], route_coords[i + 1]
                return [
                    a[0] + (b[0] - a[0]) * frac,
                    a[1] + (b[1] - a[1]) * frac,
                ]
        return list(route_coords[-1])

    checkpoints: list[dict[str, Any]] = []
    num = int(total_km / interval_km)
    for i in range(1, num + 1):
        dist_km = i * interval_km
        if dist_km >= total_km:
            break
        # Scale operational distance → polyline distance proportionally
        d_poly = (dist_km / total_km) * poly_total_km
        coords = point_at_poly_km(d_poly)
        cp_id = f"CP-{i:03d}"
        checkpoints.append({
            "id": cp_id,
            "label": cp_id,
            "distanceKm": dist_km,
            "coordinates": coords,
            "isActive": False,
            "isCrossed": False,
            "activeConditions": [],
        })

    return checkpoints


class TrainDataProvider:
    """Reads static train info from a JSON file."""

    def __init__(self) -> None:
        self._trains: dict[str, dict[str, Any]] = {}
        # Pre-generated static checkpoints per train (isCrossed always False here)
        self._checkpoints: dict[str, list[dict[str, Any]]] = {}

    def load(self, path: str) -> None:
        file_path = Path(path)
        if not file_path.exists():
            raise FileNotFoundError(f"Train data file not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            self._trains = json.load(f)

        # Pre-generate 5km checkpoints for every train
        for tn, train in self._trains.items():
            self._checkpoints[tn] = _generate_checkpoints(
                route_coords=train["routeCoordinates"],
                total_km=train["totalDistanceKm"],
                interval_km=5.0,
            )
            logger.info(
                "Train %s: generated %d checkpoints every 5 km (total %d km)",
                tn, len(self._checkpoints[tn]), train["totalDistanceKm"],
            )

        logger.info("Loaded static data for %d trains from %s", len(self._trains), file_path)

    @property
    def train_numbers(self) -> list[str]:
        return list(self._trains.keys())

    def get_train(self, train_number: str) -> dict[str, Any] | None:
        return self._trains.get(train_number)

    def get_all_trains(self) -> dict[str, dict[str, Any]]:
        return self._trains

    def get_checkpoints(self, train_number: str) -> list[dict[str, Any]]:
        """Return a fresh copy of the static checkpoint list for a train."""
        return copy.deepcopy(self._checkpoints.get(train_number, []))

    # ── Convenience helpers ────────────────────────────────────────────────

    def build_route_geojson(self, train_number: str) -> dict[str, Any]:
        """Convert routeCoordinates array into a GeoJSON FeatureCollection."""
        train = self._trains.get(train_number)
        if not train:
            return {"type": "FeatureCollection", "features": []}

        return {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"trainNumber": train_number},
                "geometry": {
                    "type": "LineString",
                    "coordinates": train["routeCoordinates"],
                },
            }],
        }

    def build_train_info(self, train_number: str) -> dict[str, Any] | None:
        """Return a TrainInfo-shaped dict ready for the frontend."""
        train = self._trains.get(train_number)
        if not train:
            return None

        # Add station state field (all start as 'upcoming' except last)
        stations = []
        for i, s in enumerate(train["stations"]):
            state = "upcoming"
            if i == len(train["stations"]) - 1:
                state = "destination"
            stations.append({**s, "state": state})

        return {
            "trainNumber": train["trainNumber"],
            "trainName": train["trainName"],
            "trainClass": train["trainClass"],
            "source": train["source"],
            "sourceCode": train["sourceCode"],
            "destination": train["destination"],
            "destinationCode": train["destinationCode"],
            "totalDistanceKm": train["totalDistanceKm"],
            "departureTime": train["departureTime"],
            "scheduledArrivalTime": train["scheduledArrivalTime"],
            "stations": stations,
            "routeGeoJSON": self.build_route_geojson(train_number),
            "topography": train["topography"],
            # Checkpoints generated at 5km intervals from the route geometry
            "checkpoints": self.get_checkpoints(train_number),
        }
