"""Model service: loads CatBoost models once at startup and exposes prediction
and SHAP explanation methods.

Each train has its own pair of models (delay regressor + cause classifier).
Models and metadata are loaded from disk at startup via ``load_models()``.
"""
from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Any

import numpy as np
from catboost import CatBoostClassifier, CatBoostRegressor, Pool

from .feature_builder import CAT_FEATURE_INDICES, FEATURE_NAMES, group_shap_values
from .schemas import DelayBreakdownSchema, ShapContribution

logger = logging.getLogger(__name__)


class TrainModel:
    """Holds delay + cause models for a single train."""

    def __init__(
        self,
        train_number: str,
        delay_model: CatBoostRegressor,
        cause_model: CatBoostClassifier,
        metadata: dict[str, Any],
    ) -> None:
        self.train_number = train_number
        self.delay_model = delay_model
        self.cause_model = cause_model
        self.metadata = metadata
        self.cause_classes: list[str] = [str(c) for c in cause_model.classes_]

    @property
    def summary(self) -> dict[str, Any]:
        return {
            "train_number": self.train_number,
            "train_name": self.metadata.get("train_name", ""),
            "delay_model_trees": self.delay_model.tree_count_,
            "cause_model_trees": self.cause_model.tree_count_,
            "cause_classes": self.cause_classes,
            "delay_mae": self.metadata.get("delay_mae"),
            "cause_accuracy": self.metadata.get("cause_accuracy"),
        }


class ModelService:
    """Singleton service that owns all loaded models."""

    def __init__(self) -> None:
        self.models: dict[str, TrainModel] = {}

    # ── Loading ────────────────────────────────────────────────────────────

    def load_models(self, model_dir: str) -> None:
        """Discover per-train directories and load all model pairs."""
        base = Path(model_dir)
        for subdir in sorted(base.iterdir()):
            if not subdir.is_dir():
                continue
            delay_path = subdir / "delay_model.cbm"
            cause_path = subdir / "cause_model.cbm"
            meta_path = subdir / "model_metadata.pkl"
            if not (delay_path.exists() and cause_path.exists() and meta_path.exists()):
                continue

            train_number = subdir.name
            logger.info("Loading models for train %s from %s", train_number, subdir)

            delay_model = CatBoostRegressor()
            delay_model.load_model(str(delay_path))

            cause_model = CatBoostClassifier()
            cause_model.load_model(str(cause_path))

            with open(meta_path, "rb") as f:
                metadata = pickle.load(f)

            self.models[train_number] = TrainModel(
                train_number=train_number,
                delay_model=delay_model,
                cause_model=cause_model,
                metadata=metadata,
            )
            logger.info(
                "  ✓ %s: delay(%d trees) + cause(%d trees, classes=%s)",
                train_number,
                delay_model.tree_count_,
                cause_model.tree_count_,
                list(cause_model.classes_),
            )

        logger.info("Loaded models for %d trains", len(self.models))

    @property
    def is_loaded(self) -> bool:
        return len(self.models) > 0

    # ── Prediction ─────────────────────────────────────────────────────────

    def predict(
        self,
        train_number: str,
        feature_rows: list[list[Any]],
        *,
        explain: bool = False,
    ) -> list[dict[str, Any]]:
        """Run delay + cause prediction for one or more feature rows.

        Parameters
        ----------
        train_number : str
            Identifies which model pair to use.
        feature_rows : list of lists
            Each inner list has 14 elements in FEATURE_NAMES order.
        explain : bool
            If True, include per-feature SHAP contributions.

        Returns
        -------
        list of dicts, one per row.
        """
        tm = self.models.get(train_number)
        if tm is None:
            raise KeyError(f"No model loaded for train {train_number}")

        pool = Pool(data=feature_rows, cat_features=CAT_FEATURE_INDICES)

        # ── Delay (regressor) ──────────────────────────────────────────────
        delay_preds: np.ndarray = tm.delay_model.predict(pool)  # shape (N,)

        # ── Cause (classifier) ─────────────────────────────────────────────
        cause_preds_raw: np.ndarray = tm.cause_model.predict(pool)  # (N,) or (N,1)
        cause_preds = cause_preds_raw.flatten()  # ensure 1D
        cause_proba: np.ndarray = tm.cause_model.predict_proba(pool)  # (N, C)

        # ── SHAP (optional) ────────────────────────────────────────────────
        delay_shap: np.ndarray | None = None
        cause_shap: np.ndarray | None = None
        if explain:
            delay_shap = tm.delay_model.get_feature_importance(
                pool, type="ShapValues",
            )  # (N, F+1)
            cause_shap = tm.cause_model.get_feature_importance(
                pool, type="ShapValues",
            )  # (N, (F+1)*C) or (N, F+1, C)

        # ── Assemble results ───────────────────────────────────────────────
        results: list[dict[str, Any]] = []
        n_features = len(FEATURE_NAMES)

        for i in range(len(feature_rows)):
            delay_min = float(delay_preds[i])
            cause_label = str(cause_preds[i])
            proba_dict = {
                cls: round(float(cause_proba[i, j]), 4)
                for j, cls in enumerate(tm.cause_classes)
            }

            # Delay breakdown from regressor SHAP
            breakdown = DelayBreakdownSchema()
            if delay_shap is not None:
                row_shap = delay_shap[i][:n_features]  # exclude bias
                grouped = group_shap_values(FEATURE_NAMES, row_shap.tolist())
                breakdown = DelayBreakdownSchema(
                    weather=grouped.get("weather", 0),
                    congestion=grouped.get("congestion", 0),
                    other=grouped.get("other", 0),
                )
            else:
                # Quick breakdown from cause probabilities when SHAP is skipped
                abs_delay = max(0, delay_min)
                breakdown = DelayBreakdownSchema(
                    weather=round(abs_delay * proba_dict.get("WEATHER", 0), 1),
                    congestion=round(abs_delay * proba_dict.get("NETWORK_CONGESTION", 0), 1),
                    other=round(abs_delay * proba_dict.get("NO_SIGNIFICANT_DELAY", 0), 1),
                )

            # Per-feature SHAP for explanation
            shap_contribs: list[ShapContribution] | None = None
            if cause_shap is not None:
                # Determine the index of the predicted class
                pred_class_idx = tm.cause_classes.index(cause_label)
                raw = cause_shap[i]  # (n_classes, n_features+1)
                # CatBoost multi-class SHAP: (n_classes, n_features+1)
                if raw.ndim == 2:
                    feat_shap = raw[pred_class_idx, :n_features]
                else:
                    # 1D fallback (binary): just take first n_features
                    feat_shap = raw[:n_features]

                contribs = []
                for fi, fname in enumerate(FEATURE_NAMES):
                    contribs.append(ShapContribution(
                        feature=fname,
                        value=feature_rows[i][fi],
                        contribution=round(float(feat_shap[fi]), 4),
                    ))
                contribs.sort(key=lambda c: abs(c.contribution), reverse=True)
                shap_contribs = contribs

            results.append({
                "predicted_delay_minutes": round(delay_min, 1),
                "delay_cause": cause_label,
                "delay_cause_probabilities": proba_dict,
                "delay_breakdown": breakdown,
                "shap_contributions": shap_contribs,
            })

        return results
