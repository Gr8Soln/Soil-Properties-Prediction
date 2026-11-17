"""Model zoo: the six original regressors plus SVR and an ANN (MLP).

Only scikit-learn / xgboost classes are used, so a saved model unpickles in the API
without importing anything from this package.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from sklearn.compose import TransformedTargetRegressor
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import (
    BaggingRegressor,
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.neural_network import MLPRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from xgboost import XGBRegressor

RANDOM_STATE = 42
BASELINE_NAME = "Mean Baseline"


@dataclass
class ModelSpec:
    name: str
    estimator: Any
    # Non-empty grid => hyperparameters are tuned inside every training fold.
    param_grid: dict[str, list[Any]] = field(default_factory=dict)


def _scaled(model: Any) -> TransformedTargetRegressor:
    """Standardise inputs and target; both SVR and MLP are scale-sensitive."""
    return TransformedTargetRegressor(
        regressor=Pipeline([("scale", StandardScaler()), ("model", model)]),
        transformer=StandardScaler(),
    )


def build_model_specs() -> list[ModelSpec]:
    return [
        ModelSpec(BASELINE_NAME, DummyRegressor(strategy="mean")),
        # --- original six, settings unchanged from the Cu/Phi notebooks ---------
        ModelSpec(
            "Linear Regression",
            Pipeline([("scale", StandardScaler()), ("model", LinearRegression())]),
        ),
        ModelSpec(
            "Ridge Regression",
            Pipeline([("scale", StandardScaler()), ("model", Ridge(alpha=1.0))]),
        ),
        ModelSpec(
            "Random Forest",
            RandomForestRegressor(
                n_estimators=400, min_samples_leaf=2, random_state=RANDOM_STATE, n_jobs=1
            ),
        ),
        ModelSpec(
            "Extra Trees",
            ExtraTreesRegressor(
                n_estimators=500, min_samples_leaf=2, random_state=RANDOM_STATE, n_jobs=1
            ),
        ),
        ModelSpec(
            "Gradient Boosting",
            GradientBoostingRegressor(
                learning_rate=0.05, n_estimators=300, max_depth=3, random_state=RANDOM_STATE
            ),
        ),
        ModelSpec(
            "XGBoost",
            XGBRegressor(
                n_estimators=300,
                learning_rate=0.05,
                max_depth=4,
                subsample=0.9,
                colsample_bytree=0.9,
                objective="reg:squarederror",
                random_state=RANDOM_STATE,
                n_jobs=1,
            ),
        ),
        # --- new ---------------------------------------------------------------
        ModelSpec(
            "SVR",
            _scaled(SVR(kernel="rbf")),
            {
                "regressor__model__C": [0.3, 1.0, 3.0, 10.0, 30.0, 100.0],
                "regressor__model__epsilon": [0.05, 0.1, 0.2],
                "regressor__model__gamma": ["scale", 0.01, 0.03, 0.1],
            },
        ),
        ModelSpec(
            "ANN (MLP)",
            # Five networks that differ only in their random initialisation, averaged:
            # a single small MLP on ~230 rows swings noticeably from seed to seed.
            _scaled(
                BaggingRegressor(
                    MLPRegressor(solver="lbfgs", activation="relu", max_iter=1000),
                    n_estimators=5,
                    bootstrap=False,
                    random_state=RANDOM_STATE,
                    n_jobs=1,
                )
            ),
            {
                "regressor__model__estimator__hidden_layer_sizes": [
                    (8,),
                    (16,),
                    (16, 8),
                    (32, 16),
                ],
                "regressor__model__estimator__alpha": [0.01, 0.1, 1.0, 10.0],
            },
        ),
    ]
