# AGENT.md — Soil-Properties-Prediction

> Onboarding guide for AI coding assistants. Read before changing anything.
> `CLAUDE.md` holds the short list of commands and hard rules.

## What this is

Final-year machine-learning project in geotechnical engineering. It predicts two soil
shear-strength parameters from routine laboratory index tests:

| Target | Column | Unit | Range in the data |
|---|---|---|---|
| Undrained cohesion | `Cu_kPa` | kPa | 0–85 |
| Angle of internal friction | `Phi_deg` | degrees | 2–18 |

Three parts: a training pipeline (`training/`), a FastAPI inference service with SHAP
explanations (`app/`), and a React UI (`ui/`).

## Layout

```
datasets/geotechnical_data_{0-9}.xlsx   raw data, one workbook per site (do not edit)
training/
  data.py        load + harmonise workbooks, keeps the Site label
  models.py      model zoo: 6 original regressors + SVR + ANN + mean baseline
  evaluate.py    shuffled 5-fold and leave-one-site-out CV, nested tuning, importance
  train.py       runs everything, picks and saves the deployed model per target
  report.py      figures for the write-up -> outputs/figures/
app/
  feature_engineering.py   THE feature code, shared by training and the API
  model_service.py         loads model + metadata, predicts, explains (SHAP)
  schemas.py               Pydantic request/response models and input validation
  main.py                  routes
tests/           data counts, feature parity, API behaviour (pytest)
notebooks/
  Model_Comparison.ipynb              results notebook (reads outputs/, trains nothing)
  Unified_Geotechnical_Modeling.ipynb original harmonisation notebook (historical)
  Cu_Target_Modeling.ipynb, Phi_Target_Modeling.ipynb   original 6-model notebooks (historical)
  legacy/                             early exploration; inputs no longer exist
outputs/         everything training writes (see "Artifacts")
ui/              TanStack Start + React 19 + Vite + Tailwind 4 + shadcn/ui, Bun
```

## Data

- 10 workbooks, 316 raw rows. Workbooks 4 and 5 are identical, so exact-duplicate removal
  leaves 258 rows from **9 sites**; 227 have every input plus Cu, 228 plus Phi.
- **Each workbook is one site investigation.** This is the grouping unit for validation.
- Sites are unequal: site 9 contributes 2 rows (both Cu = 0), site 0 contributes 5.
- Phi takes only 15 distinct values. 13 rows share identical inputs; two of those groups
  have different Cu, so some of the error is irreducible.
- Harmonisation rules (`training/data.py`, ported unchanged from the Unified notebook):
  header variants renamed; unit weights between 0.8 and 3.0 treated as density and
  multiplied by 9.81; PI rebuilt as LL − PL when missing or inconsistent; values outside
  broad physical ranges set to missing; gradation derived from sieve columns
  (fines = passing 0.075 mm, sand = passing 2.00/2.36 mm − fines, gravel = remainder).
- Files named like `geotechnical_data_3 copy.xlsx` are ignored by the loaders.

## Features

Raw inputs: `LL`, `PL`, `Sat_Unit_Wt_kN_m3`, `Mv_50kPa`, `Cv_50kPa`, `Fines_Content_pct`,
`Sand_Fraction_pct`, and for Phi also `Gravel_Fraction_pct`.

| Feature | Formula | Cu | Phi |
|---|---|---|---|
| `PI_calc` | LL − PL | yes | yes |
| `LL_to_PL_Ratio` | LL / max(PL, 1e-6) | yes | |
| `Plasticity_to_LL` | PI_calc / max(LL, 1e-6) | yes | yes |
| `Coarse_Fraction_pct` | 100 − Fines | yes | yes |
| `Sand_to_Fines_Ratio` | Sand / (Fines + 1) | yes | yes |
| `Gravel_to_Sand_Ratio` | Gravel / (Sand + 1) | | yes |
| `Cv_to_Mv_Ratio` | Cv / max(Mv, 1e-6) | yes | |
| `Mv_to_Cv_Ratio` | Mv / max(Cv, 1e-6) | | yes |
| `Density_x_Fines` | Sat_Unit_Wt × Fines | yes | |
| `Density_x_Sand` | Sat_Unit_Wt × Sand | | yes |
| `Compression_x_Plasticity` | Mv × PI_calc | yes | |

Two feature sets (`build_features(target, frame, feature_set)`):

- `full` — everything above: 15 columns for Cu, 14 for Phi.
- `no_mvcv` — without Mv, Cv and the three features derived from them: 11 columns each.
- De-duplicated experiment sets: `minimal` (LL, PI, unit weight, fines, sand), `minimal_mvcv`,
  `plasticity_chart` (+ Casagrande A-line distance PI − 0.73·(LL − 20)), `log_scaled`
  (+ ln PI, ln LL), `physics` (+ Mv, Cv, their logs, Cv × Mv ∝ permeability).

Column order is fixed by `feature_columns()` and checked against the model at inference.

## Validation — read this before quoting any number

| Protocol | Name in files | What it measures |
|---|---|---|
| Shuffled 5-fold | `shuffled_5fold` | Interpolation between samples of sites already seen. Flattering. |
| Leave-one-site-out | `site_holdout` | Accuracy on a site the model never saw. **Headline score; selects the deployed model.** |

The original notebooks reported only shuffled scores (Cu R² 0.826, Phi R² 0.875). Those
numbers are reproducible but do not describe performance on a new site.

SVR and the ANN are tuned inside every training fold (nested CV, inner split of the same
kind as the outer one). The six original models keep their fixed notebook settings.

## Results (from `python -m training.train`)

### Deployed models

| Target | Deployed model | Feature set | Required inputs | Unseen site R² / RMSE | Shuffled R² / RMSE |
|---|---|---|---|---|---|
| Cu_kPa | Extra Trees | plasticity_chart (6 features) | LL, PL, unit weight, fines, sand | 0.37 / 12.91 kPa | 0.75 / 8.08 kPa |
| Phi_deg | XGBoost | minimal (5 features) | LL, PL, unit weight, fines, sand | 0.26 / 3.42° | 0.76 / 1.94° |

Chosen as the simplest feature set within noise of the best unseen-site result (see the
feature experiment below). The tables underneath compare the original `full` feature set
and the Mv/Cv-free variant.

### Cu_kPa — all models (227 rows, 9 sites)

| Model | Unseen site R² | Unseen site RMSE (kPa) | Unseen site RMSE, no Mv/Cv (kPa) | Shuffled R² | Shuffled RMSE (kPa) |
|---|---|---|---|---|---|
| Extra Trees | +0.36 | 13.01 | 12.83 | +0.83 | 6.76 |
| Gradient Boosting | +0.17 | 14.78 | 12.95 | +0.80 | 7.29 |
| XGBoost | +0.22 | 14.31 | 13.21 | +0.81 | 7.15 |
| Random Forest | +0.24 | 14.18 | 13.77 | +0.78 | 7.69 |
| SVR | +0.12 | 15.26 | 14.58 | +0.70 | 8.84 |
| ANN (MLP) | +0.12 | 15.23 | 14.95 | +0.73 | 8.40 |
| Mean Baseline | -0.18 | 17.63 | 17.63 | -0.02 | 16.40 |
| Ridge Regression | -3.06 | 32.70 | 25.85 | +0.47 | 11.82 |
| Linear Regression | -6.12 | 43.30 | 28.96 | +0.47 | 11.86 |

### Phi_deg — all models (228 rows, 9 sites)

| Model | Unseen site R² | Unseen site RMSE (°) | Unseen site RMSE, no Mv/Cv (°) | Shuffled R² | Shuffled RMSE (°) |
|---|---|---|---|---|---|
| XGBoost | +0.28 | 3.36 | 3.28 | +0.82 | 1.66 |
| Extra Trees | +0.31 | 3.29 | 3.38 | +0.87 | 1.40 |
| Random Forest | +0.18 | 3.59 | 3.39 | +0.77 | 1.88 |
| Gradient Boosting | +0.10 | 3.76 | 3.42 | +0.79 | 1.81 |
| ANN (MLP) | -0.12 | 4.20 | 3.79 | +0.84 | 1.57 |
| SVR | +0.07 | 3.82 | 3.89 | +0.80 | 1.77 |
| Mean Baseline | -0.04 | 4.04 | 4.04 | -0.01 | 3.99 |
| Linear Regression | -0.35 | 4.61 | 4.12 | +0.59 | 2.56 |
| Ridge Regression | -0.58 | 4.99 | 4.45 | +0.47 | 2.89 |

"Unseen site" = leave-one-site-out. "Shuffled" = shuffled 5-fold, the protocol of the
original notebooks. Full table with MAE and per-fold statistics:
`outputs/{cu,phi}_model_comparison.csv`.

### What the results say

1. **Shuffled cross-validation overstates accuracy by a wide margin.** Each workbook is
   one site and samples within a site resemble each other, so shuffled folds let a model
   look up near-copies of the test row. R² falls from about 0.8 to about 0.3 when the
   site is genuinely new.
2. **ANN and SVR do not beat the tree ensembles.** Under shuffled CV the ANN is
   competitive (Phi R² 0.84); on unseen sites both are close to the predict-the-mean
   baseline. With nine sites there is too little between-site information for any model.
3. **Mv and Cv add nothing for a new site.** Removing them leaves the best unseen-site
   error unchanged or slightly better for both targets.
4. **Linear models extrapolate badly** to a new site (RMSE above the baseline).
5. **Error is uneven across sites** (`outputs/*_site_errors.csv`): Cu RMSE ranges from
   1.5 kPa (site 0) to 17.8 kPa (site 3) among sites with five or more rows.
6. **Held-out feature importance for Cu is indistinguishable from noise**
   (`outputs/cu_feature_importance.csv`): no single feature reliably helps on a new site.

### Feature-engineering experiment (unseen-site validation only)

Question: do de-duplicated or physically motivated features help? Only two plasticity
numbers (LL, PI) and two grain fractions are independent, yet the original sets carried 5
views of LL/PL and a duplicate of fines. Sets tried are defined in
`app/feature_engineering.py`; code in `training/features_experiment.py`.

**Cu_kPa**

| Feature set | Features | Best model | RMSE (kPa) | Change vs `full` (95% CI) |
|---|---|---|---|---|
| `no_mvcv` | 11 | Extra Trees | 12.83 | -0.19 (-2.39 to +1.90) |
| `plasticity_chart` | 6 | Extra Trees | 12.91 | -0.10 (-2.03 to +1.94) |
| `log_scaled` | 8 | XGBoost | 12.92 | -0.09 (-1.52 to +1.39) |
| `full` | 15 | Extra Trees | 13.01 | reference |
| `physics` | 13 | Extra Trees | 13.23 | +0.22 (-0.25 to +0.53) |
| `minimal` | 5 | Extra Trees | 13.25 | +0.24 (-1.56 to +2.37) |
| `minimal_mvcv` | 7 | Extra Trees | 13.55 | +0.54 (-0.06 to +0.87) |
| `selected` | 7 | Extra Trees | 14.30 | +1.28 (+0.46 to +2.32) |

**Phi_deg**

| Feature set | Features | Best model | RMSE (°) | Change vs `full` (95% CI) |
|---|---|---|---|---|
| `physics` | 13 | SVR | 3.18 | -0.10 (-0.58 to +0.66) |
| `minimal_mvcv` | 7 | Random Forest | 3.20 | -0.08 (-0.44 to +0.47) |
| `no_mvcv` | 11 | XGBoost | 3.28 | -0.01 (-0.55 to +0.31) |
| `full` | 14 | Extra Trees | 3.29 | reference |
| `selected` | 7 | XGBoost | 3.37 | +0.08 (-0.39 to +0.52) |
| `minimal` | 5 | XGBoost | 3.42 | +0.13 (-0.36 to +0.51) |
| `log_scaled` | 8 | Random Forest | 3.62 | +0.34 (+0.05 to +0.58) |
| `plasticity_chart` | 6 | Random Forest | 3.63 | +0.35 (+0.06 to +0.60) |

Findings:
- Removing the redundancy costs nothing measurable (`minimal`, 5 features, is within noise
  of the original sets), so fewer inputs are needed.
- No candidate beats the original sets with statistical confidence; nearly every interval
  includes zero with only 9 sites. "Best model per set" favours lucky winners.
- Automatic backward feature selection (done inside each fold, training sites only) was
  significantly *worse* for Cu: with 8 training sites the choice is too noisy.
- A-line distance and log transforms were neutral for Cu and worse for Phi.
- Mv/Cv do not help Cu. For Phi they help slightly once duplicates are removed
  (`minimal` 3.42° vs `minimal_mvcv` 3.20°), within noise.
- Liquidity index (needs natural water content) was tested on the only sites that recorded
  it (3, 4, 7; 102 rows): inconclusive with 3 sites (`outputs/features_li_side_study.csv`).
  The app does not require water content.
- Deployment rule used: the model with the fewest required inputs within bootstrap noise of
  the best, pinned in `training/train.py::DEPLOYMENT`.

## Artifacts (`outputs/`, all written by `training.train`)

| File | Content |
|---|---|
| `{cu,phi}_best_model.joblib` | deployed model, refit on all rows |
| `{cu,phi}_model_meta.json` | model name, feature set, feature list, raw inputs, training ranges, metrics, versions |
| `{cu,phi}_model_comparison.csv` | every model × feature set × protocol |
| `{cu,phi}_oof_predictions.csv` | out-of-fold predictions of the deployed model, with `Site` |
| `{cu,phi}_site_errors.csv` | per-site error when that site is held out |
| `{cu,phi}_feature_importance.csv` | permutation importance on held-out sites (RMSE increase) |
| `{cu,phi}_tuning_log.csv` | SVR / ANN settings chosen in each fold |
| `{cu,phi}_shap_background.csv` | training feature matrix, used for SHAP on non-tree models |
| `geotechnical_*_training_ready.csv` | dense tables with `Site` |
| `figures/*.png` | written by `training.report` |

Stale files from earlier experiments, not read by anything: `cu_model.joblib`,
`phi_model.joblib`, `*_model_scores.csv`, `geotechnical_modeling_dataset.csv`.

## API (`app/`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | model / explainer load status |
| POST | `/predict` | both targets + SHAP + `out_of_range` warnings |
| POST | `/predict/cu`, `/predict/phi` | single target |
| POST | `/explain` | SHAP only |
| GET | `/model-info/cu`, `/model-info/phi` | comparison table, importances, deployment metadata |

- The service reads `*_model_meta.json` to decide which feature set to build. Mv, Cv and
  gravel are optional in the schema and required only if the deployed model's `raw_inputs`
  list them (422 otherwise). The deployed models need just LL, PL, unit weight, fines, sand;
  extra fields are accepted and ignored.
- Rejected with 422: PL > LL, negative values, percentages above 100, gradation summing
  past 100.5 %, unit weight ≤ 0.
- Inputs outside the training range are **not** rejected; they are listed in
  `out_of_range` so the caller can show an extrapolation warning.
- SHAP: `TreeExplainer` for tree models; for SVR / ANN / linear pipelines a
  model-agnostic explainer over a 100-row sample of `*_shap_background.csv`.
- CORS is hard-coded to `allow_origins=["*"]`; `.env.sample`'s `CORS_ORIGINS` is unused.

## UI (`ui/`)

TanStack Start (file-based routes in `src/routes/`: `/`, `/predict`, `/docs`,
`/research`), React Query, shadcn/ui, Recharts. API client: `src/lib/predict-api.ts`
(`VITE_API_BASE_URL`, default `http://127.0.0.1:8000`).

Known gaps on this branch:

- A redesigned UI lives on `feat/redesign-user-interface` and is not merged here.
- UI copy and benchmark tables still state "Extra Trees" and the shuffled R² values;
  they must be updated to the results above.
- The form still asks for Mv, Cv and gravel, which the deployed models do not use.
- `out_of_range` is typed in the client but not yet displayed.
- Blank form fields are submitted as 0.

Generated, never hand-edit: `src/routeTree.gen.ts`, `src/components/ui/*`.

## Conventions

- Python: type hints, `pathlib`, Pydantic v2; only scikit-learn / xgboost estimator
  classes in saved models so they unpickle without importing `training`.
- A new model goes in `training/models.py` as a `ModelSpec`; give it a `param_grid` if
  it needs tuning. Nothing else has to change.
- A new feature goes in `app/feature_engineering.py` only, then retrain.
- Retraining rewrites `outputs/`; commit the model, its metadata and the CSVs together.
- macOS: xgboost needs `brew install libomp`.

## Open questions

- Phi might gain slightly from Mv/Cv (`minimal_mvcv`); within noise, so not deployed.
- More sites would help far more than more algorithms: nine is the binding constraint.
- The Mv header in workbook 8 carries a different unit label (m²/MN ×10⁻⁴) from the
  others; magnitudes look consistent but the unit has not been confirmed with the source.
