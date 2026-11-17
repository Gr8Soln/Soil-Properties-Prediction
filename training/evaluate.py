"""Cross-validation under two protocols.

``shuffled_5fold``  rows are shuffled into 5 folds, so a test row usually has
                    neighbours from the same site in the training folds. This is the
                    protocol of the original notebooks and it flatters every model.
``site_holdout``    leave-one-site-out: every site is predicted by a model that never
                    saw it. This is the score that answers "how will it do on a new
                    site" and is the one used to choose the deployed model.

Models with a hyperparameter grid are tuned inside each training fold (nested CV), with
an inner split of the same kind as the outer one, so no test row influences its own
model's settings.
"""

from __future__ import annotations

from typing import Any, Iterator

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, GroupKFold, KFold, LeaveOneGroupOut

from training.models import RANDOM_STATE, ModelSpec

SCHEMES = ("site_holdout", "shuffled_5fold")
Split = tuple[np.ndarray, np.ndarray]


def rmse(y_true: Any, y_pred: Any) -> float:
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))


def _r2_or_nan(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    # R² is undefined when the held-out targets are all equal (e.g. a two-row site).
    if len(y_true) < 2 or np.ptp(y_true) == 0:
        return float("nan")
    return float(r2_score(y_true, y_pred))


def outer_splits(scheme: str, X: pd.DataFrame, groups: pd.Series) -> Iterator[Split]:
    if scheme == "shuffled_5fold":
        return KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE).split(X)
    if scheme == "site_holdout":
        return LeaveOneGroupOut().split(X, groups=groups)
    raise ValueError(f"Unknown validation scheme: {scheme!r}")


def inner_splits(scheme: str, X: pd.DataFrame, groups: pd.Series) -> list[Split]:
    if scheme == "shuffled_5fold":
        return list(KFold(n_splits=4, shuffle=True, random_state=RANDOM_STATE).split(X))
    n_splits = min(4, groups.nunique())
    return list(GroupKFold(n_splits=n_splits).split(X, groups=groups))


def fit_spec(
    spec: ModelSpec, X: pd.DataFrame, y: pd.Series, groups: pd.Series, scheme: str
) -> tuple[Any, dict[str, Any]]:
    """Fit one model on (X, y); tune first if the spec carries a grid."""
    if not spec.param_grid:
        return clone(spec.estimator).fit(X, y), {}
    search = GridSearchCV(
        clone(spec.estimator),
        spec.param_grid,
        cv=inner_splits(scheme, X, groups),
        scoring="neg_root_mean_squared_error",
        n_jobs=-1,
        refit=True,
    )
    search.fit(X, y)
    return search.best_estimator_, dict(search.best_params_)


def evaluate(
    spec: ModelSpec, X: pd.DataFrame, y: pd.Series, groups: pd.Series, scheme: str
) -> tuple[dict[str, float], np.ndarray, list[dict[str, Any]]]:
    """Out-of-fold predictions and metrics for one model under one protocol."""
    oof = np.full(len(y), np.nan)
    fold_rmse, fold_mae, fold_r2, tuning = [], [], [], []

    for fold, (train, test) in enumerate(outer_splits(scheme, X, groups)):
        model, params = fit_spec(
            spec, X.iloc[train], y.iloc[train], groups.iloc[train], scheme
        )
        oof[test] = model.predict(X.iloc[test])
        truth = y.iloc[test].to_numpy()
        fold_rmse.append(rmse(truth, oof[test]))
        fold_mae.append(float(mean_absolute_error(truth, oof[test])))
        fold_r2.append(_r2_or_nan(truth, oof[test]))
        if params:
            held_out = groups.iloc[test].unique()
            tuning.append(
                {
                    "Fold": fold,
                    "Held_Out": held_out[0] if len(held_out) == 1 else "mixed",
                    **{key.split("__")[-1]: str(value) for key, value in params.items()},
                }
            )

    metrics = {
        "CV_RMSE_Mean": float(np.mean(fold_rmse)),
        "CV_RMSE_STD": float(np.std(fold_rmse)),
        "CV_MAE_Mean": float(np.mean(fold_mae)),
        "CV_R2_Mean": float(np.nanmean(fold_r2)),
        "OOF_RMSE": rmse(y, oof),
        "OOF_MAE": float(mean_absolute_error(y, oof)),
        "OOF_R2": float(r2_score(y, oof)),
    }
    return metrics, oof, tuning


def site_error_table(y: pd.Series, oof: np.ndarray, groups: pd.Series) -> pd.DataFrame:
    """Per-site error of out-of-fold predictions."""
    frame = pd.DataFrame({"Site": groups, "y": y, "pred": oof})
    rows = []
    for site, part in frame.groupby("Site"):
        rows.append(
            {
                "Site": site,
                "Rows": len(part),
                "Actual_Mean": part["y"].mean(),
                "Predicted_Mean": part["pred"].mean(),
                "Bias": (part["pred"] - part["y"]).mean(),
                "RMSE": rmse(part["y"], part["pred"]),
                "MAE": float(mean_absolute_error(part["y"], part["pred"])),
            }
        )
    return pd.DataFrame(rows)


def held_out_importance(
    estimator: Any, X: pd.DataFrame, y: pd.Series, groups: pd.Series, min_rows: int = 5
) -> pd.DataFrame:
    """Permutation importance measured on held-out sites.

    For each site (with at least ``min_rows`` rows) the model is fitted on the other
    sites and each feature is shuffled in the held-out site. Importance is the rise in
    RMSE, in target units, averaged over sites weighted by their row count. Measuring
    on unseen sites avoids crediting features the model merely memorised.
    """
    means, weights = [], []
    for train, test in LeaveOneGroupOut().split(X, groups=groups):
        if len(test) < min_rows:
            continue
        model = clone(estimator).fit(X.iloc[train], y.iloc[train])
        result = permutation_importance(
            model,
            X.iloc[test],
            y.iloc[test],
            scoring="neg_root_mean_squared_error",
            n_repeats=20,
            random_state=RANDOM_STATE,
        )
        means.append(result.importances_mean)
        weights.append(len(test))

    stacked = np.vstack(means)
    w = np.asarray(weights, dtype=float)
    average = np.average(stacked, axis=0, weights=w)
    spread = np.sqrt(np.average((stacked - average) ** 2, axis=0, weights=w))
    return (
        pd.DataFrame({"Feature": X.columns, "Importance": average, "Importance_STD": spread})
        .sort_values("Importance", ascending=False)
        .reset_index(drop=True)
    )
