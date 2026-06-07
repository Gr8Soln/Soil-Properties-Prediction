from __future__ import annotations

import csv
import logging
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.model_service import ModelService
from app.schemas import (
    CuPredictionRequest,
    ExplanationResponse,
    HealthResponse,
    PhiPredictionRequest,
    PredictionResponse,
    UnifiedPredictionRequest,
    UnifiedPredictionResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_HERE = Path(__file__).resolve().parent
_PROJECT_ROOT = _HERE.parent
_OUTPUTS = _PROJECT_ROOT / "outputs"

_CU_IMPORTANCE_PATH = _OUTPUTS / "cu_feature_importance.csv"
_PHI_IMPORTANCE_PATH = _OUTPUTS / "phi_feature_importance.csv"
_CU_COMPARISON_PATH = _OUTPUTS / "cu_model_comparison.csv"
_PHI_COMPARISON_PATH = _OUTPUTS / "phi_model_comparison.csv"

app = FastAPI(
    title="Soil-Properties-Prediction API",
    description=(
        "Geotechnical ML inference service. Predicts undrained shear strength "
        "(Cu_kPa) and friction angle (Phi_deg) from laboratory soil measurements "
        "using trained Extra Trees Regressor models with SHAP explanations."
    ),
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_service = ModelService(_OUTPUTS)


@app.on_event("startup")
async def startup_event() -> None:
    model_service.load()


def _read_csv_as_records(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return [{key: _coerce(value) for key, value in row.items()} for row in reader]


def _coerce(value: str) -> Any:
    for cast in (int, float):
        try:
            return cast(value)
        except (ValueError, TypeError):
            pass
    return value


def _service_unavailable(exc: RuntimeError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=str(exc),
    )


def _feature_error(exc: Exception) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"Feature engineering failed: {exc}",
    )


def _models_payload() -> Dict[str, str]:
    return {
        "cu": model_service.model_name("cu"),
        "phi": model_service.model_name("phi"),
    }


def _predict_target(key: str, payload: Dict[str, float]) -> PredictionResponse:
    try:
        prediction = model_service.predict_single(key, payload)  # type: ignore[arg-type]
    except RuntimeError as exc:
        raise _service_unavailable(exc) from exc
    except (AssertionError, KeyError, ValueError) as exc:
        raise _feature_error(exc) from exc

    return PredictionResponse(
        prediction=round(prediction, 4),
        target="Cu_kPa" if key == "cu" else "Phi_deg",
        model=model_service.model_name(key),  # type: ignore[arg-type]
    )


def _predict_and_explain(payload: UnifiedPredictionRequest) -> UnifiedPredictionResponse:
    raw = payload.model_dump()
    try:
        predictions = model_service.predict_all(raw)
        shap_payload = model_service.explain_all(raw)
    except RuntimeError as exc:
        raise _service_unavailable(exc) from exc
    except (AssertionError, KeyError, ValueError) as exc:
        raise _feature_error(exc) from exc

    return UnifiedPredictionResponse(
        predictions=predictions,
        models=_models_payload(),
        shap=shap_payload,
    )


def _explain(payload: UnifiedPredictionRequest) -> ExplanationResponse:
    raw = payload.model_dump()
    try:
        shap_payload = model_service.explain_all(raw)
    except RuntimeError as exc:
        raise _service_unavailable(exc) from exc
    except (AssertionError, KeyError, ValueError) as exc:
        raise _feature_error(exc) from exc

    return ExplanationResponse(
        models=_models_payload(),
        shap=shap_payload,
    )


def _model_info(key: str, comparison_path: Path, importance_path: Path) -> Dict[str, Any]:
    return {
        "target": "Cu_kPa" if key == "cu" else "Phi_deg",
        "best_model": model_service.model_name(key),  # type: ignore[arg-type]
        "model_loaded": model_service.is_model_loaded(key),  # type: ignore[arg-type]
        "explainer_loaded": model_service.is_explainer_loaded(key),  # type: ignore[arg-type]
        "cv_comparison": _read_csv_as_records(comparison_path),
        "feature_importances": _read_csv_as_records(importance_path),
    }


@app.get("/", include_in_schema=False)
async def root() -> Dict[str, str]:
    return {
        "service": "Soil-Properties-Prediction API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse, tags=["Monitoring"])
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        cu_model_loaded=model_service.is_model_loaded("cu"),
        phi_model_loaded=model_service.is_model_loaded("phi"),
        cu_explainer_loaded=model_service.is_explainer_loaded("cu"),
        phi_explainer_loaded=model_service.is_explainer_loaded("phi"),
    )


@app.post(
    "/predict/cu",
    response_model=PredictionResponse,
    tags=["Prediction"],
    summary="Predict undrained shear strength (Cu_kPa)",
)
async def predict_cu(payload: CuPredictionRequest) -> PredictionResponse:
    return _predict_target("cu", payload.model_dump())


@app.post(
    "/predict/phi",
    response_model=PredictionResponse,
    tags=["Prediction"],
    summary="Predict friction angle (Phi_deg)",
)
async def predict_phi(payload: PhiPredictionRequest) -> PredictionResponse:
    return _predict_target("phi", payload.model_dump())


@app.post(
    "/predict",
    response_model=UnifiedPredictionResponse,
    tags=["Prediction"],
    summary="Predict Cu_kPa and Phi_deg with SHAP explanations",
)
async def predict(payload: UnifiedPredictionRequest) -> UnifiedPredictionResponse:
    return _predict_and_explain(payload)


@app.post(
    "/explain",
    response_model=ExplanationResponse,
    tags=["Explanation"],
    summary="Explain both model predictions without returning prediction values",
)
async def explain(payload: UnifiedPredictionRequest) -> ExplanationResponse:
    return _explain(payload)


@app.get(
    "/model-info/cu",
    tags=["Model Info"],
    summary="Cu_kPa model metadata and feature importances",
)
async def model_info_cu() -> Dict[str, Any]:
    return _model_info("cu", _CU_COMPARISON_PATH, _CU_IMPORTANCE_PATH)


@app.get(
    "/model-info/phi",
    tags=["Model Info"],
    summary="Phi_deg model metadata and feature importances",
)
async def model_info_phi() -> Dict[str, Any]:
    return _model_info("phi", _PHI_COMPARISON_PATH, _PHI_IMPORTANCE_PATH)
