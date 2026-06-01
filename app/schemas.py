"""
Pydantic schemas for the Soil-Properties-Prediction FastAPI service.

Two prediction targets are supported:
  - Cu_kPa   : Undrained shear strength
  - Phi_deg  : Friction angle
"""

from typing import List, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared raw soil-test inputs
# ---------------------------------------------------------------------------

class SoilInputBase(BaseModel):
    """Raw laboratory measurements shared by both prediction endpoints."""

    LL: float = Field(..., description="Liquid Limit (%)")
    PL: float = Field(..., description="Plastic Limit (%)")
    Sat_Unit_Wt_kN_m3: float = Field(
        ..., description="Saturated Unit Weight (kN/m³)"
    )
    Mv_50kPa: float = Field(
        ..., description="Coefficient of volume compressibility at 50 kPa (m²/kN)"
    )
    Cv_50kPa: float = Field(
        ..., description="Coefficient of consolidation at 50 kPa (m²/year)"
    )
    Fines_Content_pct: float = Field(
        ..., description="Fines content – silt + clay fraction (%)"
    )
    Sand_Fraction_pct: float = Field(..., description="Sand fraction (%)")


# ---------------------------------------------------------------------------
# Cu_kPa request  (no extra raw inputs beyond the base)
# ---------------------------------------------------------------------------

class CuPredictionRequest(SoilInputBase):
    """
    Input payload for the Cu_kPa (undrained shear strength) endpoint.

    The seven raw columns supplied here are exactly those present in
    ``geotechnical_cu_training_ready.csv``. The remaining eight features
    are synthesised internally by ``build_cu_features``.
    """


# ---------------------------------------------------------------------------
# Phi_deg request  (needs Gravel_Fraction_pct in addition to the base)
# ---------------------------------------------------------------------------

class PhiPredictionRequest(SoilInputBase):
    """
    Input payload for the Phi_deg (friction angle) endpoint.

    Phi modelling also needs the gravel fraction, which controls the
    ``Gravel_to_Sand_Ratio`` interaction term in ``build_phi_features``.
    """

    Gravel_Fraction_pct: float = Field(..., description="Gravel fraction (%)")


class UnifiedPredictionRequest(PhiPredictionRequest):
    """Input payload for predicting and explaining both supported targets."""


# ---------------------------------------------------------------------------
# Shared prediction response
# ---------------------------------------------------------------------------

class PredictionResponse(BaseModel):
    """Single-value prediction result."""

    prediction: float = Field(..., description="Predicted value")
    target: str = Field(..., description="Name of the predicted target column")
    model: str = Field(..., description="Name of the model used for prediction")


class PredictionValues(BaseModel):
    cu_kpa: float
    phi_deg: float


class ModelNames(BaseModel):
    cu: str
    phi: str


class ShapFeatureContribution(BaseModel):
    feature: str
    value: float
    shap_value: float
    impact: Literal["positive", "negative"]
    rank: int
    abs_shap_value: float
    start: float | None = None
    end: float | None = None


class ShapBarDatum(BaseModel):
    feature: str
    value: float
    shap_value: float


class ShapSummary(BaseModel):
    total_positive: float
    total_negative: float
    net_effect: float
    absolute_sum: float
    prediction_estimate: float


class ShapTargetExplanation(BaseModel):
    base_value: float
    features: List[ShapFeatureContribution]
    positive: List[ShapFeatureContribution]
    negative: List[ShapFeatureContribution]
    bar: List[ShapBarDatum]
    waterfall: List[ShapFeatureContribution]
    summary: ShapSummary


class ShapBundle(BaseModel):
    cu: ShapTargetExplanation
    phi: ShapTargetExplanation


class UnifiedPredictionResponse(BaseModel):
    predictions: PredictionValues
    models: ModelNames
    shap: ShapBundle


class ExplanationResponse(BaseModel):
    models: ModelNames
    shap: ShapBundle


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    cu_model_loaded: bool
    phi_model_loaded: bool
    cu_explainer_loaded: bool = False
    phi_explainer_loaded: bool = False
