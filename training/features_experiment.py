"""Feature-engineering experiment: do de-duplicated / physically motivated features help?

    python -m training.features_experiment

Every number comes from leave-one-site-out validation. Writes to outputs/:
    features_experiment_{cu,phi}.csv          model x feature set results
    features_site_rmse_{cu,phi}.csv           per held-out-site RMSE of every combination
    features_bootstrap_{cu,phi}.csv           change vs the current full set, bootstrapped over sites
    features_selection_{cu,phi}.csv           features kept by backward elimination, per outer fold
    features_li_side_study.csv                what natural water content (Wn) would add (not deployed)
"""

from __future__ import annotations

import time

import numpy as np
import pandas as pd
from sklearn.model_selection import LeaveOneGroupOut

from app.feature_engineering import (
    CANDIDATE_POOL,
    EXPERIMENT_FEATURE_SETS,
    LEGACY_FEATURE_SETS,
    build_experiment_pool,
)
from training.data import OUTPUT_DIR, TARGET_COLUMNS, build_xy, load_harmonized, load_target_frame
from training.evaluate import backward_select, evaluate, fit_spec, rmse
from training.models import BASELINE_NAME, RANDOM_STATE, build_model_specs

SCHEME = "site_holdout"
MODELS = [BASELINE_NAME, "Ridge Regression", "Random Forest", "Extra Trees",
          "Gradient Boosting", "XGBoost", "SVR", "ANN (MLP)"]
REFERENCE_SET = "full"
N_BOOTSTRAP = 2000


def _specs() -> list:
    return [spec for spec in build_model_specs() if spec.name in MODELS]


def evaluate_selected(frame: pd.DataFrame, target: str, specs: list):
    """Backward selection inside every outer fold, then each model on the kept features."""
    column = TARGET_COLUMNS[target]
    pool = build_experiment_pool(frame)
    y, groups = frame[column], frame["Site"]
    oof = {spec.name: np.full(len(y), np.nan) for spec in specs}
    kept_rows = []
    for train, test in LeaveOneGroupOut().split(pool, groups=groups):
        kept = backward_select(pool.iloc[train], y.iloc[train], groups.iloc[train])
        held_out = groups.iloc[test].iloc[0]
        kept_rows.append({"Held_Out": held_out, "N_Features": len(kept), "Features": ";".join(kept)})
        for spec in specs:
            model, _ = fit_spec(spec, pool.iloc[train][kept], y.iloc[train], groups.iloc[train], SCHEME)
            oof[spec.name][test] = model.predict(pool.iloc[test][kept])
    return oof, pd.DataFrame(kept_rows)


def bootstrap_vs_reference(y, groups, pred_set, pred_ref, seed=RANDOM_STATE) -> dict[str, float]:
    """Pooled-RMSE difference (set - reference) with sites resampled with replacement."""
    rng = np.random.default_rng(seed)
    sites = groups.unique()
    index = {site: np.flatnonzero((groups == site).to_numpy()) for site in sites}
    y_arr = y.to_numpy()
    diffs = []
    for _ in range(N_BOOTSTRAP):
        rows = np.concatenate([index[s] for s in rng.choice(sites, size=len(sites), replace=True)])
        diffs.append(rmse(y_arr[rows], pred_set[rows]) - rmse(y_arr[rows], pred_ref[rows]))
    diffs = np.asarray(diffs)
    site_wins = np.mean([
        rmse(y_arr[index[s]], pred_set[index[s]]) < rmse(y_arr[index[s]], pred_ref[index[s]]) for s in sites
    ])
    return {"Delta_RMSE": float(rmse(y, pred_set) - rmse(y, pred_ref)),
            "CI_Low": float(np.percentile(diffs, 2.5)), "CI_High": float(np.percentile(diffs, 97.5)),
            "Share_Of_Sites_Improved": float(site_wins)}


def run_target(target: str) -> None:
    frame = load_target_frame(target)
    specs = _specs()
    column = TARGET_COLUMNS[target]
    y, groups = frame[column], frame["Site"]
    print(f"\n=== {column} ({len(frame)} rows) ===")

    oof: dict[tuple[str, str], np.ndarray] = {}
    rows = []
    for feature_set in LEGACY_FEATURE_SETS + EXPERIMENT_FEATURE_SETS:
        X, _, _ = build_xy(frame, target, feature_set)
        for spec in specs:
            started = time.time()
            metrics, predictions, _ = evaluate(spec, X, y, groups, SCHEME)
            oof[(feature_set, spec.name)] = predictions
            rows.append({"Feature_Set": feature_set, "Model": spec.name, "N_Features": X.shape[1], **metrics})
            print(f"  {feature_set:17s} {spec.name:18s} RMSE={metrics['OOF_RMSE']:.3f} R2={metrics['OOF_R2']:+.3f} ({time.time()-started:.0f}s)")

    started = time.time()
    selected_oof, selection = evaluate_selected(frame, target, specs)
    for spec in specs:
        predictions = selected_oof[spec.name]
        oof[("selected", spec.name)] = predictions
        rows.append({"Feature_Set": "selected", "Model": spec.name,
                     "N_Features": float(selection["N_Features"].mean()),
                     "OOF_RMSE": rmse(y, predictions),
                     "OOF_MAE": float(np.mean(np.abs(y - predictions))),
                     "OOF_R2": float(1 - ((y - predictions) ** 2).sum() / ((y - y.mean()) ** 2).sum())})
        print(f"  {'selected':17s} {spec.name:18s} RMSE={rows[-1]['OOF_RMSE']:.3f} R2={rows[-1]['OOF_R2']:+.3f}")
    print(f"  selection took {time.time()-started:.0f}s")

    results = pd.DataFrame(rows).sort_values(["Feature_Set", "OOF_RMSE"]).reset_index(drop=True)
    results.to_csv(OUTPUT_DIR / f"features_experiment_{target}.csv", index=False)
    selection.to_csv(OUTPUT_DIR / f"features_selection_{target}.csv", index=False)

    site_rows = []
    for (feature_set, model), predictions in oof.items():
        for site, part in frame.assign(pred=predictions).groupby("Site"):
            site_rows.append({"Feature_Set": feature_set, "Model": model, "Site": site,
                              "Rows": len(part), "RMSE": rmse(part[column], part["pred"])})
    pd.DataFrame(site_rows).to_csv(OUTPUT_DIR / f"features_site_rmse_{target}.csv", index=False)

    # Compare each set's best model with the best model on the current full set.
    real = results[results["Model"] != BASELINE_NAME]
    ref_model = real[real["Feature_Set"] == REFERENCE_SET].nsmallest(1, "OOF_RMSE")["Model"].iloc[0]
    boot = []
    for feature_set, part in real.groupby("Feature_Set"):
        model = part.nsmallest(1, "OOF_RMSE")["Model"].iloc[0]
        boot.append({"Feature_Set": feature_set, "Model": model, "Reference": f"{REFERENCE_SET}/{ref_model}",
                     **bootstrap_vs_reference(y, groups, oof[(feature_set, model)], oof[(REFERENCE_SET, ref_model)])})
    pd.DataFrame(boot).to_csv(OUTPUT_DIR / f"features_bootstrap_{target}.csv", index=False)


def li_side_study() -> None:
    """Liquidity index (needs Wn) on the sites that recorded Wn. Informational only."""
    audit = load_harmonized()
    base = ["LL", "PL", "Sat_Unit_Wt_kN_m3", "Fines_Content_pct", "Sand_Fraction_pct"]
    rows = []
    for target, column in TARGET_COLUMNS.items():
        data = audit[base + ["Moisture_Content", column, "Site"]].dropna().reset_index(drop=True)
        pi = (data["LL"] - data["PL"]).clip(lower=1.0)
        with_li = build_experiment_pool(data)[["LL", "PI_calc", "Sat_Unit_Wt_kN_m3", "Fines_Content_pct", "Sand_Fraction_pct"]].assign(
            LI=(data["Moisture_Content"] - data["PL"]) / pi, Wn=data["Moisture_Content"])
        without = with_li.drop(columns=["LI", "Wn"])
        spec = next(s for s in build_model_specs() if s.name == "Extra Trees")
        y, groups = data[column], data["Site"]
        for label, X in (("minimal (no Wn)", without), ("minimal + Wn + LI", with_li)):
            metrics, _, _ = evaluate(spec, X, y, groups, SCHEME)
            rows.append({"Target": column, "Features": label, "Rows": len(data),
                         "Sites": groups.nunique(), "OOF_RMSE": metrics["OOF_RMSE"], "OOF_R2": metrics["OOF_R2"]})
    pd.DataFrame(rows).to_csv(OUTPUT_DIR / "features_li_side_study.csv", index=False)
    print(pd.DataFrame(rows).round(3).to_string(index=False))


def main() -> None:
    for target in TARGET_COLUMNS:
        run_target(target)
    li_side_study()


if __name__ == "__main__":
    main()
