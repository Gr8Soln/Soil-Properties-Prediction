"""
FastAPI application for Soil-Properties-Prediction inference.

Endpoints
---------
GET  /                   → simple landing message
GET  /health             → model load status
POST /predict/cu         → predict Cu_kPa (undrained shear strength)
POST /predict/phi        → predict Phi_deg (friction angle)
GET  /model-info/cu      → Cu_kPa model metadata & feature importances
GET  /model-info/phi     → Phi_deg model metadata & feature importances

Usage
-----
Run from the project root:

    uvicorn app.main:app --reload

Or with Python:

    python -m uvicorn app.main:app --reload
"""

from __future__ import annotations

import csv
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse

from app.feature_engineering import build_cu_features, build_phi_features
from app.schemas import (
    CuPredictionRequest,
    HealthResponse,
    PhiPredictionRequest,
    PredictionResponse,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_HERE = Path(__file__).resolve().parent          # …/app/
_PROJECT_ROOT = _HERE.parent                     # …/Soil-Properties-Prediction/
_OUTPUTS = _PROJECT_ROOT / "outputs"

_CU_MODEL_PATH = _OUTPUTS / "cu_best_model.joblib"
_PHI_MODEL_PATH = _OUTPUTS / "phi_best_model.joblib"
_CU_IMPORTANCE_PATH = _OUTPUTS / "cu_feature_importance.csv"
_PHI_IMPORTANCE_PATH = _OUTPUTS / "phi_feature_importance.csv"
_CU_COMPARISON_PATH = _OUTPUTS / "cu_model_comparison.csv"
_PHI_COMPARISON_PATH = _OUTPUTS / "phi_model_comparison.csv"

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Soil-Properties-Prediction API",
    description=(
        "Geotechnical ML inference service.\n\n"
        "Predicts undrained shear strength (**Cu_kPa**) and friction angle "
        "(**Phi_deg**) from laboratory soil measurements using trained "
        "Extra Trees Regressor models."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Model registry – loaded once at startup
# ---------------------------------------------------------------------------

_MODELS: Dict[str, Any] = {}
_MODEL_NAMES: Dict[str, str] = {}


def _load_models() -> None:
    """Load both saved models into the in-process registry."""
    for key, path in (("cu", _CU_MODEL_PATH), ("phi", _PHI_MODEL_PATH)):
        if path.exists():
            try:
                _MODELS[key] = joblib.load(path)
                _MODEL_NAMES[key] = type(_MODELS[key]).__name__
                logger.info("Loaded %s model from %s", key.upper(), path)
            except Exception as exc:                                   # noqa: BLE001
                logger.error("Failed to load %s model: %s", key.upper(), exc)
        else:
            logger.warning("Model artifact not found: %s", path)


@app.on_event("startup")
async def startup_event() -> None:
    _load_models()


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _read_csv_as_records(path: Path) -> List[Dict[str, Any]]:
    """Return a CSV as a list of row-dicts; empty list if file missing."""
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return [
            {k: _coerce(v) for k, v in row.items()}
            for row in reader
        ]


def _coerce(value: str) -> Any:
    """Try to coerce a CSV string to int → float → str."""
    for cast in (int, float):
        try:
            return cast(value)
        except (ValueError, TypeError):
            pass
    return value


def _get_model(key: str):
    """Return a loaded model or raise 503 if unavailable."""
    model = _MODELS.get(key)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"The {key.upper()} model is not available. "
                "Check the server logs for details."
            ),
        )
    return model


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "Soil-Properties-Prediction API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse, tags=["Monitoring"])
async def health():
    """Return the load status of both models."""
    return HealthResponse(
        status="ok",
        cu_model_loaded="cu" in _MODELS,
        phi_model_loaded="phi" in _MODELS,
    )


@app.post(
    "/predict/cu",
    response_model=PredictionResponse,
    tags=["Prediction"],
    summary="Predict undrained shear strength (Cu_kPa)",
)
async def predict_cu(payload: CuPredictionRequest):
    """
    Predict **undrained shear strength** (Cu_kPa) from raw soil measurements.

    The request body mirrors the columns present in
    `geotechnical_cu_training_ready.csv`.  Eight additional interaction
    features are derived internally before calling the model.
    """
    model = _get_model("cu")

    # Build feature row as a single-row DataFrame
    raw = pd.DataFrame([payload.model_dump()])
    try:
        X = build_cu_features(raw)
    except (AssertionError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Feature engineering failed: {exc}",
        ) from exc

    prediction: float = float(model.predict(X)[0])

    return PredictionResponse(
        prediction=round(prediction, 4),
        target="Cu_kPa",
        model=_MODEL_NAMES.get("cu", "unknown"),
    )


@app.post(
    "/predict/phi",
    response_model=PredictionResponse,
    tags=["Prediction"],
    summary="Predict friction angle (Phi_deg)",
)
async def predict_phi(payload: PhiPredictionRequest):
    """
    Predict **friction angle** (Phi_deg) from raw soil measurements.

    The request body extends the Cu payload with `Gravel_Fraction_pct`,
    which is required for the `Gravel_to_Sand_Ratio` interaction term.
    Seven additional features are derived internally before calling the model.
    """
    model = _get_model("phi")

    raw = pd.DataFrame([payload.model_dump()])
    try:
        X = build_phi_features(raw)
    except (AssertionError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Feature engineering failed: {exc}",
        ) from exc

    prediction: float = float(model.predict(X)[0])

    return PredictionResponse(
        prediction=round(prediction, 4),
        target="Phi_deg",
        model=_MODEL_NAMES.get("phi", "unknown"),
    )


@app.get(
    "/model-info/cu",
    tags=["Model Info"],
    summary="Cu_kPa model metadata and feature importances",
)
async def model_info_cu():
    """
    Return metadata about the Cu_kPa model including:
    - Model class name
    - Cross-validation results for all compared models
    - Permutation feature importances from the winning model
    """
    return {
        "target": "Cu_kPa",
        "best_model": _MODEL_NAMES.get("cu", "not loaded"),
        "model_loaded": "cu" in _MODELS,
        "cv_comparison": _read_csv_as_records(_CU_COMPARISON_PATH),
        "feature_importances": _read_csv_as_records(_CU_IMPORTANCE_PATH),
    }


@app.get(
    "/model-info/phi",
    tags=["Model Info"],
    summary="Phi_deg model metadata and feature importances",
)
async def model_info_phi():
    """
    Return metadata about the Phi_deg model including:
    - Model class name
    - Cross-validation results for all compared models
    - Permutation feature importances from the winning model
    """
    return {
        "target": "Phi_deg",
        "best_model": _MODEL_NAMES.get("phi", "not loaded"),
        "model_loaded": "phi" in _MODELS,
        "cv_comparison": _read_csv_as_records(_PHI_COMPARISON_PATH),
        "feature_importances": _read_csv_as_records(_PHI_IMPORTANCE_PATH),
    }
