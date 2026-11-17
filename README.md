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

| Target | Deployed model | Feature set | Unseen site R² / RMSE | Shuffled R² / RMSE |
|---|---|---|---|---|
| Cu_kPa | Extra Trees | no_mvcv | 0.38 / 12.83 kPa | 0.74 / 8.28 kPa |
| Phi_deg | XGBoost | no_mvcv | 0.32 / 3.28° | 0.82 / 1.70° |

Chosen automatically: lowest RMSE on unseen sites, across both feature sets. Both winners
happen to be the variants that do **not** use Mv/Cv; the margins over the next candidate
are small (Cu 0.13 kPa, Phi 0.006°) and should be read as ties.

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
| `POST` | `/predict` | Cu and Phi with SHAP explanations and out-of-range warnings |
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
