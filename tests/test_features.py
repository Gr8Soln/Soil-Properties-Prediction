import json

import joblib
import pandas as pd
import pytest

from app.feature_engineering import (
    FEATURE_SETS,
    build_cu_features,
    build_features,
    build_phi_features,
    feature_columns,
    raw_input_columns,
)
from training.data import OUTPUT_DIR, build_xy, load_target_frame

LEGACY = {"cu": build_cu_features, "phi": build_phi_features}


@pytest.mark.parametrize("target", ["cu", "phi"])
def test_full_set_matches_original_builders(target):
    frame = load_target_frame(target)
    pd.testing.assert_frame_equal(build_features(target, frame, "full"), LEGACY[target](frame))


@pytest.mark.parametrize("target", ["cu", "phi"])
def test_no_mvcv_set_drops_every_consolidation_feature(target):
    frame = load_target_frame(target).drop(columns=["Mv_50kPa", "Cv_50kPa"])
    X = build_features(target, frame, "no_mvcv")
    assert list(X.columns) == feature_columns(target, "no_mvcv")
    assert not [name for name in X.columns if "Mv" in name or "Cv" in name]
    assert "Compression_x_Plasticity" not in X.columns
    assert not {"Mv_50kPa", "Cv_50kPa"} & set(raw_input_columns(target, "no_mvcv"))


@pytest.mark.parametrize("target", ["cu", "phi"])
def test_deployed_model_agrees_with_its_metadata(target):
    """The saved model, its metadata and the API feature code must line up."""
    meta = json.loads((OUTPUT_DIR / f"{target}_model_meta.json").read_text())
    assert meta["feature_set"] in FEATURE_SETS
    assert meta["features"] == feature_columns(target, meta["feature_set"])

    model = joblib.load(OUTPUT_DIR / f"{target}_best_model.joblib")
    X, _, _ = build_xy(load_target_frame(target), target, meta["feature_set"])
    assert model.n_features_in_ == X.shape[1]
    if hasattr(model, "feature_names_in_"):
        assert list(model.feature_names_in_) == list(X.columns)
    background = pd.read_csv(OUTPUT_DIR / f"{target}_shap_background.csv")
    assert list(background.columns) == meta["features"]


# --- de-duplicated experiment feature sets -----------------------------------------

import numpy as np

from app.feature_engineering import EXPERIMENT_FEATURE_SETS, build_experiment_pool


@pytest.mark.parametrize("feature_set", EXPERIMENT_FEATURE_SETS)
@pytest.mark.parametrize("target", ["cu", "phi"])
def test_experiment_sets_are_finite_ordered_and_use_declared_inputs(target, feature_set):
    frame = load_target_frame(target)
    X = build_features(target, frame, feature_set)
    assert list(X.columns) == feature_columns(target, feature_set)
    assert np.isfinite(X.to_numpy()).all()
    # Building from only the declared raw inputs must give the same matrix.
    needed = raw_input_columns(target, feature_set)
    pd.testing.assert_frame_equal(X, build_features(target, frame[needed], feature_set))


def test_experiment_sets_have_no_duplicate_information():
    pool = build_experiment_pool(load_target_frame("cu"))
    # Only LL and PI carry plasticity; the PL-based duplicates are gone.
    assert not {"PL", "LL_to_PL_Ratio", "Plasticity_to_LL", "Coarse_Fraction_pct"} & set(pool.columns)
    assert np.allclose(pool["A_line_distance"], pool["PI_calc"] - 0.73 * (pool["LL"] - 20.0))
    assert np.allclose(pool["Cv_x_Mv"], load_target_frame("cu")["Cv_50kPa"] * load_target_frame("cu")["Mv_50kPa"])


def test_sets_without_consolidation_inputs_do_not_need_mv_cv():
    for feature_set in ("minimal", "plasticity_chart", "log_scaled"):
        assert not {"Mv_50kPa", "Cv_50kPa"} & set(raw_input_columns("cu", feature_set))
