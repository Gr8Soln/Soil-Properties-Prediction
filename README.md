# Geotechnical Shear Strength Prediction

Machine-learning pipeline, inference API and web UI that estimate two soil shear-strength
parameters from routine laboratory index tests:

- **Undrained cohesion** `Cu_kPa`
- **Angle of internal friction** `Phi_deg`

Data: 10 laboratory workbooks covering 9 distinct sites, 227 (Cu) / 228 (Phi) complete samples.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt      # macOS also needs: brew install libomp

python -m training.train             # train + compare all models (~10 min)
python -m training.report            # figures -> outputs/figures/
pytest                               # tests
uvicorn app.main:app --reload        # API at http://127.0.0.1:8000 (docs at /docs)
cd ui && bun install && bun run dev  # web UI
```

## Models compared

Linear Regression, Ridge, Random Forest, Extra Trees, Gradient Boosting, XGBoost,
**Support Vector Regression** and an **Artificial Neural Network (MLP)**, against a
predict-the-mean baseline. SVR and the ANN are tuned by nested cross-validation.

Each model is scored under two validation protocols and on two feature sets (with and
without the consolidation results Mv and Cv).

## Results

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

Figures: `outputs/figures/`. Interactive walk-through: `notebooks/Model_Comparison.ipynb`.

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

## Project structure

```
datasets/      raw Excel workbooks, one per site
training/      data loading, model zoo, evaluation, training CLI, figures
app/           FastAPI service (features, model service, schemas, routes)
tests/         pytest suite
notebooks/     results notebook, original modelling notebooks, legacy/
outputs/       trained models, metadata, comparison tables, figures
ui/            React web interface
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Model and explainer load status |
| `POST` | `/predict` | Cu and Phi with SHAP explanations and out-of-range warnings (needs only LL, PL, unit weight, fines, sand) |
| `POST` | `/predict/cu`, `/predict/phi` | Single-target prediction |
| `POST` | `/explain` | SHAP explanations only |
| `GET` | `/model-info/cu`, `/model-info/phi` | Comparison table, importances, deployment metadata |

Physically impossible inputs (PL above LL, negative values, gradation above 100 %) are
rejected with `422`. Inputs outside the range of the training data are accepted and
reported in `out_of_range`.

## Limitations

- Nine sites. Accuracy on a new site is modest (R² about 0.3–0.4) and varies a lot from
  site to site; predictions are a screening aid, not a substitute for testing.
- Target ranges are narrow (Cu 0–85 kPa, Phi 2–18°); the models cannot predict beyond them.
- See `AGENT.md` for data details, conventions and open questions.

## References

- Terzaghi, K., Peck, R. B., & Mesri, G. (1996). *Soil Mechanics in Engineering Practice*.
- Kulhawy, F. H., & Mayne, P. W. (1990). *Manual on Estimating Soil Properties for Foundation Design*.
