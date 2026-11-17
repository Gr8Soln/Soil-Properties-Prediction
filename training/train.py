"""Train and compare every model, then export the deployed one per target.

    python -m training.train            # both targets
    python -m training.train --target cu

For each target the script evaluates every model on both feature sets ("full",
"no_mvcv") under both validation protocols, writes the comparison tables, and saves
the model with the lowest site-holdout RMSE (refit on all rows) for the API.
"""

from __future__ import annotations

import argparse
import json
import time
from typing import Any

import joblib
import numpy as np
import pandas as pd
import sklearn
import xgboost

from app.feature_engineering import FEATURE_SETS, raw_input_columns
from training.data import (
    OUTPUT_DIR,
    TARGET_COLUMNS,
    build_xy,
    load_harmonized,
    load_target_frame,
    FINAL_EXPORT_COLUMNS,
)
from training.evaluate import SCHEMES, evaluate, fit_spec, held_out_importance, site_error_table
from training.models import BASELINE_NAME, build_model_specs

SELECTION_SCHEME = "site_holdout"


def _jsonable(value: Any) -> Any:
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, tuple):
        return list(value)
    return value


def export_training_tables() -> None:
    """Dense per-target CSVs (as before) with the ``Site`` column added."""
    audit = load_harmonized()
    views = {
        "geotechnical_training_ready.csv": ["Phi_deg", "Cu_kPa"],
        "geotechnical_phi_training_ready.csv": ["Phi_deg"],
        "geotechnical_cu_training_ready.csv": ["Cu_kPa"],
    }
    for name, targets in views.items():
        table = audit[FINAL_EXPORT_COLUMNS + targets + ["Site"]].dropna()
        table.to_csv(OUTPUT_DIR / name, index=False)


def run_target(target: str) -> dict[str, Any]:
    column = TARGET_COLUMNS[target]
    frame = load_target_frame(target)
    specs = build_model_specs()
    print(f"\n=== {column}: {len(frame)} rows, {frame['Site'].nunique()} sites ===")

    rows, tuning_rows = [], []
    oof: dict[tuple[str, str, str], np.ndarray] = {}
    matrices = {fs: build_xy(frame, target, fs) for fs in FEATURE_SETS}

    for feature_set, (X, y, groups) in matrices.items():
        for scheme in SCHEMES:
            for spec in specs:
                started = time.time()
                metrics, predictions, tuning = evaluate(spec, X, y, groups, scheme)
                oof[(feature_set, scheme, spec.name)] = predictions
                rows.append(
                    {"Model": spec.name, **metrics, "Feature_Set": feature_set, "Validation": scheme}
                )
                for entry in tuning:
                    tuning_rows.append(
                        {"Model": spec.name, "Feature_Set": feature_set, "Validation": scheme, **entry}
                    )
                print(
                    f"  {feature_set:8s} {scheme:15s} {spec.name:18s} "
                    f"R2={metrics['OOF_R2']:+.3f} RMSE={metrics['OOF_RMSE']:.3f} "
                    f"({time.time() - started:.0f}s)"
                )

    results = pd.DataFrame(rows)
    results["_scheme_order"] = results["Validation"].map({s: i for i, s in enumerate(SCHEMES)})
    results = (
        results.sort_values(["_scheme_order", "Feature_Set", "OOF_RMSE"])
        .drop(columns="_scheme_order")
        .reset_index(drop=True)
    )

    # ---- choose the deployed model: lowest RMSE on unseen sites -----------------
    candidates = results[
        (results["Validation"] == SELECTION_SCHEME) & (results["Model"] != BASELINE_NAME)
    ]
    winner = candidates.sort_values("OOF_RMSE").iloc[0]
    best_name, best_set = winner["Model"], winner["Feature_Set"]
    spec = next(item for item in specs if item.name == best_name)
    X, y, groups = matrices[best_set]
    final_model, best_params = fit_spec(spec, X, y, groups, SELECTION_SCHEME)
    print(f"  -> deploying {best_name} [{best_set}] for {column}")

    site_oof = oof[(best_set, "site_holdout", best_name)]
    shuffled_oof = oof[(best_set, "shuffled_5fold", best_name)]

    # ---- artifacts ----------------------------------------------------------------
    results.to_csv(OUTPUT_DIR / f"{target}_model_comparison.csv", index=False)
    pd.DataFrame(tuning_rows).to_csv(OUTPUT_DIR / f"{target}_tuning_log.csv", index=False)
    pd.DataFrame(
        {
            "Site": groups,
            "Actual": y,
            "OOF_Prediction": site_oof,
            "Residual": y - site_oof,
            "OOF_Prediction_Shuffled": shuffled_oof,
        }
    ).to_csv(OUTPUT_DIR / f"{target}_oof_predictions.csv", index=False)
    site_error_table(y, site_oof, groups).to_csv(
        OUTPUT_DIR / f"{target}_site_errors.csv", index=False
    )
    held_out_importance(final_model, X, y, groups).to_csv(
        OUTPUT_DIR / f"{target}_feature_importance.csv", index=False
    )
    X.to_csv(OUTPUT_DIR / f"{target}_shap_background.csv", index=False)
    joblib.dump(final_model, OUTPUT_DIR / f"{target}_best_model.joblib")

    def metrics_for(scheme: str) -> dict[str, float]:
        row = results[
            (results["Model"] == best_name)
            & (results["Feature_Set"] == best_set)
            & (results["Validation"] == scheme)
        ].iloc[0]
        return {key.lower(): round(float(row[f"OOF_{key}"]), 4) for key in ("RMSE", "MAE", "R2")}

    raw_inputs = raw_input_columns(target, best_set)
    meta = {
        "target": target,
        "target_column": column,
        "model_name": best_name,
        "model_class": type(final_model).__name__,
        "feature_set": best_set,
        "features": list(X.columns),
        "raw_inputs": raw_inputs,
        "training_ranges": {
            name: [float(frame[name].min()), float(frame[name].max())] for name in raw_inputs
        },
        "target_range": [float(y.min()), float(y.max())],
        "rows": int(len(frame)),
        "sites": int(groups.nunique()),
        "selected_by": f"lowest OOF RMSE under {SELECTION_SCHEME}",
        "metrics": {scheme: metrics_for(scheme) for scheme in SCHEMES},
        "best_params": {key: _jsonable(value) for key, value in best_params.items()},
        "versions": {"scikit-learn": sklearn.__version__, "xgboost": xgboost.__version__},
    }
    (OUTPUT_DIR / f"{target}_model_meta.json").write_text(json.dumps(meta, indent=2) + "\n")
    return meta


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--target", choices=sorted(TARGET_COLUMNS), help="default: both")
    args = parser.parse_args()

    export_training_tables()
    for target in [args.target] if args.target else list(TARGET_COLUMNS):
        meta = run_target(target)
        print(json.dumps({k: meta[k] for k in ("model_name", "feature_set", "metrics")}, indent=2))


if __name__ == "__main__":
    main()
