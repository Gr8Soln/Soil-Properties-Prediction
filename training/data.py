"""Workbook loading and harmonisation.

Ported from notebooks/Unified_Geotechnical_Modeling.ipynb. The cleaning rules are
unchanged; the one difference is that the site label is kept, because every workbook
is one site investigation and validation has to be able to hold a whole site out.
"""

from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd

from app.feature_engineering import build_features

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "datasets"
OUTPUT_DIR = PROJECT_ROOT / "outputs"

# geotechnical_data_3.xlsx yes, "geotechnical_data_3 copy.xlsx" no.
_WORKBOOK_PATTERN = re.compile(r"^geotechnical_data_(\d+)\.xlsx$")

TARGET_COLUMNS = {"cu": "Cu_kPa", "phi": "Phi_deg"}

COLUMN_RENAME_MAP = {
    "LL (%)": "LL",
    "PL (%)": "PL",
    "PI (%)": "PI",
    "Wn_%": "Moisture_Content",
    "SPT_N": "SPT_N_Raw",
    "SPT_kPa": "SPT_Resistance_kPa",
    "Grain_2.00mm (%)": "Grain_2.00mm",
    "Grain_0.425mm (%)": "Grain_0.425mm",
    "Grain_0.075mm (%)": "Grain_0.075mm",
    "Grain_75um": "Grain_0.075mm",
    "Mv_50kPa (m²/MN)x10⁻⁴": "Mv_50kPa",
    "Mv_400kPa (m²/MN)x10⁻⁴": "Mv_400kPa",
    "Cv_50kPa (m²/yr)": "Cv_50kPa",
    "Cv_400kPa (m²/yr)": "Cv_400kPa",
}

FINAL_EXPORT_COLUMNS = [
    "LL",
    "PL",
    "PI",
    "Sat_Unit_Wt_kN_m3",
    "Mv_50kPa",
    "Cv_50kPa",
    "Grain_CoarsePassing_pct",
    "Fines_Content_pct",
    "Sand_Fraction_pct",
    "Gravel_Fraction_pct",
]

VALID_RANGE_COLUMNS = {
    "LL": (0.0, 120.0),
    "PL": (0.0, 80.0),
    "PI": (0.0, 80.0),
    "Moisture_Content": (0.0, 150.0),
    "Sat_Unit_Wt_kN_m3": (10.0, 24.5),
    "Phi_deg": (0.0, 50.0),
    "Cu_kPa": (0.0, 500.0),
    "SPT_BlowCount_N": (0.0, 100.0),
    "SPT_Resistance_kPa": (0.0, 500.0),
    "CPT_MPa": (0.0, 50.0),
    "Grain_4.75mm": (0.0, 100.0),
    "Grain_2.36mm": (0.0, 100.0),
    "Grain_2.00mm": (0.0, 100.0),
    "Grain_0.425mm": (0.0, 100.0),
    "Grain_0.075mm": (0.0, 100.0),
    "Grain_2um": (0.0, 100.0),
}


def workbook_paths(data_dir: Path = DATA_DIR) -> list[Path]:
    """Source workbooks in numeric order, ignoring Finder-style "copy" duplicates."""
    matches = []
    for path in data_dir.iterdir():
        match = _WORKBOOK_PATTERN.match(path.name)
        if match:
            matches.append((int(match.group(1)), path))
    return [path for _, path in sorted(matches)]


def _series_or_nan(frame: pd.DataFrame, column: str) -> pd.Series:
    if column in frame.columns:
        return pd.to_numeric(frame[column], errors="coerce")
    return pd.Series(np.nan, index=frame.index, dtype=float)


def _standardize_headers(frame: pd.DataFrame) -> pd.DataFrame:
    cleaned = frame.rename(columns=COLUMN_RENAME_MAP)
    for name in cleaned.columns[cleaned.columns.duplicated()].unique():
        block = cleaned.loc[:, cleaned.columns == name]
        cleaned = cleaned.loc[:, cleaned.columns != name]
        cleaned[name] = block.bfill(axis=1).iloc[:, 0]
    return cleaned


def _convert_unit_weight(series: pd.Series) -> pd.Series:
    """Density-style values (e.g. 1.85 Mg/m3) become kN/m3; unit weights stay."""
    numeric = pd.to_numeric(series, errors="coerce")
    density_like = numeric.between(0.8, 3.0, inclusive="both")
    numeric.loc[density_like] = numeric.loc[density_like] * 9.81
    return numeric


def _split_spt(frame: pd.DataFrame) -> pd.DataFrame:
    cleaned = frame.copy()
    raw_n = _series_or_nan(cleaned, "SPT_N_Raw")
    raw_resistance = _series_or_nan(cleaned, "SPT_Resistance_kPa")
    cleaned["SPT_BlowCount_N"] = raw_n.where(raw_n <= 60)
    cleaned["SPT_Resistance_kPa"] = raw_resistance.combine_first(raw_n.where(raw_n > 60))
    return cleaned.drop(columns=["SPT_N_Raw"], errors="ignore")


def _apply_domain_rules(frame: pd.DataFrame) -> pd.DataFrame:
    cleaned = frame.copy()
    for column in cleaned.columns:
        if column != "Source_File":
            cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")

    if "Sat_Unit_Wt_kN_m3" in cleaned.columns:
        cleaned["Sat_Unit_Wt_kN_m3"] = _convert_unit_weight(cleaned["Sat_Unit_Wt_kN_m3"])

    if {"LL", "PL"}.issubset(cleaned.columns):
        expected_pi = cleaned["LL"] - cleaned["PL"]
        if "PI" not in cleaned.columns:
            cleaned["PI"] = expected_pi
        else:
            needs_fill = cleaned["PI"].isna() | ((expected_pi - cleaned["PI"]).abs() > 0.5)
            cleaned.loc[needs_fill, "PI"] = expected_pi.loc[needs_fill]

    for column, (low, high) in VALID_RANGE_COLUMNS.items():
        if column in cleaned.columns:
            cleaned[column] = cleaned[column].where(cleaned[column].between(low, high))

    for column in [name for name in cleaned.columns if name.startswith(("Mv_", "Cv_"))]:
        cleaned[column] = cleaned[column].where(cleaned[column] >= 0)
    return cleaned


def _add_gradation(frame: pd.DataFrame) -> pd.DataFrame:
    engineered = frame.copy()
    fines = _series_or_nan(engineered, "Grain_0.075mm")
    coarse_passing = _series_or_nan(engineered, "Grain_2.00mm").combine_first(
        _series_or_nan(engineered, "Grain_2.36mm")
    )
    sand = coarse_passing - fines
    gravel = 100.0 - coarse_passing
    engineered["Grain_CoarsePassing_pct"] = coarse_passing.where(coarse_passing.between(0, 100))
    engineered["Fines_Content_pct"] = fines.where(fines.between(0, 100))
    engineered["Sand_Fraction_pct"] = sand.where(sand.between(0, 100))
    engineered["Gravel_Fraction_pct"] = gravel.where(gravel.between(0, 100))
    return engineered


def load_harmonized(data_dir: Path = DATA_DIR) -> pd.DataFrame:
    """All workbooks, harmonised and de-duplicated, with ``Source_File`` and ``Site``."""
    frames = []
    for path in workbook_paths(data_dir):
        frame = _standardize_headers(pd.read_excel(path))
        frame["Source_File"] = path.name
        frame = _add_gradation(_apply_domain_rules(_split_spt(frame)))
        frames.append(frame)

    merged = pd.concat(frames, ignore_index=True, sort=False)
    # Workbooks 4 and 5 are the same site entered twice; exact repeats keep the first.
    deduped = merged.drop_duplicates(
        subset=[column for column in merged.columns if column != "Source_File"]
    ).reset_index(drop=True)
    deduped["Site"] = "site_" + deduped["Source_File"].str.extract(r"_(\d+)\.xlsx$")[0]
    return deduped


def load_target_frame(target: str, data_dir: Path = DATA_DIR) -> pd.DataFrame:
    """Complete rows for one target ("cu"/"phi"): inputs, target and ``Site``."""
    column = TARGET_COLUMNS[target]
    audit = load_harmonized(data_dir)
    return audit[FINAL_EXPORT_COLUMNS + [column, "Site"]].dropna().reset_index(drop=True)


def build_xy(
    frame: pd.DataFrame, target: str, feature_set: str = "full"
) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """Feature matrix, target and site groups, using the API's own feature code."""
    X = build_features(target, frame, feature_set)
    return X, frame[TARGET_COLUMNS[target]].copy(), frame["Site"].copy()
