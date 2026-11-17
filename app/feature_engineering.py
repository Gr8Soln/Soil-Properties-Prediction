"""
Feature-engineering helpers for the Soil-Properties-Prediction service.

These functions are adapted directly from the training notebooks so that
the feature matrix passed to the saved model at inference time is
**identical** to the one used during training.

Cu_kPa model  – build_cu_features  → 15-column feature matrix
Phi_deg model – build_phi_features → 14-column feature matrix
"""

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Cu_kPa
# ---------------------------------------------------------------------------

_CU_FEATURE_COLUMNS = [
    "LL",
    "PL",
    "Sat_Unit_Wt_kN_m3",
    "Mv_50kPa",
    "Cv_50kPa",
    "Fines_Content_pct",
    "Sand_Fraction_pct",
    "PI_calc",
    "LL_to_PL_Ratio",
    "Plasticity_to_LL",
    "Coarse_Fraction_pct",
    "Sand_to_Fines_Ratio",
    "Cv_to_Mv_Ratio",
    "Density_x_Fines",
    "Compression_x_Plasticity",
]


def build_cu_features(frame: pd.DataFrame) -> pd.DataFrame:
    """
    Build the 15-column Cu_kPa feature matrix from raw soil measurements.

    Mirrors the ``build_cu_features`` function in Cu_Target_Modeling.ipynb.

    Parameters
    ----------
    frame : pd.DataFrame
        Must contain at minimum the seven raw columns used in training:
        ``LL``, ``PL``, ``Sat_Unit_Wt_kN_m3``, ``Mv_50kPa``,
        ``Cv_50kPa``, ``Fines_Content_pct``, ``Sand_Fraction_pct``.

    Returns
    -------
    pd.DataFrame
        15-column feature matrix ready for the Cu_kPa model.
    """
    f = frame.copy()

    # Plasticity ratios
    f["PI_calc"] = f["LL"] - f["PL"]
    f["LL_to_PL_Ratio"] = f["LL"] / f["PL"].clip(lower=1e-6)
    f["Plasticity_to_LL"] = f["PI_calc"] / f["LL"].clip(lower=1e-6)

    # Grain-size fractions
    f["Coarse_Fraction_pct"] = 100.0 - f["Fines_Content_pct"]
    f["Sand_to_Fines_Ratio"] = f["Sand_Fraction_pct"] / (
        f["Fines_Content_pct"] + 1.0
    )

    # Consolidation × density interaction terms
    f["Cv_to_Mv_Ratio"] = f["Cv_50kPa"] / f["Mv_50kPa"].clip(lower=1e-6)
    f["Density_x_Fines"] = f["Sat_Unit_Wt_kN_m3"] * f["Fines_Content_pct"]
    f["Compression_x_Plasticity"] = f["Mv_50kPa"] * f["PI_calc"]

    X = f[_CU_FEATURE_COLUMNS].copy()

    assert not X.isna().any().any(), "Cu feature matrix must not contain NaNs."
    assert np.isfinite(X.to_numpy()).all(), "Cu feature matrix must be finite."

    return X


# ---------------------------------------------------------------------------
# Phi_deg
# ---------------------------------------------------------------------------

_PHI_FEATURE_COLUMNS = [
    "LL",
    "PL",
    "Sat_Unit_Wt_kN_m3",
    "Mv_50kPa",
    "Cv_50kPa",
    "Fines_Content_pct",
    "Sand_Fraction_pct",
    "PI_calc",
    "Plasticity_to_LL",
    "Coarse_Fraction_pct",
    "Sand_to_Fines_Ratio",
    "Gravel_to_Sand_Ratio",
    "Mv_to_Cv_Ratio",
    "Density_x_Sand",
]


def build_phi_features(frame: pd.DataFrame) -> pd.DataFrame:
    """
    Build the 14-column Phi_deg feature matrix from raw soil measurements.

    Mirrors the ``build_phi_features`` function in Phi_Target_Modeling.ipynb.

    Parameters
    ----------
    frame : pd.DataFrame
        Must contain at minimum the eight raw columns used in training:
        ``LL``, ``PL``, ``Sat_Unit_Wt_kN_m3``, ``Mv_50kPa``,
        ``Cv_50kPa``, ``Fines_Content_pct``, ``Sand_Fraction_pct``,
        ``Gravel_Fraction_pct``.

    Returns
    -------
    pd.DataFrame
        14-column feature matrix ready for the Phi_deg model.
    """
    f = frame.copy()

    # Plasticity ratios
    f["PI_calc"] = f["LL"] - f["PL"]
    f["Plasticity_to_LL"] = f["PI_calc"] / f["LL"].clip(lower=1e-6)

    # Grain-size fractions
    f["Coarse_Fraction_pct"] = 100.0 - f["Fines_Content_pct"]
    f["Sand_to_Fines_Ratio"] = f["Sand_Fraction_pct"] / (
        f["Fines_Content_pct"] + 1.0
    )
    f["Gravel_to_Sand_Ratio"] = f["Gravel_Fraction_pct"] / (
        f["Sand_Fraction_pct"] + 1.0
    )

    # Consolidation × density interaction terms
    f["Mv_to_Cv_Ratio"] = f["Mv_50kPa"] / f["Cv_50kPa"].clip(lower=1e-6)
    f["Density_x_Sand"] = f["Sat_Unit_Wt_kN_m3"] * f["Sand_Fraction_pct"]

    X = f[_PHI_FEATURE_COLUMNS].copy()

    assert not X.isna().any().any(), "Phi feature matrix must not contain NaNs."
    assert np.isfinite(X.to_numpy()).all(), "Phi feature matrix must be finite."

    return X


# ---------------------------------------------------------------------------
# Feature sets
# ---------------------------------------------------------------------------
#
# "full"     – the original feature matrix (uses the oedometer results Mv, Cv).
# "no_mvcv"  – the same matrix without Mv_50kPa, Cv_50kPa and every feature
#              derived from them, for when no consolidation test is available.

FEATURE_SETS = ("full", "no_mvcv")

_MVCV_DERIVED = {
    "Mv_50kPa",
    "Cv_50kPa",
    "Cv_to_Mv_Ratio",
    "Mv_to_Cv_Ratio",
    "Compression_x_Plasticity",
}

_FULL_COLUMNS = {"cu": _CU_FEATURE_COLUMNS, "phi": _PHI_FEATURE_COLUMNS}
_FULL_BUILDERS = {"cu": build_cu_features, "phi": build_phi_features}


def feature_columns(target: str, feature_set: str = "full") -> list[str]:
    """Ordered model feature names for a target ("cu"/"phi") and feature set."""
    columns = _FULL_COLUMNS[target]
    if feature_set == "full":
        return list(columns)
    if feature_set == "no_mvcv":
        return [name for name in columns if name not in _MVCV_DERIVED]
    raise ValueError(f"Unknown feature set: {feature_set!r}")


def raw_input_columns(target: str, feature_set: str = "full") -> list[str]:
    """Raw laboratory inputs a target/feature-set combination needs."""
    columns = [
        "LL",
        "PL",
        "Sat_Unit_Wt_kN_m3",
        "Mv_50kPa",
        "Cv_50kPa",
        "Fines_Content_pct",
        "Sand_Fraction_pct",
    ]
    if target == "phi":
        columns.append("Gravel_Fraction_pct")
    if feature_set == "no_mvcv":
        columns = [name for name in columns if name not in _MVCV_DERIVED]
    return columns


def build_features(
    target: str, frame: pd.DataFrame, feature_set: str = "full"
) -> pd.DataFrame:
    """Build the feature matrix for a target ("cu"/"phi") and feature set."""
    f = frame.copy()
    if feature_set == "no_mvcv":
        # The full builders need these columns to exist; the derived features
        # are dropped again below, so the placeholder value never reaches a model.
        f["Mv_50kPa"] = 1.0
        f["Cv_50kPa"] = 1.0
    X = _FULL_BUILDERS[target](f)
    return X[feature_columns(target, feature_set)].copy()
