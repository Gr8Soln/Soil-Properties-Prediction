"""Figures for the write-up, drawn from the CSVs that ``training.train`` exports.

    python -m training.report      # writes outputs/figures/*.png
"""

from __future__ import annotations

import json

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from training.data import OUTPUT_DIR, TARGET_COLUMNS
from training.models import BASELINE_NAME

FIGURE_DIR = OUTPUT_DIR / "figures"
UNITS = {"cu": "kPa", "phi": "°"}

BLUE, ORANGE = "#2a78d6", "#eb6834"
INK, MUTED, GRID, SURFACE = "#0b0b0b", "#52514e", "#e4e3df", "#fcfcfb"

SCHEME_LABELS = {"shuffled_5fold": "Shuffled 5-fold", "site_holdout": "Unseen site (leave-one-site-out)"}
SET_LABELS = {"full": "With Mv and Cv", "no_mvcv": "Without Mv and Cv"}


def _style() -> None:
    plt.rcParams.update(
        {
            "figure.facecolor": SURFACE,
            "axes.facecolor": SURFACE,
            "savefig.facecolor": SURFACE,
            "axes.edgecolor": GRID,
            "axes.labelcolor": MUTED,
            "axes.titlecolor": INK,
            "axes.titlesize": 12,
            "axes.titleweight": "bold",
            "axes.titlelocation": "left",
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.grid": True,
            "grid.color": GRID,
            "grid.linewidth": 0.8,
            "axes.axisbelow": True,
            "xtick.color": MUTED,
            "ytick.color": MUTED,
            "text.color": INK,
            "font.size": 10,
            "legend.frameon": False,
        }
    )


def load(target: str) -> dict:
    read = lambda name: pd.read_csv(OUTPUT_DIR / f"{target}_{name}.csv")  # noqa: E731
    return {
        "comparison": read("model_comparison"),
        "oof": read("oof_predictions"),
        "sites": read("site_errors"),
        "importance": read("feature_importance"),
        "meta": json.loads((OUTPUT_DIR / f"{target}_model_meta.json").read_text()),
    }


def summary_table(target: str, feature_set: str = "full") -> pd.DataFrame:
    """One row per model: R² / RMSE / MAE under both protocols, best unseen-site first."""
    table = load(target)["comparison"]
    table = table[table["Feature_Set"] == feature_set]
    wide = table.pivot(index="Model", columns="Validation", values=["OOF_R2", "OOF_RMSE", "OOF_MAE"])
    wide.columns = [f"{metric[4:]} {'unseen site' if scheme == 'site_holdout' else 'shuffled'}"
                    for metric, scheme in wide.columns]
    return wide.sort_values("RMSE unseen site").round(3)


def _paired_bars(ax, table: pd.DataFrame, column: str, labels: dict, baseline: float, unit: str) -> None:
    """Horizontal bars, two per model. Bars far past the baseline are cut and labelled."""
    order = (
        table[table[column] == list(labels)[-1]].sort_values("OOF_RMSE")["Model"].tolist()
    )
    limit = baseline * 1.45
    height = 0.36
    for offset, (key, colour) in zip((-height / 2 - 0.01, height / 2 + 0.01), zip(labels, (BLUE, ORANGE))):
        part = table[table[column] == key].set_index("Model").reindex(order)
        positions = np.arange(len(order)) + offset
        ax.barh(positions, part["OOF_RMSE"].clip(upper=limit), height=height, color=colour,
                label=labels[key], linewidth=0)
        for y, value in zip(positions, part["OOF_RMSE"]):
            if value > limit:
                ax.text(limit, y, f" {value:.1f} →", va="center", ha="left", fontsize=8, color=MUTED)
    ax.axvline(baseline, color=MUTED, linewidth=1, linestyle=(0, (4, 3)))
    ax.text(baseline, len(order) - 0.45, " predict-the-mean baseline", fontsize=8, color=MUTED, va="top")
    ax.set_yticks(np.arange(len(order)), order)
    ax.invert_yaxis()
    ax.set_xlim(0, limit * 1.1)
    ax.set_xlabel(f"Out-of-fold RMSE ({unit}) — lower is better")
    ax.grid(axis="y", visible=False)
    ax.legend(loc="lower left", bbox_to_anchor=(0, 1.0), ncol=2, fontsize=9, borderaxespad=0.2)


def figure_validation_gap(target: str):
    data, unit = load(target), UNITS[target]
    table = data["comparison"]
    table = table[table["Feature_Set"] == "full"]
    baseline = table[(table["Model"] == BASELINE_NAME) & (table["Validation"] == "site_holdout")]["OOF_RMSE"].iloc[0]
    fig, ax = plt.subplots(figsize=(8.5, 5))
    _paired_bars(ax, table[table["Model"] != BASELINE_NAME], "Validation", SCHEME_LABELS, baseline, unit)
    ax.set_title(f"{TARGET_COLUMNS[target]}: error on an unseen site vs shuffled cross-validation", pad=28)
    return fig


def figure_mvcv(target: str):
    data, unit = load(target), UNITS[target]
    table = data["comparison"]
    table = table[table["Validation"] == "site_holdout"]
    baseline = table[table["Model"] == BASELINE_NAME]["OOF_RMSE"].min()
    fig, ax = plt.subplots(figsize=(8.5, 5))
    _paired_bars(ax, table[table["Model"] != BASELINE_NAME], "Feature_Set", SET_LABELS, baseline, unit)
    ax.set_title(f"{TARGET_COLUMNS[target]}: unseen-site error with and without Mv / Cv", pad=28)
    return fig


def figure_parity(target: str):
    data, unit = load(target), UNITS[target]
    oof, meta = data["oof"], data["meta"]
    low = min(oof["Actual"].min(), oof["OOF_Prediction"].min(), oof["OOF_Prediction_Shuffled"].min())
    high = max(oof["Actual"].max(), oof["OOF_Prediction"].max(), oof["OOF_Prediction_Shuffled"].max())
    pad = (high - low) * 0.05
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.8), sharex=True, sharey=True)
    panels = (("OOF_Prediction_Shuffled", "shuffled_5fold", BLUE), ("OOF_Prediction", "site_holdout", ORANGE))
    for ax, (column, scheme, colour) in zip(axes, panels):
        ax.plot([low - pad, high + pad], [low - pad, high + pad], color=MUTED, linewidth=1, linestyle=(0, (4, 3)))
        ax.scatter(oof["Actual"], oof[column], s=26, color=colour, edgecolor=SURFACE, linewidth=0.6, alpha=0.9)
        scores = meta["metrics"][scheme]
        ax.set_title(SCHEME_LABELS[scheme], fontsize=11)
        ax.text(0.03, 0.97, f"R² = {scores['r2']:.2f}\nRMSE = {scores['rmse']:.2f} {unit}",
                transform=ax.transAxes, va="top", fontsize=9, color=MUTED)
        ax.set_xlabel(f"Measured {TARGET_COLUMNS[target]} ({unit})")
        ax.set_aspect("equal", adjustable="box")
        ax.set_xlim(low - pad, high + pad)
        ax.set_ylim(low - pad, high + pad)
    axes[0].set_ylabel(f"Predicted ({unit})")
    fig.suptitle(f"{TARGET_COLUMNS[target]} — {meta['model_name']}: measured vs out-of-fold prediction",
                 x=0.02, ha="left", fontsize=12, fontweight="bold")
    return fig


def figure_site_errors(target: str):
    data, unit = load(target), UNITS[target]
    sites = data["sites"].sort_values("RMSE")
    labels = [f"{site.replace('_', ' ')}  (n={rows})" for site, rows in zip(sites["Site"], sites["Rows"])]
    fig, ax = plt.subplots(figsize=(8.5, 4.2))
    ax.barh(labels, sites["RMSE"], height=0.6, color=ORANGE, linewidth=0)
    overall = data["meta"]["metrics"]["site_holdout"]["rmse"]
    ax.axvline(overall, color=MUTED, linewidth=1, linestyle=(0, (4, 3)))
    ax.text(overall, -0.6, " all sites pooled", fontsize=8, color=MUTED, va="bottom")
    ax.set_xlabel(f"RMSE when the site is held out ({unit})")
    ax.grid(axis="y", visible=False)
    ax.set_title(f"{TARGET_COLUMNS[target]} — {data['meta']['model_name']}: error by held-out site")
    return fig


FIGURES = {
    "validation_gap": figure_validation_gap,
    "mvcv_ablation": figure_mvcv,
    "parity": figure_parity,
    "site_errors": figure_site_errors,
}


def main() -> None:
    _style()
    FIGURE_DIR.mkdir(exist_ok=True)
    for target in TARGET_COLUMNS:
        for name, draw in FIGURES.items():
            fig = draw(target)
            fig.tight_layout()
            path = FIGURE_DIR / f"{target}_{name}.png"
            fig.savefig(path, dpi=200)
            plt.close(fig)
            print(f"wrote {path.relative_to(OUTPUT_DIR.parent)}")


if __name__ == "__main__":
    main()
