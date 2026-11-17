from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Literal

import joblib
import numpy as np
import pandas as pd
import shap

from app.feature_engineering import build_features, raw_input_columns

logger = logging.getLogger(__name__)

TargetKey = Literal["cu", "phi"]

# Rows of training data used as the reference population for model-agnostic SHAP.
_SHAP_BACKGROUND_ROWS = 100


class ModelService:
    def __init__(self, outputs_dir: Path) -> None:
        self.outputs_dir = outputs_dir
        self.model_paths: Dict[TargetKey, Path] = {
            "cu": outputs_dir / "cu_best_model.joblib",
            "phi": outputs_dir / "phi_best_model.joblib",
        }
        self.models: Dict[TargetKey, Any] = {}
        self.model_names: Dict[TargetKey, str] = {}
        self.explainers: Dict[TargetKey, Any] = {}
        # Written next to each model by ``python -m training.train``.
        self.meta: Dict[TargetKey, Dict[str, Any]] = {}

    def load(self) -> None:
        for key, path in self.model_paths.items():
            if not path.exists():
                logger.warning("Model artifact not found: %s", path)
                continue

            try:
                model = joblib.load(path)
                self.meta[key] = self._load_meta(key)
                self.models[key] = model
                self.model_names[key] = self.meta[key].get("model_name", type(model).__name__)
                self.explainers[key] = self._build_explainer(key, model)
                logger.info("Loaded %s model and SHAP explainer from %s", key.upper(), path)
            except Exception as exc:
                logger.error("Failed to load %s model or explainer: %s", key.upper(), exc)

    def is_model_loaded(self, key: TargetKey) -> bool:
        return key in self.models

    def is_explainer_loaded(self, key: TargetKey) -> bool:
        return key in self.explainers

    def model_name(self, key: TargetKey) -> str:
        return self.model_names.get(key, "unknown")

    def predict_single(self, key: TargetKey, payload: Dict[str, float]) -> float:
        model = self.require_model(key)
        features = self.build_features(key, payload)
        return float(model.predict(features)[0])

    def predict_all(self, payload: Dict[str, float]) -> Dict[str, float]:
        cu_features = self.build_features("cu", payload)
        phi_features = self.build_features("phi", payload)
        cu_prediction = float(self.require_model("cu").predict(cu_features)[0])
        phi_prediction = float(self.require_model("phi").predict(phi_features)[0])
        return {
            "cu_kpa": round(cu_prediction, 4),
            "phi_deg": round(phi_prediction, 4),
        }

    def explain_all(self, payload: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
        return {
            "cu": self.explain("cu", payload),
            "phi": self.explain("phi", payload),
        }

    def explain(self, key: TargetKey, payload: Dict[str, float]) -> Dict[str, Any]:
        self.require_model(key)
        explainer = self.require_explainer(key)
        features = self.build_features(key, payload)

        if isinstance(explainer, shap.TreeExplainer):
            values = self._normalize_shap_values(explainer.shap_values(features))
            base_value = self._normalize_base_value(explainer.expected_value)
        else:
            explanation = explainer(features)
            values = self._normalize_shap_values(explanation.values)
            base_value = self._normalize_base_value(explanation.base_values)

        rows = []
        running_value = base_value
        for index, (feature, feature_value, shap_value) in enumerate(
            zip(features.columns, features.iloc[0].to_numpy(), values),
            start=1,
        ):
            start = running_value
            end = running_value + float(shap_value)
            running_value = end
            impact = "positive" if shap_value >= 0 else "negative"
            rows.append(
                {
                    "feature": str(feature),
                    "value": round(float(feature_value), 6),
                    "shap_value": round(float(shap_value), 6),
                    "impact": impact,
                    "rank": index,
                    "abs_shap_value": round(abs(float(shap_value)), 6),
                    "start": round(float(start), 6),
                    "end": round(float(end), 6),
                }
            )

        ranked = sorted(rows, key=lambda row: row["abs_shap_value"], reverse=True)
        for rank, row in enumerate(ranked, start=1):
            row["rank"] = rank

        positive = [row for row in ranked if row["shap_value"] >= 0]
        negative = [row for row in ranked if row["shap_value"] < 0]
        total_positive = float(sum(row["shap_value"] for row in positive))
        total_negative = float(sum(row["shap_value"] for row in negative))

        return {
            "base_value": round(base_value, 6),
            "features": ranked,
            "positive": positive,
            "negative": negative,
            "bar": [
                {
                    "feature": row["feature"],
                    "value": row["abs_shap_value"],
                    "shap_value": row["shap_value"],
                }
                for row in ranked
            ],
            "waterfall": rows,
            "summary": {
                "total_positive": round(total_positive, 6),
                "total_negative": round(total_negative, 6),
                "net_effect": round(total_positive + total_negative, 6),
                "absolute_sum": round(float(sum(row["abs_shap_value"] for row in ranked)), 6),
                "prediction_estimate": round(base_value + total_positive + total_negative, 6),
            },
        }

    def build_features(self, key: TargetKey, payload: Dict[str, float]) -> pd.DataFrame:
        feature_set = self.feature_set(key)
        needed = raw_input_columns(key, feature_set)
        missing = [name for name in needed if payload.get(name) is None]
        if missing:
            raise ValueError(
                f"{', '.join(missing)} required by the deployed {key.upper()} model"
            )
        raw = pd.DataFrame([{name: payload[name] for name in needed}])
        features = build_features(key, raw, feature_set)
        self._validate_feature_order(key, features)
        return features

    def feature_set(self, key: TargetKey) -> str:
        return self.meta.get(key, {}).get("feature_set", "full")

    def range_warnings(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Inputs outside the range the deployed models were trained on.

        A prediction is still returned for these, but the model is extrapolating.
        """
        found: Dict[str, Dict[str, Any]] = {}
        for key in ("cu", "phi"):
            for field, (low, high) in self.meta.get(key, {}).get("training_ranges", {}).items():
                value = payload.get(field)
                if value is None or low <= value <= high:
                    continue
                entry = found.setdefault(
                    field,
                    {"field": field, "value": value, "min": low, "max": high, "targets": []},
                )
                entry["targets"].append(key)
        return list(found.values())

    def require_model(self, key: TargetKey) -> Any:
        model = self.models.get(key)
        if model is None:
            raise RuntimeError(f"{key.upper()} model is not available")
        return model

    def require_explainer(self, key: TargetKey) -> Any:
        explainer = self.explainers.get(key)
        if explainer is None:
            raise RuntimeError(f"{key.upper()} SHAP explainer is not available")
        return explainer

    def _load_meta(self, key: TargetKey) -> Dict[str, Any]:
        path = self.outputs_dir / f"{key}_model_meta.json"
        if not path.exists():
            return {}
        return json.loads(path.read_text(encoding="utf-8"))

    def _build_explainer(self, key: TargetKey, model: Any) -> Any:
        model_name = type(model).__name__.lower()
        if any(name in model_name for name in ("forest", "tree", "xgb", "gradientboosting")):
            return shap.TreeExplainer(model)

        # SVR, the ANN and the linear pipelines have no tree structure to exploit, so
        # they are explained against a sample of the training feature matrix.
        background = pd.read_csv(self.outputs_dir / f"{key}_shap_background.csv")
        if len(background) > _SHAP_BACKGROUND_ROWS:
            background = background.sample(_SHAP_BACKGROUND_ROWS, random_state=0)
        columns = list(background.columns)

        def predict(values: np.ndarray) -> np.ndarray:
            return model.predict(pd.DataFrame(values, columns=columns))

        return shap.Explainer(predict, background)

    def _validate_feature_order(self, key: TargetKey, features: pd.DataFrame) -> None:
        expected = list(getattr(self.require_model(key), "feature_names_in_", []))
        if expected and list(features.columns) != expected:
            raise ValueError(
                f"{key.upper()} feature order mismatch. "
                f"Expected {expected}, received {list(features.columns)}"
            )

    @staticmethod
    def _normalize_shap_values(raw_values: Any) -> np.ndarray:
        if isinstance(raw_values, list):
            raw_values = raw_values[0]
        values = np.asarray(raw_values, dtype=float)
        if values.ndim == 3:
            values = values[:, :, 0]
        if values.ndim == 2:
            values = values[0]
        return values.reshape(-1)

    @staticmethod
    def _normalize_base_value(expected_value: Any) -> float:
        values = np.asarray(expected_value, dtype=float).reshape(-1)
        return float(values[0])
