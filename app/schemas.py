"""
Pydantic schemas for the Soil-Properties-Prediction FastAPI service.

Two prediction targets are supported:
  - Cu_kPa   : Undrained shear strength
  - Phi_deg  : Friction angle
"""

from typing import List, Literal

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Shared raw soil-test inputs
# ---------------------------------------------------------------------------

class SoilInputBase(BaseModel):
    """Raw laboratory measurements shared by both prediction endpoints."""

    LL: float = Field(..., ge=0, le=200, description="Liquid Limit (%)")
    PL: float = Field(..., ge=0, le=200, description="Plastic Limit (%)")
    Sat_Unit_Wt_kN_m3: float = Field(
        ..., gt=0, le=30, description="Saturated Unit Weight (kN/m³)"
    )
    # Optional in the schema: whether they are needed depends on the feature set of
    # the deployed model (see ``raw_inputs`` in outputs/*_model_meta.json). A request
    # that omits one the model needs is rejected with a 422.
    Mv_50kPa: float | None = Field(
        None, ge=0, description="Coefficient of volume compressibility at 50 kPa (m²/kN)"
    )
    Cv_50kPa: float | None = Field(
        None, ge=0, description="Coefficient of consolidation at 50 kPa (m²/year)"
    )
    Fines_Content_pct: float = Field(
        ..., ge=0, le=100, description="Fines content – silt + clay fraction (%)"
    )
    Sand_Fraction_pct: float = Field(..., ge=0, le=100, description="Sand fraction (%)")

    @model_validator(mode="after")
    def _check_consistency(self) -> "SoilInputBase":
        if self.PL > self.LL:
            raise ValueError("PL must not exceed LL (plasticity index would be negative)")
        gravel = getattr(self, "Gravel_Fraction_pct", None) or 0.0
        total = self.Fines_Content_pct + self.Sand_Fraction_pct + gravel
        if total > 100.5:
            raise ValueError(
                f"Fines + Sand + Gravel must not exceed 100% (received {total:.1f}%)"
            )
        return self


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

    # Optional: the deployed models derive gradation from fines and sand alone (gravel is
    # the remainder). Still validated when supplied.
    Gravel_Fraction_pct: float | None = Field(
        None, ge=0, le=100, description="Gravel fraction (%)"
    )


class UnifiedPredictionRequest(PhiPredictionRequest):
    """Input payload for predicting and explaining both supported targets."""


# ---------------------------------------------------------------------------
# Shared prediction response
# ---------------------------------------------------------------------------

class RangeWarning(BaseModel):
    """An input outside the range covered by the training data (extrapolation)."""

    field: str
    value: float
    min: float
    max: float
    targets: List[Literal["cu", "phi"]]


class PredictionResponse(BaseModel):
    """Single-value prediction result."""

    prediction: float = Field(..., description="Predicted value")
    target: str = Field(..., description="Name of the predicted target column")
    model: str = Field(..., description="Name of the model used for prediction")
    out_of_range: List[RangeWarning] = []


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
    out_of_range: List[RangeWarning] = []


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
